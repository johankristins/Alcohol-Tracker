import { SystembolagetProduct, ProductInfo, ProductSearchResult, Drink } from '../types';

class SystembolagetService {
  private products: SystembolagetProduct[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
  private readonly DATA_URL = 'https://raw.githubusercontent.com/AlexGustafsson/systembolaget-api-data/main/data/assortment.json';
  private readonly API_BASE_URL = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000/api' 
    : '/api';
  private readonly USE_BACKEND_API = true; // Set to false to use direct GitHub API

  /**
   * Initialize the service and fetch product data if needed
   */
  async initialize(): Promise<void> {
    const now = Date.now();
    
    // Check if we need to fetch new data
    if (this.products.length === 0 || (now - this.lastFetch) > this.CACHE_DURATION) {
      await this.fetchProducts();
    }
  }

  /**
   * Fetch products from Systembolaget API data
   */
  private async fetchProducts(): Promise<void> {
    try {
      console.log('Fetching Systembolaget products...');
      const response = await fetch(this.DATA_URL);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }
      
      const products: SystembolagetProduct[] = await response.json();
      
      // Filter out discontinued and out of stock products for better results
      this.products = products.filter(product => 
        !product.isDiscontinued && 
        !product.isCompletelyOutOfStock &&
        product.alcoholPercentage > 0 // Only alcoholic products
      );
      
      this.lastFetch = Date.now();
      console.log(`Loaded ${this.products.length} Systembolaget products`);
      
      // Store in localStorage for offline access
      try {
        localStorage.setItem('systembolaget_products', JSON.stringify({
          products: this.products,
          timestamp: this.lastFetch
        }));
      } catch (e) {
        console.warn('Could not store products in localStorage:', e);
      }
      
    } catch (error) {
      console.error('Error fetching Systembolaget products:', error);
      
      // Try to load from localStorage as fallback
      try {
        const cached = localStorage.getItem('systembolaget_products');
        if (cached) {
          const { products, timestamp } = JSON.parse(cached);
          // Use cached data if it's not too old (7 days)
          if (Date.now() - timestamp < 1000 * 60 * 60 * 24 * 7) {
            this.products = products;
            this.lastFetch = timestamp;
            console.log('Loaded products from cache');
          }
        }
      } catch (e) {
        console.warn('Could not load cached products:', e);
      }
    }
  }

  /**
   * Search for products by EAN/barcode
   */
  async searchByEAN(ean: string): Promise<ProductSearchResult | null> {
    if (this.USE_BACKEND_API) {
      try {
        const response = await fetch(`${this.API_BASE_URL}/systembolaget/search/ean/${encodeURIComponent(ean)}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn('Backend API not available, falling back to direct search:', error);
      }
    }

    // Fallback to direct search
    await this.initialize();
    
    // Systembolaget doesn't store EAN codes directly, but we can try to match by product number
    const product = this.products.find(p => 
      p.productNumber === ean || 
      p.productNumberShort === ean ||
      p.productId === ean
    );
    
    if (product) {
      return {
        product,
        source: 'systembolaget',
        confidence: 1.0
      };
    }
    
    return null;
  }

  /**
   * Search for products by name, brand, or other text
   */
  async searchByText(query: string): Promise<ProductSearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    if (this.USE_BACKEND_API) {
      try {
        const response = await fetch(`${this.API_BASE_URL}/systembolaget/search/text?query=${encodeURIComponent(query)}&maxResults=20`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn('Backend API not available, falling back to direct search:', error);
      }
    }

    // Fallback to direct search
    await this.initialize();
    
    const searchTerm = query.toLowerCase().trim();
    const results: ProductSearchResult[] = [];
    
    for (const product of this.products) {
      let score = 0;
      let matches = 0;
      
      // Search in product names
      const fullName = `${product.productNameBold} ${product.productNameThin}`.toLowerCase();
      if (fullName.includes(searchTerm)) {
        score += fullName === searchTerm ? 10 : 5;
        matches++;
      }
      
      // Search in producer name
      if (product.producerName.toLowerCase().includes(searchTerm)) {
        score += 3;
        matches++;
      }
      
      // Search in product number
      if (product.productNumber.includes(searchTerm) || product.productNumberShort.includes(searchTerm)) {
        score += 8;
        matches++;
      }
      
      // Search in category
      if (product.categoryLevel1.toLowerCase().includes(searchTerm) ||
          product.categoryLevel2.toLowerCase().includes(searchTerm) ||
          (product.categoryLevel3 && product.categoryLevel3.toLowerCase().includes(searchTerm))) {
        score += 2;
        matches++;
      }
      
      // Search in country
      if (product.country.toLowerCase().includes(searchTerm)) {
        score += 1;
        matches++;
      }
      
      // Search in grapes
      for (const grape of product.grapes) {
        if (grape.toLowerCase().includes(searchTerm)) {
          score += 2;
          matches++;
          break;
        }
      }
      
      if (matches > 0) {
        const confidence = Math.min(score / 10, 1.0);
        results.push({
          product,
          source: 'systembolaget',
          confidence
        });
      }
    }
    
    // Sort by confidence and return top 20 results
    return results
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20);
  }

  /**
   * Convert SystembolagetProduct to ProductInfo
   */
  convertToProductInfo(product: SystembolagetProduct): ProductInfo {
    const fullName = `${product.productNameBold} ${product.productNameThin}`.trim();
    
    // Determine drink type based on category
    let type: Drink['type'] = 'other';
    const category1 = product.categoryLevel1.toLowerCase();
    
    if (category1.includes('öl') || category1.includes('beer')) {
      type = 'beer';
    } else if (category1.includes('vin') || category1.includes('wine')) {
      type = 'wine';
    } else if (category1.includes('sprit') || category1.includes('spirit') || 
               category1.includes('whisky') || category1.includes('vodka') ||
               category1.includes('gin') || category1.includes('rom') ||
               category1.includes('cognac') || category1.includes('brandy')) {
      type = 'spirit';
    } else if (category1.includes('cocktail') || category1.includes('drink')) {
      type = 'cocktail';
    }
    
    return {
      name: fullName,
      brand: product.producerName,
      volume: product.volume / 10, // Convert ml to cl
      alcoholPercentage: product.alcoholPercentage,
      type,
      price: product.price,
      country: product.country,
      image: product.images.length > 0 ? product.images[0].imageUrl : undefined,
      productNumber: product.productNumber,
      systembolagetProduct: product
    };
  }

  /**
   * Get random featured products
   */
  async getFeaturedProducts(count: number = 10): Promise<ProductInfo[]> {
    await this.initialize();
    
    // Get products from different categories
    const categories = ['Vin', 'Öl', 'Sprit'];
    const featured: SystembolagetProduct[] = [];
    
    for (const category of categories) {
      const categoryProducts = this.products
        .filter(p => p.categoryLevel1 === category && p.images.length > 0)
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.ceil(count / categories.length));
      
      featured.push(...categoryProducts);
    }
    
    return featured
      .slice(0, count)
      .map(product => this.convertToProductInfo(product));
  }

  /**
   * Get product statistics
   */
  async getStats(): Promise<{
    totalProducts: number;
    categories: { [key: string]: number };
    priceRange: { min: number; max: number; average: number };
  }> {
    await this.initialize();
    
    const categories: { [key: string]: number } = {};
    let totalPrice = 0;
    let minPrice = Infinity;
    let maxPrice = 0;
    
    for (const product of this.products) {
      // Count categories
      if (categories[product.categoryLevel1]) {
        categories[product.categoryLevel1]++;
      } else {
        categories[product.categoryLevel1] = 1;
      }
      
      // Calculate price stats
      totalPrice += product.price;
      minPrice = Math.min(minPrice, product.price);
      maxPrice = Math.max(maxPrice, product.price);
    }
    
    return {
      totalProducts: this.products.length,
      categories,
      priceRange: {
        min: minPrice,
        max: maxPrice,
        average: Math.round(totalPrice / this.products.length)
      }
    };
  }
}

// Export a singleton instance
export const systembolagetService = new SystembolagetService();
export default systembolagetService;
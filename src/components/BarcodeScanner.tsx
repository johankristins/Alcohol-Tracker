import React, { useState, useRef, useEffect } from 'react';
import { Drink, ProductInfo } from '../types';
import Quagga from 'quagga';
import systembolagetService from '../utils/systembolagetService';

interface BarcodeScannerProps {
  onDrinkFound: (drink: Drink) => void;
  onCancel: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDrinkFound, onCancel }) => {
  const [barcode, setBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'barcode' | 'search'>('barcode');
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [searchResults, setSearchResults] = useState<ProductInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isQuaggaInitialized, setIsQuaggaInitialized] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  // Mock product database - i verkligheten skulle detta vara en riktig databas eller API
  const productDatabase: Record<string, ProductInfo> = {
    '7310865000000': { name: 'Carlsberg', brand: 'Carlsberg', volume: 33, alcoholPercentage: 5.0, type: 'beer' },
    '7310865000001': { name: 'Heineken', brand: 'Heineken', volume: 33, alcoholPercentage: 5.0, type: 'beer' },
    '7310865000002': { name: 'Tuborg', brand: 'Tuborg', volume: 33, alcoholPercentage: 4.6, type: 'beer' },
    '7310865000003': { name: 'Pripps Blå', brand: 'Pripps', volume: 50, alcoholPercentage: 5.2, type: 'beer' },
    '7310865000004': { name: 'Mariestads', brand: 'Mariestads', volume: 50, alcoholPercentage: 5.2, type: 'beer' },
    '7310865000005': { name: 'Falcon', brand: 'Falcon', volume: 50, alcoholPercentage: 5.2, type: 'beer' },
    '7310865000006': { name: 'Chardonnay', brand: 'Lindemans', volume: 75, alcoholPercentage: 13.5, type: 'wine' },
    '7310865000007': { name: 'Cabernet Sauvignon', brand: 'Jacob\'s Creek', volume: 75, alcoholPercentage: 13.5, type: 'wine' },
    '7310865000008': { name: 'Absolut Vodka', brand: 'Absolut', volume: 70, alcoholPercentage: 40, type: 'spirit' },
    '7310865000009': { name: 'Jack Daniel\'s', brand: 'Jack Daniel\'s', volume: 70, alcoholPercentage: 40, type: 'spirit' },
  };

  const searchProduct = async (barcode: string): Promise<ProductInfo | null> => {
    setIsLoading(true);
    
    try {
      // 1. First check local product database
      if (productDatabase[barcode]) {
        return productDatabase[barcode];
      }

      // 2. Search in Systembolaget data by product number or EAN
      console.log('Searching Systembolaget for:', barcode);
      const systembolagetResult = await systembolagetService.searchByEAN(barcode);
      if (systembolagetResult) {
        console.log('Found in Systembolaget:', systembolagetResult.product.productNameBold);
        return systembolagetService.convertToProductInfo(systembolagetResult.product);
      }

      // 3. If not found by EAN, try text search in Systembolaget (in case barcode matches name/number)
      const textResults = await systembolagetService.searchByText(barcode);
      if (textResults.length > 0 && textResults[0].confidence > 0.7) {
        console.log('Found in Systembolaget by text search:', textResults[0].product.productNameBold);
        return systembolagetService.convertToProductInfo(textResults[0].product);
      }

      // 4. Finally, try Open Food Facts API as fallback
      console.log('Searching Open Food Facts for:', barcode);
      const apiResponse = await searchOpenFoodFacts(barcode);
      return apiResponse;
      
    } catch (error) {
      console.error('Error searching for product:', error);
      return null;
    }
  };

  const searchOpenFoodFacts = async (barcode: string): Promise<ProductInfo | null> => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      
      if (data.status === 0 || !data.product) {
        return null;
      }
      
      const product = data.product;
      
      // Extrahera produktinformation
      const name = product.product_name || product.product_name_en || product.generic_name || 'Okänd produkt';
      const brand = product.brands || product.brand_owner;
      
      // Hitta alkoholhalt
      let alcoholPercentage = 0;
      if (product.nutriments?.alcohol_100g) {
        alcoholPercentage = product.nutriments.alcohol_100g;
      } else if (product.nutriments?.alcohol) {
        alcoholPercentage = product.nutriments.alcohol;
      }
      
      // Hitta volym
      let volume = 0;
      if (product.quantity) {
        // Försök extrahera volym från quantity (t.ex. "330 ml" -> 33cl)
        const quantityMatch = product.quantity.match(/(\d+)\s*(ml|cl|l)/i);
        if (quantityMatch) {
          const value = parseInt(quantityMatch[1]);
          const unit = quantityMatch[2].toLowerCase();
          if (unit === 'ml') {
            volume = value / 10; // Konvertera till cl
          } else if (unit === 'cl') {
            volume = value;
          } else if (unit === 'l') {
            volume = value * 100; // Konvertera till cl
          }
        }
      }
      
      // Bestäm dryckestyp baserat på kategorier och namn
      let type: Drink['type'] = 'other';
      const categories = product.categories_tags || [];
      const productName = name.toLowerCase();
      
      if (categories.some((cat: string) => cat.includes('beers')) || 
          productName.includes('öl') || productName.includes('beer') ||
          productName.includes('lager') || productName.includes('pilsner')) {
        type = 'beer';
      } else if (categories.some((cat: string) => cat.includes('wines')) || 
                 productName.includes('vin') || productName.includes('wine') ||
                 productName.includes('chardonnay') || productName.includes('cabernet')) {
        type = 'wine';
      } else if (categories.some((cat: string) => cat.includes('spirits')) || 
                 productName.includes('vodka') || productName.includes('whisky') ||
                 productName.includes('gin') || productName.includes('rum') ||
                 productName.includes('sprit')) {
        type = 'spirit';
      } else if (productName.includes('cocktail') || productName.includes('drink')) {
        type = 'cocktail';
      }
      
      // Om vi inte hittade alkoholhalt, försök med standardvärden baserat på typ
      if (alcoholPercentage === 0) {
        switch (type) {
          case 'beer':
            alcoholPercentage = 5.0;
            break;
          case 'wine':
            alcoholPercentage = 12.0;
            break;
          case 'spirit':
            alcoholPercentage = 40.0;
            break;
          default:
            alcoholPercentage = 5.0;
        }
      }
      
      // Om vi inte hittade volym, använd standardvärden
      if (volume === 0) {
        switch (type) {
          case 'beer':
            volume = 33;
            break;
          case 'wine':
            volume = 75;
            break;
          case 'spirit':
            volume = 70;
            break;
          default:
            volume = 33;
        }
      }
      
      return {
        name,
        brand,
        volume,
        alcoholPercentage,
        type
      };
      
    } catch (error) {
      console.error('Error fetching from Open Food Facts:', error);
      return null;
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    setIsLoading(true);
    setError('');
    setProductInfo(null);
    
    try {
      const product = await searchProduct(barcode);
      if (product) {
        setProductInfo(product);
      } else {
        setError('Produkt hittades inte. Kontrollera streckkoden eller prova textsökning.');
      }
    } catch (err) {
      setError('Ett fel uppstod vid sökning av produkt.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSearch = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const results = await systembolagetService.searchByText(query);
      const productInfos = results.map(result => 
        systembolagetService.convertToProductInfo(result.product)
      );
      setSearchResults(productInfos);
    } catch (err) {
      setError('Ett fel uppstod vid textsökning.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    clearTimeout((window as any).searchTimeout);
    (window as any).searchTimeout = setTimeout(() => {
      handleTextSearch(query);
    }, 300);
  };

  const handleAddDrink = () => {
    if (!productInfo) return;

    const drink: Drink = {
      id: '',
      name: productInfo.name,
      type: productInfo.type,
      volume: productInfo.volume || 33,
      alcoholPercentage: productInfo.alcoholPercentage || 5.0,
      standardUnits: (productInfo.volume || 33) * (productInfo.alcoholPercentage || 5.0) / 100
    };

    onDrinkFound(drink);
  };

  const startCamera = () => {
    if (!videoRef.current) return;

    // Kontrollera om vi är på HTTPS (krävs för kamera på desktop)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setError('Kamera kräver HTTPS för att fungera på desktop. Använd manuell inmatning istället.');
      return;
    }

    // Detektera om vi är på mobil eller desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Försök med Quagga först
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: videoRef.current,
        constraints: {
          width: isMobile ? 640 : 1280,
          height: isMobile ? 480 : 720,
          facingMode: isMobile ? "environment" : "user", // Använd framkamera på desktop
          aspectRatio: { min: 1, max: 2 }
        },
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: isMobile ? 2 : 4, // Fler workers på desktop
      frequency: isMobile ? 10 : 5, // Lägre frekvens på desktop för bättre prestanda
      decoder: {
        readers: [
          "ean_reader",
          "ean_8_reader",
          "code_128_reader",
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader"
        ]
      },
      locate: true
    }, (err) => {
      if (err) {
        console.error('Quagga init error:', err);
        
        // Om Quagga misslyckas, försök med enkel kamera
        if (isMobile) {
          setError('Kunde inte starta kameran. Använd manuell inmatning istället.');
        } else {
          // På desktop, visa instruktioner för manuell inmatning
          setError('Kamera fungerar bäst på mobil. Använd manuell inmatning på desktop.');
        }
        return;
      }
      
      setIsQuaggaInitialized(true);
      setIsScanning(true);
      Quagga.start();
    });

    // Lyssnare för när streckkod hittas
    Quagga.onDetected((result) => {
      const code = result.codeResult.code;
      console.log('Barcode detected:', code);
      setBarcode(code);
      
      // Stoppa scanning och sök produkt
      stopCamera();
      
      // Automatiskt sök produkt
      handleBarcodeSearch(code);
    });
  };

  const stopCamera = () => {
    try {
      if (isQuaggaInitialized && Quagga) {
        Quagga.stop();
        Quagga.offDetected(() => {});
      }
    } catch (error) {
      console.error('Error stopping Quagga:', error);
    }
    setIsQuaggaInitialized(false);
    setIsScanning(false);
  };

  const handleBarcodeSearch = async (code: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const product = await searchProduct(code);
      if (product) {
        setProductInfo(product);
      } else {
        setError('Produkt hittades inte. Kontrollera streckkoden eller lägg till manuellt.');
      }
    } catch (err) {
      setError('Ett fel uppstod vid sökning av produkt.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      try {
        if (isQuaggaInitialized && Quagga) {
          Quagga.stop();
          Quagga.offDetected(() => {});
        }
      } catch (error) {
        console.error('Error cleaning up Quagga:', error);
      }
    };
  }, [isQuaggaInitialized]);

  return (
    <div className="barcode-scanner">
      <div className="scanner-header">
        <h3>Skanna streckkod</h3>
        <button type="button" className="close-btn" onClick={onCancel}>
          ✕
        </button>
      </div>

      <div className="scanner-tabs">
        <button 
          type="button" 
          className={`tab-btn ${activeTab === 'barcode' && !isScanning ? 'active' : ''}`}
          onClick={() => { setActiveTab('barcode'); setIsScanning(false); }}
        >
          Streckkod
        </button>
        <button 
          type="button" 
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => { setActiveTab('search'); setIsScanning(false); }}
        >
          Sök produkt
        </button>
        <button 
          type="button" 
          className={`tab-btn ${isScanning ? 'active' : ''}`}
          onClick={() => { setActiveTab('barcode'); setIsScanning(true); }}
        >
          Kamera
        </button>
      </div>

      {activeTab === 'search' ? (
        <div className="search-input">
          <div className="form-group">
            <label htmlFor="search">Sök efter dryck</label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={handleSearchQueryChange}
              placeholder="Skriv namn på dryck, producent eller produktnummer..."
              disabled={isLoading}
            />
          </div>
          
          {isLoading && (
            <div className="loading-spinner">
              <span className="spinner"></span>
              Söker i Systembolagets sortiment...
            </div>
          )}
          
          {searchResults.length > 0 && (
            <div className="search-results">
              <h4>Sökresultat ({searchResults.length})</h4>
              <div className="results-list">
                {searchResults.map((product, index) => (
                  <div key={index} className="result-item" onClick={() => setProductInfo(product)}>
                    {product.image && (
                      <img src={product.image} alt={product.name} className="result-image" />
                    )}
                    <div className="result-info">
                      <div className="result-name">{product.name}</div>
                      <div className="result-details">
                        {product.brand && <span>{product.brand} • </span>}
                        <span>{product.volume}cl • {product.alcoholPercentage}%</span>
                        {product.price && <span> • {product.price}kr</span>}
                      </div>
                      {product.country && <div className="result-country">{product.country}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : !isScanning ? (
        <div className="manual-input">
          <form onSubmit={handleBarcodeSubmit}>
            <div className="form-group">
              <label htmlFor="barcode">Streckkod</label>
              <input
                id="barcode"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Ange 13-siffrig streckkod eller produktnummer"
                disabled={isLoading}
              />
            </div>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  Söker produkt...
                </span>
              ) : (
                'Sök produkt'
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="camera-section">
          <div className="camera-container">
            <div ref={videoRef} className="camera-video"></div>
            <div className="scan-overlay">
              <div className="scan-frame"></div>
            </div>
          </div>
          <div className="camera-controls">
            <button type="button" className="camera-btn" onClick={startCamera}>
              📷 Starta kamera
            </button>
            <button type="button" className="camera-btn" onClick={stopCamera}>
              ⏹️ Stoppa kamera
            </button>
          </div>
          <div className="camera-instructions">
            <p>📱 Rikta kameran mot streckkoden på drycken</p>
            <p>🎯 Håll kameran stilla för bästa resultat</p>
            {!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
              <div className="desktop-notice">
                <p>💻 <strong>Desktop-tips:</strong> Kamera fungerar bäst på mobil. Använd manuell inmatning för snabbare resultat.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {productInfo && (
        <div className="product-info">
          <h4>Produkt hittad!</h4>
          {productInfo.image && (
            <div className="product-image">
              <img src={productInfo.image} alt={productInfo.name} />
            </div>
          )}
          <div className="product-details">
            <p><strong>Namn:</strong> {productInfo.name}</p>
            {productInfo.brand && <p><strong>Producent:</strong> {productInfo.brand}</p>}
            <p><strong>Volym:</strong> {productInfo.volume}cl</p>
            <p><strong>Alkoholhalt:</strong> {productInfo.alcoholPercentage}%</p>
            <p><strong>Typ:</strong> {productInfo.type}</p>
            {productInfo.price && <p><strong>Pris:</strong> {productInfo.price}kr</p>}
            {productInfo.country && <p><strong>Land:</strong> {productInfo.country}</p>}
            {productInfo.productNumber && <p><strong>Artikelnummer:</strong> {productInfo.productNumber}</p>}
            {productInfo.systembolagetProduct && (
              <>
                <p><strong>Kategori:</strong> {productInfo.systembolagetProduct.customCategoryTitle}</p>
                {productInfo.systembolagetProduct.vintage && (
                  <p><strong>Årgång:</strong> {productInfo.systembolagetProduct.vintage}</p>
                )}
                {productInfo.systembolagetProduct.grapes.length > 0 && (
                  <p><strong>Druvor:</strong> {productInfo.systembolagetProduct.grapes.join(', ')}</p>
                )}
                {productInfo.systembolagetProduct.taste && (
                  <p><strong>Smak:</strong> {productInfo.systembolagetProduct.taste}</p>
                )}
              </>
            )}
          </div>
          <button type="button" className="add-drink-btn" onClick={handleAddDrink}>
            Lägg till dryck
          </button>
        </div>
      )}
    </div>
  );
}; 
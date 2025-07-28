import React, { useState, useRef, useEffect } from 'react';
import { Drink } from '../types';
import Quagga from 'quagga';

interface BarcodeScannerProps {
  onDrinkFound: (drink: Drink) => void;
  onCancel: () => void;
}

interface ProductInfo {
  name: string;
  brand?: string;
  volume?: number;
  alcoholPercentage?: number;
  type: Drink['type'];
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDrinkFound, onCancel }) => {
  const [barcode, setBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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
    // Simulera API-anrop
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Först kolla i vår lokala databas
    if (productDatabase[barcode]) {
      return productDatabase[barcode];
    }

    // Om inte hittat lokalt, sök i Open Food Facts API
    const apiResponse = await searchOpenFoodFacts(barcode);
    return apiResponse;
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
    
    try {
      const product = await searchProduct(barcode);
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

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: videoRef.current,
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment"
        },
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: 2,
      frequency: 10,
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
        setError('Kunde inte starta kameran. Kontrollera behörigheter.');
        console.error('Quagga init error:', err);
        return;
      }
      
      setIsScanning(true);
      Quagga.start();
    });

    // Lyssnare för när streckkod hittas
    Quagga.onDetected((result) => {
      const code = result.codeResult.code;
      setBarcode(code);
      
      // Stoppa scanning och sök produkt
      Quagga.stop();
      setIsScanning(false);
      
      // Automatiskt sök produkt
      handleBarcodeSearch(code);
    });
  };

  const stopCamera = () => {
    Quagga.stop();
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
      Quagga.stop();
      Quagga.offDetected(() => {});
    };
  }, []);

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
          className={`tab-btn ${!isScanning ? 'active' : ''}`}
          onClick={() => setIsScanning(false)}
        >
          Manuell inmatning
        </button>
        <button 
          type="button" 
          className={`tab-btn ${isScanning ? 'active' : ''}`}
          onClick={() => setIsScanning(true)}
        >
          Kamera
        </button>
      </div>

      {!isScanning ? (
        <div className="manual-input">
          <form onSubmit={handleBarcodeSubmit}>
            <div className="form-group">
              <label htmlFor="barcode">Streckkod</label>
              <input
                id="barcode"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Ange 13-siffrig streckkod"
                maxLength={13}
                pattern="[0-9]{13}"
                required
                disabled={isLoading}
              />
            </div>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  Söker i Open Food Facts...
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
          <div className="product-details">
            <p><strong>Namn:</strong> {productInfo.name}</p>
            {productInfo.brand && <p><strong>Märke:</strong> {productInfo.brand}</p>}
            <p><strong>Volym:</strong> {productInfo.volume}cl</p>
            <p><strong>Alkoholhalt:</strong> {productInfo.alcoholPercentage}%</p>
            <p><strong>Typ:</strong> {productInfo.type}</p>
          </div>
          <button type="button" className="add-drink-btn" onClick={handleAddDrink}>
            Lägg till dryck
          </button>
        </div>
      )}
    </div>
  );
}; 
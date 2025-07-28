import React, { useState, useRef, useEffect } from 'react';
import { Drink } from '../types';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Om inte hittat lokalt, simulera extern API-sökning
    // I verkligheten skulle du här anropa ett riktigt API som t.ex. Open Food Facts
    const mockApiResponse = await mockExternalApi(barcode);
    return mockApiResponse;
  };

  const mockExternalApi = async (barcode: string): Promise<ProductInfo | null> => {
    // Simulera extern API-sökning
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulera att vissa streckkoder ger resultat
    if (barcode.startsWith('7310865')) {
      return {
        name: `Produkt ${barcode.slice(-4)}`,
        volume: 33,
        alcoholPercentage: 5.0,
        type: 'beer'
      };
    }
    
    return null;
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (err) {
      setError('Kunde inte komma åt kameran. Kontrollera behörigheter.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
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
              />
            </div>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Söker...' : 'Sök produkt'}
            </button>
          </form>
        </div>
      ) : (
        <div className="camera-section">
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
            />
            <canvas ref={canvasRef} className="camera-canvas" />
            <div className="scan-overlay">
              <div className="scan-frame"></div>
            </div>
          </div>
          <button type="button" className="camera-btn" onClick={startCamera}>
            Starta kamera
          </button>
          <button type="button" className="camera-btn" onClick={stopCamera}>
            Stoppa kamera
          </button>
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
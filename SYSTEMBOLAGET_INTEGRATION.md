# 🍻 Systembolaget Integration

Denna app har nu integrerats med Systembolagets produktdata för att ge användarna tillgång till hela det svenska alkoholsortimentet när de skannar streckkoder eller söker efter produkter.

## 🚀 Funktioner

### Streckkodsskanning
- **Systembolaget-produkter**: Söker först i Systembolagets databas med produktnummer
- **Internationella produkter**: Fallback till Open Food Facts API för produkter som inte finns på Systembolaget
- **Lokal databas**: Hårdkodade populära produkter för snabb åtkomst

### Textsökning
- **Produktnamn**: Sök efter dryckens namn (t.ex. "Absolut Vodka")
- **Producent**: Sök efter tillverkare (t.ex. "Spendrups")
- **Produktnummer**: Sök med Systembolagets artikelnummer
- **Kategori**: Sök efter typ av dryck (t.ex. "Rött vin")
- **Land**: Sök efter ursprungsland
- **Druvor**: Sök efter druvsort för viner

### Produktinformation
- **Grundläggande**: Namn, volym, alkoholhalt, pris
- **Detaljerad**: Producent, land, årgång, druvor, smakbeskrivning
- **Visuell**: Produktbilder från Systembolaget
- **Kategorisering**: Automatisk klassificering som öl, vin, sprit, etc.

## 🏗️ Teknisk implementation

### Frontend (React/TypeScript)
```typescript
// Systembolaget service
import systembolagetService from '../utils/systembolagetService';

// Sök med streckkod
const result = await systembolagetService.searchByEAN('1234567890123');

// Textsökning
const results = await systembolagetService.searchByText('Absolut Vodka');
```

### Backend (.NET Core)
```csharp
// API endpoints
GET /api/systembolaget/search/ean/{ean}
GET /api/systembolaget/search/text?query={query}&maxResults={max}
GET /api/systembolaget/stats
POST /api/systembolaget/refresh
```

### Datakälla
- **Primär**: [AlexGustafsson/systembolaget-api-data](https://github.com/AlexGustafsson/systembolaget-api-data)
- **Uppdatering**: Automatisk cache med 24-timmars uppdateringsintervall
- **Storlek**: ~20,000+ produkter efter filtrering (ej utgångna/slutsålda)

## 📊 Datahantering

### Caching
- **Frontend**: LocalStorage med 24-timmars cache
- **Backend**: Filbaserad cache med automatisk uppdatering
- **Fallback**: Offline-läge med cached data i upp till 7 dagar

### Filtrering
- Utgångna produkter filtreras bort
- Slutsålda produkter exkluderas
- Endast alkoholhaltiga drycker inkluderas (>0% alkohol)

### Sökalgorithm
Poängbaserat system som väger:
- **Exakt matchning** (10 poäng): Produktnamn
- **Produktnummer** (8 poäng): Artikelnummer/kort nummer
- **Namn** (5 poäng): Partiell matchning i produktnamn
- **Producent** (3 poäng): Tillverkarens namn
- **Kategori** (2 poäng): Dryckeskategori
- **Druvor** (2 poäng): Druvsort (för vin)
- **Land** (1 poäng): Ursprungsland

## 🎨 Användargränssnitt

### Flikar
1. **Streckkod**: Manuell inmatning av streckkod/produktnummer
2. **Sök produkt**: Textsökning i Systembolagets sortiment
3. **Kamera**: Streckkodsskanning med kamera (mobil/desktop)

### Sökresultat
- **Produktbild**: Visar Systembolagets officiella produktbild
- **Grundinfo**: Namn, producent, volym, alkoholhalt, pris
- **Metadata**: Land, kategori, artikelnummer
- **Detaljinfo**: Årgång, druvor, smakbeskrivning (när tillgängligt)

### Responsiv design
- **Mobil**: Optimerad för touch-interaktion
- **Desktop**: Stöd för tangentbord och mus
- **Offline**: Fungerar med cached data

## 🔧 Konfiguration

### Environment Variables
```bash
# Frontend
REACT_APP_API_URL=http://localhost:5000/api

# Backend
ASPNETCORE_ENVIRONMENT=Development
```

### Inställningar
```typescript
// Aktivera/inaktivera backend API
private readonly USE_BACKEND_API = true;

// Cache-inställningar
private readonly CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 timmar
```

## 📈 Prestandaoptimering

### Lazy Loading
- Data laddas endast när det behövs
- Progressiv laddning av sökresultat

### Debouncing
- Textsökning debounced med 300ms fördröjning
- Förhindrar överflödiga API-anrop

### Caching Strategy
- **L1**: In-memory cache (runtime)
- **L2**: LocalStorage (browser)
- **L3**: Backend file cache
- **L4**: GitHub raw data (fallback)

## 🚦 Felhantering

### Graceful Degradation
1. **Backend API** → **Direct GitHub** → **LocalStorage** → **Hårdkodad data**
2. Automatisk fallback mellan datakällor
3. Informativa felmeddelanden till användaren

### Logging
- Frontend: Console logging för debug
- Backend: Structured logging med olika nivåer
- Felhändelser spåras för förbättring

## 🔄 Uppdateringsprocess

### Automatisk uppdatering
- Kontrollerar dagligen efter nya data
- Transparent uppdatering i bakgrunden
- Använder cached data under uppdatering

### Manuell uppdatering
```bash
# Via API
POST /api/systembolaget/refresh

# Via frontend
systembolagetService.initialize(true); // Force refresh
```

## 📱 Mobil-optimering

### Kameraintegration
- **iOS Safari**: WebRTC-stöd med fallback
- **Android Chrome**: Nativ kamerastöd
- **Desktop**: Webcam-stöd där tillgängligt

### Touch-gränssnitt
- Stora touch-targets för sökresultat
- Swipe-gester för navigation
- Haptic feedback där stött

## 🔐 Säkerhet & Integritet

### API-säkerhet
- CORS konfigurerat för specifika domäner
- Input validering på alla endpoints
- Rate limiting (planerat)

### Datahantering
- Ingen känslig användardata lagras
- Endast produktsökning och cache
- GDPR-kompatibel implementation

## 🎯 Framtida förbättringar

### Planerade funktioner
- [ ] Favoriter och önskelista
- [ ] Prishistorik och trender  
- [ ] Butikslagerstatus
- [ ] Personliga rekommendationer
- [ ] Offline-läge med full funktionalitet

### Tekniska förbättringar
- [ ] GraphQL API för bättre prestanda
- [ ] Redis cache för backend
- [ ] CDN för produktbilder
- [ ] Progressive Web App (PWA)

## 📞 Support

För frågor eller problem med Systembolaget-integrationen:
1. Kontrollera nätverksanslutning
2. Rensa browser cache
3. Testa med olika söktermer
4. Rapportera bugs via GitHub Issues

---

**Utvecklad med ❤️ för svenska alkoholkonsumenter**
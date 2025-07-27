# 🍺 Alcohol Tracker

En komplett alkohol tracker app med React frontend och .NET backend med SQLite databas.

## 📋 Projektöversikt

Denna app låter dig spåra din alkoholkonsumtion genom att registrera drycker med volym och alkoholhalt, beräkna standardenheter automatiskt, och visa statistik över tid.

### Funktioner

- **Registrering av drycker** med snabblägg eller anpassad form
- **Automatisk beräkning** av standardenheter (12g ren alkohol)
- **Statistik och diagram** per dag, vecka, månad
- **SQLite databas** för persistent lagring
- **Modern UI** med responsiv design
- **REST API** med Swagger dokumentation

## 🏗️ Teknisk stack

### Frontend
- **React 18** med TypeScript
- **Modern CSS** med Grid och Flexbox
- **Responsiv design** för alla enheter

### Backend
- **.NET 8** Web API
- **Entity Framework Core** med SQLite
- **Swagger/OpenAPI** för dokumentation
- **CORS** konfigurerad för React

## 🚀 Installation och körning

### Förutsättningar
- Node.js 18+ och npm
- .NET 8 SDK
- Git

### Steg för att köra

1. **Klona repository:**
   ```bash
   git clone <repository-url>
   cd alcohol-tracker
   ```

2. **Backend (Azure):**
   Backend API:et är publicerat på Azure och körs på:
   `https://alcohol-tracker-hxbkd9d6bng5apgt.swedencentral-01.azurewebsites.net`

3. **Frontend (Azure Static Web App):**
   Frontend är publicerad på Azure Static Web App:
   `https://gray-bay-09e10e803.2.azurestaticapps.net`
   
   För lokal utveckling:
   ```bash
   npm install
   npm start
   ```
   Lokal frontend körs på `http://localhost:3000`

4. **Öppna appen:**
   - Produktion: Gå till `https://gray-bay-09e10e803.2.azurestaticapps.net`
   - Utveckling: Gå till `http://localhost:3000` i din webbläsare
   - Swagger API docs finns på `https://alcohol-tracker-hxbkd9d6bng5apgt.swedencentral-01.azurewebsites.net/swagger`

## 📁 Projektstruktur

```
alcohol-tracker/
├── src/                    # React frontend
│   ├── components/         # React komponenter
│   ├── types/             # TypeScript interfaces
│   ├── utils/             # Utilities och API calls
│   └── App.tsx            # Huvudkomponent
├── backend/                # .NET backend
│   └── AlcoholTracker.API/
│       ├── Controllers/    # API controllers
│       ├── Models/         # Entity Framework models
│       ├── DTOs/          # Data Transfer Objects
│       ├── Services/      # Business logic
│       ├── Data/          # DbContext
│       └── Program.cs     # App configuration
├── package.json
├── .gitignore
└── README.md
```

## 🔧 API Endpoints

### Drinks
- `GET /api/drinks` - Hämta alla drycker
- `POST /api/drinks` - Skapa ny dryck
- `DELETE /api/drinks/{id}` - Ta bort dryck

### Drink Entries
- `GET /api/drinkentries` - Hämta alla entries
- `POST /api/drinkentries` - Skapa ny entry
- `DELETE /api/drinkentries/{id}` - Ta bort entry
- `DELETE /api/drinkentries` - Rensa alla entries
- `GET /api/drinkentries/statistics` - Hämta statistik

## 📊 Standardenheter

Appen använder svenska standardenheter:
- **1 standardenhet = 12g ren alkohol**
- Beräknas med formeln: `(volym * alkoholhalt * 0.789) / 12`

### Exempel
- Stor stark (50cl, 5.2%): 1.71 standardenheter
- Vin (15cl, 12%): 1.18 standardenheter
- Vodka shot (4cl, 40%): 1.05 standardenheter

## 🗄️ Databas

SQLite-databasen skapas automatiskt som `AlcoholTracker.db` i backend-mappen.

### Tabeller
- **Drinks**: Dryckstyper med volym och alkoholhalt
- **DrinkEntries**: Registrerade konsumtioner med timestamp

## 🛠️ Utveckling

### Frontend utveckling
```bash
npm start          # Starta utvecklingsserver
npm test           # Kör tester
npm run build      # Bygg för produktion
```

### Backend utveckling
```bash
cd backend/AlcoholTracker.API
dotnet run         # Starta utvecklingsserver
dotnet test        # Kör tester
dotnet build       # Bygg projekt
```

### Database migrations
```bash
cd backend/AlcoholTracker.API
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## 🧪 Testning

### Frontend tester
```bash
npm test
```

### Backend tester
```bash
cd backend/AlcoholTracker.API
dotnet test
```

## 📦 Deployment

### Frontend (React)
```bash
npm run build
# Deploya build/ mappen till din hosting
```

### Backend (.NET)
```bash
cd backend/AlcoholTracker.API
dotnet publish -c Release
# Deploya publish/ mappen till din server
```

## 🔒 Säkerhet

- CORS konfigurerad för `http://localhost:3000`
- Input validering på alla endpoints
- SQL injection skydd via Entity Framework
- Lokal databas utan externa beroenden

## 🤝 Bidrag

1. Forka projektet
2. Skapa en feature branch (`git checkout -b feature/amazing-feature`)
3. Committa dina ändringar (`git commit -m 'Add amazing feature'`)
4. Pusha till branchen (`git push origin feature/amazing-feature`)
5. Öppna en Pull Request

## 📄 Licens

Detta projekt är öppen källkod och tillgängligt under MIT-licensen.

## ⚠️ Viktigt

Denna app är endast för personlig användning och ska inte ersätta professionell medicinsk rådgivning. Använd ansvarsfullt och respektera svenska alkoholrekommendationer.

---

**Utvecklad med ❤️ för att hjälpa dig spåra din alkoholkonsumtion på ett enkelt och smidigt sätt.** 
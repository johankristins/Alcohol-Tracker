# 🍺 Alcohol Tracker API

En .NET Web API för att hantera alkoholkonsumtion data med SQLite databas.

## Funktioner

- **CRUD operationer** för drycker och drink entries
- **SQLite databas** för lokal lagring
- **Swagger dokumentation** för API-testning
- **CORS konfiguration** för React frontend
- **Automatisk beräkning** av standardenheter
- **Statistik endpoints** för dataanalys

## Teknisk stack

- **.NET 8** Web API
- **Entity Framework Core** med SQLite
- **Swagger/OpenAPI** för dokumentation
- **CORS** för frontend integration

## Installation och körning

### Förutsättningar
- .NET 8 SDK
- Visual Studio 2022 eller VS Code

### Steg för att köra

1. **Navigera till projektmappen**:
   ```bash
   cd backend/AlcoholTracker.API
   ```

2. **Återställ NuGet-paket**:
   ```bash
   dotnet restore
   ```

3. **Kör appen**:
   ```bash
   dotnet run
   ```

4. **Öppna Swagger UI**:
   - Gå till `https://localhost:7001/swagger` eller `http://localhost:5001/swagger`

## API Endpoints

### Drinks

- `GET /api/drinks` - Hämta alla drycker
- `GET /api/drinks/{id}` - Hämta specifik dryck
- `POST /api/drinks` - Skapa ny dryck
- `DELETE /api/drinks/{id}` - Ta bort dryck

### Drink Entries

- `GET /api/drinkentries` - Hämta alla drink entries
- `GET /api/drinkentries/{id}` - Hämta specifik entry
- `POST /api/drinkentries` - Skapa ny entry
- `PUT /api/drinkentries/{id}` - Uppdatera entry
- `DELETE /api/drinkentries/{id}` - Ta bort entry
- `DELETE /api/drinkentries` - Ta bort alla entries
- `GET /api/drinkentries/statistics` - Hämta statistik

## Databas

SQLite-databasen skapas automatiskt i projektmappen som `AlcoholTracker.db`. Databasen innehåller:

### Drinks tabell
- Id (Primary Key)
- Name (Varchar 100)
- Type (Varchar 20)
- Volume (Decimal 8,2)
- AlcoholPercentage (Decimal 5,2)
- StandardUnits (Decimal 8,2)

### DrinkEntries tabell
- Id (Primary Key)
- DrinkId (Foreign Key)
- Timestamp (DateTime)
- Notes (Varchar 500)

## Beräkningsformel

Standardenheter beräknas med formeln:
```
Standardenheter = (volym * alkoholhalt * 0.789) / 12
```

## Exempel på API-anrop

### Skapa en drink entry
```bash
curl -X POST "https://localhost:7001/api/drinkentries" \
  -H "Content-Type: application/json" \
  -d '{
    "drinkId": 1,
    "timestamp": "2024-01-15T20:30:00Z",
    "notes": "Fredagskväll"
  }'
```

### Hämta statistik
```bash
curl -X GET "https://localhost:7001/api/drinkentries/statistics"
```

## Frontend integration

För att använda denna API med React frontend, uppdatera `utils/storage.ts` för att anropa API:et istället för localStorage.

## Utveckling

### Migrations (om du vill använda EF migrations)
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### Debugging
- Använd Swagger UI för att testa endpoints
- Loggar finns i konsolen under utveckling
- Databasen kan inspekteras med SQLite Browser

## Säkerhet

- CORS konfigurerad för `http://localhost:3000`
- Validering av input data
- SQL injection skydd via Entity Framework

## Framtida förbättringar

- [ ] Autentisering och auktorisering
- [ ] Flera användare
- [ ] Backup/restore funktionalitet
- [ ] Mer avancerad statistik
- [ ] Export av data
- [ ] Real-time notifications 
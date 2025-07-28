export interface Drink {
  id: string;
  name: string;
  type: 'beer' | 'wine' | 'spirit' | 'cocktail' | 'other';
  volume: number; // in centiliters
  alcoholPercentage: number; // percentage
  standardUnits: number; // calculated standard units
}

export interface DrinkEntry {
  id: string;
  drink: Drink;
  timestamp: Date;
  notes?: string;
}

export interface DailyStats {
  date: string;
  totalUnits: number;
  totalDrinks: number;
  drinks: DrinkEntry[];
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalUnits: number;
  totalDrinks: number;
  dailyStats: DailyStats[];
}

export interface MonthlyStats {
  month: string;
  totalUnits: number;
  totalDrinks: number;
  weeklyStats: WeeklyStats[];
}

export type TimePeriod = 'day' | 'week' | 'month';

// Systembolaget product types
export interface SystembolagetProduct {
  alcoholPercentage: number;
  assortment: string;
  assortmentText: string;
  bottleText: string;
  category: string | null;
  categoryLevel1: string;
  categoryLevel2: string;
  categoryLevel3: string | null;
  categoryLevel4: string | null;
  color: string | null;
  country: string;
  customCategoryTitle: string;
  dishPoints: number | null;
  ethicalLabel: string | null;
  grapes: string[];
  images: SystembolagetImage[];
  isClimateSmartPackaging: boolean;
  isCompletelyOutOfStock: boolean;
  isDiscontinued: boolean;
  isEthical: boolean;
  isKosher: boolean;
  isManufacturingCountry: boolean;
  isNews: boolean;
  isOrganic: boolean;
  isRegionalRestricted: boolean;
  isSupplierTemporaryNotAvailable: boolean;
  isSustainableChoice: boolean;
  isTemporaryOutOfStock: boolean;
  isWebLaunch: boolean;
  originLevel1: string | null;
  originLevel2: string | null;
  otherSelections: string | null;
  packagingLevel1: string;
  price: number;
  producerName: string;
  productId: string;
  productLaunchDate: string;
  productNameBold: string;
  productNameThin: string;
  productNumber: string;
  productNumberShort: string;
  recycleFee: number;
  restrictedParcelQuantity: number;
  seal: string | null;
  sellStartTime?: string;
  sugarContent: number;
  sugarContentGramPer100ml: number;
  supplierName: string;
  taste: string | null;
  tasteClockBitter: number;
  tasteClockBody: number;
  tasteClockCasque: number;
  tasteClockFruitacid: number;
  tasteClockGroupBitter: string | null;
  tasteClockGroupSmokiness: string | null;
  tasteClockRoughness: number;
  tasteClockSmokiness: number;
  tasteClockSweetness: number;
  tasteClocks: TasteClock[];
  tasteSymbols: string[];
  usage: string | null;
  vintage: string | null;
  volume: number;
  volumeText: string;
}

export interface SystembolagetImage {
  fileType: string | null;
  imageUrl: string;
  size: string | null;
}

export interface TasteClock {
  key: string;
  value: number;
}

// Search and product info interfaces
export interface ProductSearchResult {
  product: SystembolagetProduct;
  source: 'systembolaget' | 'openfoodfacts' | 'local';
  confidence: number;
}

export interface ProductInfo {
  name: string;
  brand?: string;
  volume?: number;
  alcoholPercentage?: number;
  type: Drink['type'];
  price?: number;
  country?: string;
  image?: string;
  productNumber?: string;
  systembolagetProduct?: SystembolagetProduct;
} 
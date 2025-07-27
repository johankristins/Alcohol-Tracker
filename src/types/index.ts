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
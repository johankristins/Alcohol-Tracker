import { Drink, DrinkEntry, DailyStats, WeeklyStats, MonthlyStats } from '../types';

// Calculate standard units based on volume and alcohol percentage
// 1 standard unit = 12g pure alcohol
// Formula: (volume * alcoholPercentage * 0.789) / 12
export const calculateStandardUnits = (volume: number, alcoholPercentage: number): number => {
  const standardUnits = (volume * alcoholPercentage * 7.89) / (12*100);
  return Math.round(standardUnits * 100) / 100; // Round to 2 decimal places
};

// Create a new drink with calculated standard units
export const createDrink = (
  name: string,
  type: Drink['type'],
  volume: number,
  alcoholPercentage: number
): Drink => {
  return {
    id: Date.now().toString(),
    name,
    type,
    volume,
    alcoholPercentage,
    standardUnits: calculateStandardUnits(volume, alcoholPercentage)
  };
};

// Group drink entries by date
export const groupEntriesByDate = (entries: DrinkEntry[]): DailyStats[] => {
  const grouped = entries.reduce((acc, entry) => {
    const date = entry.timestamp.toISOString().split('T')[0];
    
    if (!acc[date]) {
      acc[date] = {
        date,
        totalUnits: 0,
        totalDrinks: 0,
        drinks: []
      };
    }
    
    acc[date].totalUnits += entry.drink.standardUnits;
    acc[date].totalDrinks += 1;
    acc[date].drinks.push(entry);
    
    return acc;
  }, {} as Record<string, DailyStats>);
  
  return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
};

// Calculate weekly statistics
export const calculateWeeklyStats = (entries: DrinkEntry[]): WeeklyStats[] => {
  const dailyStats = groupEntriesByDate(entries);
  
  const weeklyGroups = dailyStats.reduce((acc, daily) => {
    const date = new Date(daily.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!acc[weekKey]) {
      acc[weekKey] = {
        weekStart: weekKey,
        weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalUnits: 0,
        totalDrinks: 0,
        dailyStats: []
      };
    }
    
    acc[weekKey].totalUnits += daily.totalUnits;
    acc[weekKey].totalDrinks += daily.totalDrinks;
    acc[weekKey].dailyStats.push(daily);
    
    return acc;
  }, {} as Record<string, WeeklyStats>);
  
  return Object.values(weeklyGroups).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
};

// Calculate monthly statistics
export const calculateMonthlyStats = (entries: DrinkEntry[]): MonthlyStats[] => {
  const weeklyStats = calculateWeeklyStats(entries);
  
  const monthlyGroups = weeklyStats.reduce((acc, weekly) => {
    const monthKey = weekly.weekStart.substring(0, 7); // YYYY-MM format
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        totalUnits: 0,
        totalDrinks: 0,
        weeklyStats: []
      };
    }
    
    acc[monthKey].totalUnits += weekly.totalUnits;
    acc[monthKey].totalDrinks += weekly.totalDrinks;
    acc[monthKey].weeklyStats.push(weekly);
    
    return acc;
  }, {} as Record<string, MonthlyStats>);
  
  return Object.values(monthlyGroups).sort((a, b) => b.month.localeCompare(a.month));
};

// Get total statistics for all entries
export const getTotalStats = (entries: DrinkEntry[]) => {
  return entries.reduce((acc, entry) => {
    acc.totalUnits += entry.drink.standardUnits;
    acc.totalDrinks += 1;
    return acc;
  }, { totalUnits: 0, totalDrinks: 0 });
}; 
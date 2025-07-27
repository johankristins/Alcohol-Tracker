import React, { useState } from 'react';
import { DrinkEntry, TimePeriod } from '../types';
import { 
  groupEntriesByDate, 
  calculateWeeklyStats, 
  calculateMonthlyStats, 
  getTotalStats 
} from '../utils/calculations';

interface StatisticsProps {
  entries: DrinkEntry[];
}

export const Statistics: React.FC<StatisticsProps> = ({ entries }) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  
  if (entries.length === 0) {
    return (
      <div className="statistics">
        <h2>Statistik</h2>
        <div className="empty-stats">
          <p>Ingen data tillgänglig än. Lägg till drycker för att se statistik.</p>
        </div>
      </div>
    );
  }

  const totalStats = getTotalStats(entries);
  const dailyStats = groupEntriesByDate(entries);
  const weeklyStats = calculateWeeklyStats(entries);
  const monthlyStats = calculateMonthlyStats(entries);

  const getCurrentPeriodStats = () => {
    switch (timePeriod) {
      case 'day':
        return dailyStats.slice(0, 7); // Last 7 days
      case 'week':
        return weeklyStats.slice(0, 4); // Last 4 weeks
      case 'month':
        return monthlyStats.slice(0, 6); // Last 6 months
      default:
        return [];
    }
  };

  const currentStats = getCurrentPeriodStats();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatWeekRange = (weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
  };

  const formatMonth = (monthString: string) => {
    const date = new Date(monthString + '-01');
    return date.toLocaleDateString('sv-SE', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getMaxUnits = () => {
    if (currentStats.length === 0) return 1;
    return Math.max(...currentStats.map(stat => {
      if ('totalUnits' in stat) {
        return stat.totalUnits;
      }
      return 0;
    }));
  };

  const maxUnits = getMaxUnits();

  return (
    <div className="statistics">
      <div className="stats-header">
        <h2>Statistik</h2>
        <div className="period-selector">
          <button
            className={timePeriod === 'day' ? 'active' : ''}
            onClick={() => setTimePeriod('day')}
          >
            Dag
          </button>
          <button
            className={timePeriod === 'week' ? 'active' : ''}
            onClick={() => setTimePeriod('week')}
          >
            Vecka
          </button>
          <button
            className={timePeriod === 'month' ? 'active' : ''}
            onClick={() => setTimePeriod('month')}
          >
            Månad
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">🍺</div>
          <div className="card-content">
            <div className="card-value">{totalStats.totalDrinks}</div>
            <div className="card-label">Totalt antal drycker</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-value">{totalStats.totalUnits.toFixed(1)}</div>
            <div className="card-label">Totalt antal enheter</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <div className="card-value">{dailyStats.length}</div>
            <div className="card-label">Dagar med registrering</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-value">
              {dailyStats.length > 0 
                ? (totalStats.totalUnits / dailyStats.length).toFixed(1)
                : '0'
              }
            </div>
            <div className="card-label">Genomsnitt per dag</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container">
        <h3>Konsumtion över tid</h3>
        <div className="chart">
          {currentStats.map((stat, index) => {
            let units = 0;
            let label = '';
            
            if (timePeriod === 'day' && 'date' in stat) {
              units = stat.totalUnits;
              label = formatDate(stat.date);
            } else if (timePeriod === 'week' && 'weekStart' in stat) {
              units = stat.totalUnits;
              label = formatWeekRange(stat.weekStart, stat.weekEnd);
            } else if (timePeriod === 'month' && 'month' in stat) {
              units = stat.totalUnits;
              label = formatMonth(stat.month);
            }
            
            const height = maxUnits > 0 ? (units / maxUnits) * 100 : 0;

            return (
              <div key={index} className="chart-bar">
                <div 
                  className="bar-fill"
                  style={{ height: `${height}%` }}
                />
                <div className="bar-label">{label}</div>
                <div className="bar-value">{units.toFixed(1)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed stats table */}
      <div className="stats-table">
        <h3>Detaljerad statistik</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Enheter</th>
                <th>Drycker</th>
                <th>Genomsnitt</th>
              </tr>
            </thead>
            <tbody>
              {currentStats.map((stat, index) => {
                let units = 0;
                let drinks = 0;
                let periodLabel = '';
                
                if (timePeriod === 'day' && 'date' in stat) {
                  units = stat.totalUnits;
                  drinks = stat.totalDrinks;
                  periodLabel = formatDate(stat.date);
                } else if (timePeriod === 'week' && 'weekStart' in stat) {
                  units = stat.totalUnits;
                  drinks = stat.totalDrinks;
                  periodLabel = formatWeekRange(stat.weekStart, stat.weekEnd);
                } else if (timePeriod === 'month' && 'month' in stat) {
                  units = stat.totalUnits;
                  drinks = stat.totalDrinks;
                  periodLabel = formatMonth(stat.month);
                }
                
                const average = drinks > 0 ? units / drinks : 0;

                return (
                  <tr key={index}>
                    <td>{periodLabel}</td>
                    <td>{units.toFixed(1)}</td>
                    <td>{drinks}</td>
                    <td>{average.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 
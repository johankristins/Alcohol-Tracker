namespace AlcoholTracker.API.Services;

public class CalculationService
{
    /// <summary>
    /// Calculate standard units based on volume and alcohol percentage
    /// Formula: (volume * alcoholPercentage * 0.789) / 12
    /// 1 standard unit = 12g pure alcohol
    /// </summary>
    public static decimal CalculateStandardUnits(decimal volume, decimal alcoholPercentage)
    {
        var standardUnits = (volume * alcoholPercentage * 7.89m) / (12m * 100);
        return Math.Round(standardUnits, 2);
    }
} 
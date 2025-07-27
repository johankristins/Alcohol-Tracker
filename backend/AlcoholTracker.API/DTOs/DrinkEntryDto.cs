namespace AlcoholTracker.API.DTOs;

public class DrinkDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Volume { get; set; }
    public decimal AlcoholPercentage { get; set; }
    public decimal StandardUnits { get; set; }
}

public class DrinkEntryDto
{
    public int Id { get; set; }
    public DrinkDto Drink { get; set; } = null!;
    public DateTime Timestamp { get; set; }
    public string? Notes { get; set; }
}

public class CreateDrinkEntryDto
{
    public int? DrinkId { get; set; }
    public DateTime Timestamp { get; set; }
    public string? Notes { get; set; }
    public CreateDrinkDto? Drink { get; set; } // Optional drink data
}

public class CreateDrinkDto
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Volume { get; set; }
    public decimal AlcoholPercentage { get; set; }
} 
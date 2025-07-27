using System.ComponentModel.DataAnnotations;

namespace AlcoholTracker.API.Models;

public class Drink
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = string.Empty; // beer, wine, spirit, cocktail, other
    
    [Required]
    [Range(0.1, 1000)]
    public decimal Volume { get; set; } // in centiliters
    
    [Required]
    [Range(0.1, 100)]
    public decimal AlcoholPercentage { get; set; } // percentage
    
    [Required]
    [Range(0, 100)]
    public decimal StandardUnits { get; set; } // calculated standard units
    
    // Navigation property
    public ICollection<DrinkEntry> DrinkEntries { get; set; } = new List<DrinkEntry>();
} 
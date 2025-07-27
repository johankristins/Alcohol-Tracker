using System.ComponentModel.DataAnnotations;

namespace AlcoholTracker.API.Models;

public class DrinkEntry
{
    public int Id { get; set; }
    
    [Required]
    public int DrinkId { get; set; }
    
    [Required]
    public DateTime Timestamp { get; set; }
    
    [MaxLength(500)]
    public string? Notes { get; set; }
    
    // Navigation property
    public Drink Drink { get; set; } = null!;
} 
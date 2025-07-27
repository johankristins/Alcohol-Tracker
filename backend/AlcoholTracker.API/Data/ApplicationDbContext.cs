using Microsoft.EntityFrameworkCore;
using AlcoholTracker.API.Models;

namespace AlcoholTracker.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Drink> Drinks { get; set; }
    public DbSet<DrinkEntry> DrinkEntries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Drink entity
        modelBuilder.Entity<Drink>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Volume).HasPrecision(8, 2);
            entity.Property(e => e.AlcoholPercentage).HasPrecision(5, 2);
            entity.Property(e => e.StandardUnits).HasPrecision(8, 2);
        });

        // Configure DrinkEntry entity
        modelBuilder.Entity<DrinkEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Timestamp).IsRequired();
            entity.Property(e => e.Notes).HasMaxLength(500);
            
            // Configure relationship
            entity.HasOne(e => e.Drink)
                  .WithMany(d => d.DrinkEntries)
                  .HasForeignKey(e => e.DrinkId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed some common drinks
        modelBuilder.Entity<Drink>().HasData(
            new Drink
            {
                Id = 1,
                Name = "Stor stark",
                Type = "beer",
                Volume = 50,
                AlcoholPercentage = 5.2m,
                StandardUnits = 1.71m
            },
            new Drink
            {
                Id = 2,
                Name = "Liten stark",
                Type = "beer",
                Volume = 33,
                AlcoholPercentage = 5.2m,
                StandardUnits = 1.13m
            },
            new Drink
            {
                Id = 3,
                Name = "Vin (glas)",
                Type = "wine",
                Volume = 15,
                AlcoholPercentage = 12m,
                StandardUnits = 1.18m
            },
            new Drink
            {
                Id = 4,
                Name = "Vin (flaska)",
                Type = "wine",
                Volume = 75,
                AlcoholPercentage = 12m,
                StandardUnits = 5.91m
            },
            new Drink
            {
                Id = 5,
                Name = "Vodka (shot)",
                Type = "spirit",
                Volume = 4,
                AlcoholPercentage = 40m,
                StandardUnits = 1.05m
            },
            new Drink
            {
                Id = 6,
                Name = "Whisky (shot)",
                Type = "spirit",
                Volume = 4,
                AlcoholPercentage = 40m,
                StandardUnits = 1.05m
            }
        );
    }
} 
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AlcoholTracker.API.Data;
using AlcoholTracker.API.Models;
using AlcoholTracker.API.DTOs;
using AlcoholTracker.API.Services;

namespace AlcoholTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DrinkEntriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DrinkEntriesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/drinkentries
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DrinkEntryDto>>> GetDrinkEntries()
    {
        var entries = await _context.DrinkEntries
            .Include(e => e.Drink)
            .OrderByDescending(e => e.Timestamp)
            .Select(e => new DrinkEntryDto
            {
                Id = e.Id,
                Drink = new DrinkDto
                {
                    Id = e.Drink.Id,
                    Name = e.Drink.Name,
                    Type = e.Drink.Type,
                    Volume = e.Drink.Volume,
                    AlcoholPercentage = e.Drink.AlcoholPercentage,
                    StandardUnits = e.Drink.StandardUnits
                },
                Timestamp = e.Timestamp,
                Notes = e.Notes
            })
            .ToListAsync();

        return Ok(entries);
    }

    // GET: api/drinkentries/5
    [HttpGet("{id}")]
    public async Task<ActionResult<DrinkEntryDto>> GetDrinkEntry(int id)
    {
        var entry = await _context.DrinkEntries
            .Include(e => e.Drink)
            .Where(e => e.Id == id)
            .Select(e => new DrinkEntryDto
            {
                Id = e.Id,
                Drink = new DrinkDto
                {
                    Id = e.Drink.Id,
                    Name = e.Drink.Name,
                    Type = e.Drink.Type,
                    Volume = e.Drink.Volume,
                    AlcoholPercentage = e.Drink.AlcoholPercentage,
                    StandardUnits = e.Drink.StandardUnits
                },
                Timestamp = e.Timestamp,
                Notes = e.Notes
            })
            .FirstOrDefaultAsync();

        if (entry == null)
        {
            return NotFound();
        }

        return Ok(entry);
    }

    // POST: api/drinkentries
    [HttpPost]
    public async Task<ActionResult<DrinkEntryDto>> CreateDrinkEntry(CreateDrinkEntryDto createDto)
    {
        Drink drink;
        
        if (createDto.DrinkId.HasValue)
        {
            // Use existing drink
            drink = await _context.Drinks.FindAsync(createDto.DrinkId.Value);
            if (drink == null)
            {
                return BadRequest($"Drink with ID {createDto.DrinkId.Value} not found");
            }
        }
        else if (createDto.Drink != null)
        {
            // Create new drink from provided data
            var standardUnits = CalculationService.CalculateStandardUnits(
                createDto.Drink.Volume, 
                createDto.Drink.AlcoholPercentage);

            drink = new Drink
            {
                Name = createDto.Drink.Name,
                Type = createDto.Drink.Type,
                Volume = createDto.Drink.Volume,
                AlcoholPercentage = createDto.Drink.AlcoholPercentage,
                StandardUnits = standardUnits
            };

            _context.Drinks.Add(drink);
            await _context.SaveChangesAsync(); // Save to get the ID
        }
        else
        {
            return BadRequest("Either DrinkId or Drink data must be provided");
        }

        var entry = new DrinkEntry
        {
            DrinkId = drink.Id,
            Timestamp = createDto.Timestamp,
            Notes = createDto.Notes
        };

        _context.DrinkEntries.Add(entry);
        await _context.SaveChangesAsync();

        // Reload the entry with drink data
        var createdEntry = await _context.DrinkEntries
            .Include(e => e.Drink)
            .Where(e => e.Id == entry.Id)
            .Select(e => new DrinkEntryDto
            {
                Id = e.Id,
                Drink = new DrinkDto
                {
                    Id = e.Drink.Id,
                    Name = e.Drink.Name,
                    Type = e.Drink.Type,
                    Volume = e.Drink.Volume,
                    AlcoholPercentage = e.Drink.AlcoholPercentage,
                    StandardUnits = e.Drink.StandardUnits
                },
                Timestamp = e.Timestamp,
                Notes = e.Notes
            })
            .FirstAsync();

        return CreatedAtAction(nameof(GetDrinkEntry), new { id = entry.Id }, createdEntry);
    }

    // PUT: api/drinkentries/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDrinkEntry(int id, CreateDrinkEntryDto updateDto)
    {
        var entry = await _context.DrinkEntries.FindAsync(id);
        if (entry == null)
        {
            return NotFound();
        }

        Drink drink;
        
        if (updateDto.DrinkId.HasValue)
        {
            // Use existing drink
            drink = await _context.Drinks.FindAsync(updateDto.DrinkId.Value);
            if (drink == null)
            {
                return BadRequest($"Drink with ID {updateDto.DrinkId.Value} not found");
            }
        }
        else if (updateDto.Drink != null)
        {
            // Create new drink from provided data
            var standardUnits = CalculationService.CalculateStandardUnits(
                updateDto.Drink.Volume, 
                updateDto.Drink.AlcoholPercentage);

            drink = new Drink
            {
                Name = updateDto.Drink.Name,
                Type = updateDto.Drink.Type,
                Volume = updateDto.Drink.Volume,
                AlcoholPercentage = updateDto.Drink.AlcoholPercentage,
                StandardUnits = standardUnits
            };

            _context.Drinks.Add(drink);
            await _context.SaveChangesAsync(); // Save to get the ID
        }
        else
        {
            return BadRequest("Either DrinkId or Drink data must be provided");
        }

        entry.DrinkId = drink.Id;
        entry.Timestamp = updateDto.Timestamp;
        entry.Notes = updateDto.Notes;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/drinkentries/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDrinkEntry(int id)
    {
        try
        {
            var entry = await _context.DrinkEntries.FindAsync(id);
            if (entry == null)
            {
                return NotFound($"DrinkEntry with ID {id} not found");
            }

            _context.DrinkEntries.Remove(entry);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest($"Error deleting drink entry: {ex.Message}");
        }
    }

    // DELETE: api/drinkentries
    [HttpDelete]
    public async Task<IActionResult> DeleteAllDrinkEntries()
    {
        var allEntries = await _context.DrinkEntries.ToListAsync();
        _context.DrinkEntries.RemoveRange(allEntries);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // GET: api/drinkentries/statistics
    [HttpGet("statistics")]
    public async Task<ActionResult<object>> GetStatistics()
    {
        var entries = await _context.DrinkEntries
            .Include(e => e.Drink)
            .ToListAsync();

        var totalDrinks = entries.Count;
        var totalUnits = entries.Sum(e => e.Drink.StandardUnits);
        var totalDays = entries.Select(e => e.Timestamp.Date).Distinct().Count();
        var averagePerDay = totalDays > 0 ? totalUnits / totalDays : 0;

        var statistics = new
        {
            TotalDrinks = totalDrinks,
            TotalUnits = Math.Round(totalUnits, 2),
            TotalDays = totalDays,
            AveragePerDay = Math.Round(averagePerDay, 2)
        };

        return Ok(statistics);
    }
} 
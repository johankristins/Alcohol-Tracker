using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AlcoholTracker.API.Data;
using AlcoholTracker.API.Models;
using AlcoholTracker.API.DTOs;
using AlcoholTracker.API.Services;

namespace AlcoholTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableCors("AllowReactApp")]
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
                .ToListAsync();

            return entries.Select(e => new DrinkEntryDto
            {
                Id = e.Id,
                DrinkId = e.DrinkId,
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
            }).ToList();
        }

        // POST: api/drinkentries
        [HttpPost]
        public async Task<ActionResult<DrinkEntryDto>> CreateDrinkEntry(CreateDrinkEntryDto createDto)
        {
            Drink drink;

            // If a new drink is provided, create it first
            if (createDto.Drink != null)
            {
                drink = new Drink
                {
                    Name = createDto.Drink.Name,
                    Type = createDto.Drink.Type,
                    Volume = createDto.Drink.Volume,
                    AlcoholPercentage = createDto.Drink.AlcoholPercentage,
                    StandardUnits = CalculationService.CalculateStandardUnits(createDto.Drink.Volume, createDto.Drink.AlcoholPercentage)
                };
                _context.Drinks.Add(drink);
                await _context.SaveChangesAsync();
            }
            else if (createDto.DrinkId.HasValue)
            {
                drink = await _context.Drinks.FindAsync(createDto.DrinkId.Value);
                if (drink == null)
                {
                    return NotFound("Drink not found");
                }
            }
            else
            {
                return BadRequest("Either DrinkId or Drink object must be provided");
            }

            var entry = new DrinkEntry
            {
                DrinkId = drink.Id,
                Timestamp = createDto.Timestamp,
                Notes = createDto.Notes
            };

            _context.DrinkEntries.Add(entry);
            await _context.SaveChangesAsync();

            // Reload the entry with drink information
            await _context.Entry(entry).Reference(e => e.Drink).LoadAsync();

            return CreatedAtAction(nameof(GetDrinkEntries), new { id = entry.Id }, new DrinkEntryDto
            {
                Id = entry.Id,
                DrinkId = entry.DrinkId,
                Drink = new DrinkDto
                {
                    Id = entry.Drink.Id,
                    Name = entry.Drink.Name,
                    Type = entry.Drink.Type,
                    Volume = entry.Drink.Volume,
                    AlcoholPercentage = entry.Drink.AlcoholPercentage,
                    StandardUnits = entry.Drink.StandardUnits
                },
                Timestamp = entry.Timestamp,
                Notes = entry.Notes
            });
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
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // DELETE: api/drinkentries (clear all)
        [HttpDelete]
        public async Task<IActionResult> ClearAllEntries()
        {
            _context.DrinkEntries.RemoveRange(_context.DrinkEntries);
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

            if (!entries.Any())
            {
                return new
                {
                    dailyStats = new List<object>(),
                    weeklyStats = new List<object>(),
                    monthlyStats = new List<object>()
                };
            }

            // Group by date
            var dailyStats = entries
                .GroupBy(e => e.Timestamp.Date)
                .Select(g => new
                {
                    date = g.Key.ToString("yyyy-MM-dd"),
                    totalDrinks = g.Count(),
                    totalUnits = g.Sum(e => e.Drink.StandardUnits),
                    averageUnits = Math.Round(g.Average(e => e.Drink.StandardUnits), 2)
                })
                .OrderByDescending(s => s.date)
                .ToList();

            // Group by week
            var weeklyStats = entries
                .GroupBy(e => System.Globalization.CultureInfo.CurrentCulture.Calendar.GetWeekOfYear(e.Timestamp, System.Globalization.CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday))
                .Select(g => new
                {
                    weekStart = g.First().Timestamp.Date.AddDays(-(int)g.First().Timestamp.DayOfWeek),
                    totalDrinks = g.Count(),
                    totalUnits = g.Sum(e => e.Drink.StandardUnits),
                    averageUnits = Math.Round(g.Average(e => e.Drink.StandardUnits), 2)
                })
                .OrderByDescending(s => s.weekStart)
                .ToList();

            // Group by month
            var monthlyStats = entries
                .GroupBy(e => new { e.Timestamp.Year, e.Timestamp.Month })
                .Select(g => new
                {
                    month = $"{g.Key.Year}-{g.Key.Month:D2}",
                    totalDrinks = g.Count(),
                    totalUnits = g.Sum(e => e.Drink.StandardUnits),
                    averageUnits = Math.Round(g.Average(e => e.Drink.StandardUnits), 2)
                })
                .OrderByDescending(s => s.month)
                .ToList();

            return new
            {
                dailyStats,
                weeklyStats,
                monthlyStats
            };
        }
    }
} 
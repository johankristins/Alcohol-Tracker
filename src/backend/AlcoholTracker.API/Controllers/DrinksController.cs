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
    public class DrinksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DrinksController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/drinks
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DrinkDto>>> GetDrinks()
        {
            var drinks = await _context.Drinks.ToListAsync();
            return drinks.Select(d => new DrinkDto
            {
                Id = d.Id,
                Name = d.Name,
                Type = d.Type,
                Volume = d.Volume,
                AlcoholPercentage = d.AlcoholPercentage,
                StandardUnits = d.StandardUnits
            }).ToList();
        }

        // GET: api/drinks/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DrinkDto>> GetDrink(int id)
        {
            var drink = await _context.Drinks.FindAsync(id);

            if (drink == null)
            {
                return NotFound();
            }

            return new DrinkDto
            {
                Id = drink.Id,
                Name = drink.Name,
                Type = drink.Type,
                Volume = drink.Volume,
                AlcoholPercentage = drink.AlcoholPercentage,
                StandardUnits = drink.StandardUnits
            };
        }

        // POST: api/drinks
        [HttpPost]
        public async Task<ActionResult<DrinkDto>> CreateDrink(CreateDrinkDto createDto)
        {
            var drink = new Drink
            {
                Name = createDto.Name,
                Type = createDto.Type,
                Volume = createDto.Volume,
                AlcoholPercentage = createDto.AlcoholPercentage,
                StandardUnits = CalculationService.CalculateStandardUnits(createDto.Volume, createDto.AlcoholPercentage)
            };

            _context.Drinks.Add(drink);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDrink), new { id = drink.Id }, new DrinkDto
            {
                Id = drink.Id,
                Name = drink.Name,
                Type = drink.Type,
                Volume = drink.Volume,
                AlcoholPercentage = drink.AlcoholPercentage,
                StandardUnits = drink.StandardUnits
            });
        }

        // DELETE: api/drinks/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDrink(int id)
        {
            var drink = await _context.Drinks.FindAsync(id);
            if (drink == null)
            {
                return NotFound();
            }

            _context.Drinks.Remove(drink);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
} 
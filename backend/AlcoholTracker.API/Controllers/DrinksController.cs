using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AlcoholTracker.API.Data;
using AlcoholTracker.API.Models;
using AlcoholTracker.API.DTOs;
using AlcoholTracker.API.Services;

namespace AlcoholTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
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
        var drinks = await _context.Drinks
            .Select(d => new DrinkDto
            {
                Id = d.Id,
                Name = d.Name,
                Type = d.Type,
                Volume = d.Volume,
                AlcoholPercentage = d.AlcoholPercentage,
                StandardUnits = d.StandardUnits
            })
            .ToListAsync();

        return Ok(drinks);
    }

    // GET: api/drinks/5
    [HttpGet("{id}")]
    public async Task<ActionResult<DrinkDto>> GetDrink(int id)
    {
        var drink = await _context.Drinks
            .Where(d => d.Id == id)
            .Select(d => new DrinkDto
            {
                Id = d.Id,
                Name = d.Name,
                Type = d.Type,
                Volume = d.Volume,
                AlcoholPercentage = d.AlcoholPercentage,
                StandardUnits = d.StandardUnits
            })
            .FirstOrDefaultAsync();

        if (drink == null)
        {
            return NotFound();
        }

        return Ok(drink);
    }

    // POST: api/drinks
    [HttpPost]
    public async Task<ActionResult<DrinkDto>> CreateDrink(CreateDrinkDto createDrinkDto)
    {
        var standardUnits = CalculationService.CalculateStandardUnits(
            createDrinkDto.Volume, 
            createDrinkDto.AlcoholPercentage);

        var drink = new Drink
        {
            Name = createDrinkDto.Name,
            Type = createDrinkDto.Type,
            Volume = createDrinkDto.Volume,
            AlcoholPercentage = createDrinkDto.AlcoholPercentage,
            StandardUnits = standardUnits
        };

        _context.Drinks.Add(drink);
        await _context.SaveChangesAsync();

        var drinkDto = new DrinkDto
        {
            Id = drink.Id,
            Name = drink.Name,
            Type = drink.Type,
            Volume = drink.Volume,
            AlcoholPercentage = drink.AlcoholPercentage,
            StandardUnits = drink.StandardUnits
        };

        return CreatedAtAction(nameof(GetDrink), new { id = drink.Id }, drinkDto);
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
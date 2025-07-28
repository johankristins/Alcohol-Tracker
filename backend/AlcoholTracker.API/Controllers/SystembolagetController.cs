using Microsoft.AspNetCore.Mvc;
using AlcoholTracker.API.Services;

namespace AlcoholTracker.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SystembolagetController : ControllerBase
    {
        private readonly ISystembolagetService _systembolagetService;
        private readonly ILogger<SystembolagetController> _logger;

        public SystembolagetController(ISystembolagetService systembolagetService, ILogger<SystembolagetController> logger)
        {
            _systembolagetService = systembolagetService;
            _logger = logger;
        }

        /// <summary>
        /// Search for products by EAN/barcode
        /// </summary>
        /// <param name="ean">The EAN/barcode to search for</param>
        /// <returns>Product search result if found</returns>
        [HttpGet("search/ean/{ean}")]
        public async Task<ActionResult<ProductSearchResult>> SearchByEan(string ean)
        {
            if (string.IsNullOrWhiteSpace(ean))
            {
                return BadRequest("EAN cannot be empty");
            }

            try
            {
                var result = await _systembolagetService.SearchByEanAsync(ean);
                if (result == null)
                {
                    return NotFound($"No product found with EAN: {ean}");
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching for product with EAN: {Ean}", ean);
                return StatusCode(500, "An error occurred while searching for the product");
            }
        }

        /// <summary>
        /// Search for products by text query
        /// </summary>
        /// <param name="query">The search query</param>
        /// <param name="maxResults">Maximum number of results to return (default: 20)</param>
        /// <returns>List of product search results</returns>
        [HttpGet("search/text")]
        public async Task<ActionResult<List<ProductSearchResult>>> SearchByText([FromQuery] string query, [FromQuery] int maxResults = 20)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest("Query cannot be empty");
            }

            if (maxResults <= 0 || maxResults > 100)
            {
                return BadRequest("MaxResults must be between 1 and 100");
            }

            try
            {
                var results = await _systembolagetService.SearchByTextAsync(query, maxResults);
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching for products with query: {Query}", query);
                return StatusCode(500, "An error occurred while searching for products");
            }
        }

        /// <summary>
        /// Get all products (be careful, this is a large dataset)
        /// </summary>
        /// <returns>List of all products</returns>
        [HttpGet("products")]
        public async Task<ActionResult<List<SystembolagetProduct>>> GetProducts()
        {
            try
            {
                var products = await _systembolagetService.GetProductsAsync();
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all products");
                return StatusCode(500, "An error occurred while retrieving products");
            }
        }

        /// <summary>
        /// Get product statistics
        /// </summary>
        /// <returns>Statistics about the product database</returns>
        [HttpGet("stats")]
        public async Task<ActionResult<object>> GetStats()
        {
            try
            {
                var products = await _systembolagetService.GetProductsAsync();
                
                var categories = products
                    .GroupBy(p => p.CategoryLevel1)
                    .ToDictionary(g => g.Key, g => g.Count());

                var priceStats = products.Where(p => p.Price > 0).ToList();
                var minPrice = priceStats.Any() ? priceStats.Min(p => p.Price) : 0;
                var maxPrice = priceStats.Any() ? priceStats.Max(p => p.Price) : 0;
                var avgPrice = priceStats.Any() ? priceStats.Average(p => p.Price) : 0;

                var stats = new
                {
                    TotalProducts = products.Count,
                    Categories = categories,
                    PriceRange = new
                    {
                        Min = minPrice,
                        Max = maxPrice,
                        Average = Math.Round(avgPrice, 2)
                    },
                    LastUpdated = DateTime.UtcNow
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product statistics");
                return StatusCode(500, "An error occurred while retrieving statistics");
            }
        }

        /// <summary>
        /// Refresh the product data from Systembolaget
        /// </summary>
        /// <returns>Success message</returns>
        [HttpPost("refresh")]
        public async Task<ActionResult<object>> RefreshData()
        {
            try
            {
                await _systembolagetService.RefreshDataAsync();
                return Ok(new { Message = "Product data refreshed successfully", Timestamp = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing product data");
                return StatusCode(500, "An error occurred while refreshing product data");
            }
        }
    }
}
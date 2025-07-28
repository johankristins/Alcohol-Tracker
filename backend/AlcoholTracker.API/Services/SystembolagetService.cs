using System.Text.Json;

namespace AlcoholTracker.API.Services
{
    public class SystembolagetProduct
    {
        public double AlcoholPercentage { get; set; }
        public string Assortment { get; set; } = string.Empty;
        public string AssortmentText { get; set; } = string.Empty;
        public string BottleText { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string CategoryLevel1 { get; set; } = string.Empty;
        public string CategoryLevel2 { get; set; } = string.Empty;
        public string? CategoryLevel3 { get; set; }
        public string? CategoryLevel4 { get; set; }
        public string? Color { get; set; }
        public string Country { get; set; } = string.Empty;
        public string CustomCategoryTitle { get; set; } = string.Empty;
        public int? DishPoints { get; set; }
        public string? EthicalLabel { get; set; }
        public List<string> Grapes { get; set; } = new();
        public List<SystembolagetImage> Images { get; set; } = new();
        public bool IsClimateSmartPackaging { get; set; }
        public bool IsCompletelyOutOfStock { get; set; }
        public bool IsDiscontinued { get; set; }
        public bool IsEthical { get; set; }
        public bool IsKosher { get; set; }
        public bool IsManufacturingCountry { get; set; }
        public bool IsNews { get; set; }
        public bool IsOrganic { get; set; }
        public bool IsRegionalRestricted { get; set; }
        public bool IsSupplierTemporaryNotAvailable { get; set; }
        public bool IsSustainableChoice { get; set; }
        public bool IsTemporaryOutOfStock { get; set; }
        public bool IsWebLaunch { get; set; }
        public string? OriginLevel1 { get; set; }
        public string? OriginLevel2 { get; set; }
        public string? OtherSelections { get; set; }
        public string PackagingLevel1 { get; set; } = string.Empty;
        public double Price { get; set; }
        public string ProducerName { get; set; } = string.Empty;
        public string ProductId { get; set; } = string.Empty;
        public DateTime ProductLaunchDate { get; set; }
        public string ProductNameBold { get; set; } = string.Empty;
        public string ProductNameThin { get; set; } = string.Empty;
        public string ProductNumber { get; set; } = string.Empty;
        public string ProductNumberShort { get; set; } = string.Empty;
        public double RecycleFee { get; set; }
        public int RestrictedParcelQuantity { get; set; }
        public string? Seal { get; set; }
        public string? SellStartTime { get; set; }
        public double SugarContent { get; set; }
        public double SugarContentGramPer100ml { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public string? Taste { get; set; }
        public int TasteClockBitter { get; set; }
        public int TasteClockBody { get; set; }
        public int TasteClockCasque { get; set; }
        public int TasteClockFruitacid { get; set; }
        public string? TasteClockGroupBitter { get; set; }
        public string? TasteClockGroupSmokiness { get; set; }
        public int TasteClockRoughness { get; set; }
        public int TasteClockSmokiness { get; set; }
        public int TasteClockSweetness { get; set; }
        public List<TasteClock> TasteClocks { get; set; } = new();
        public List<string> TasteSymbols { get; set; } = new();
        public string? Usage { get; set; }
        public string? Vintage { get; set; }
        public int Volume { get; set; }
        public string VolumeText { get; set; } = string.Empty;
    }

    public class SystembolagetImage
    {
        public string? FileType { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string? Size { get; set; }
    }

    public class TasteClock
    {
        public string Key { get; set; } = string.Empty;
        public int Value { get; set; }
    }

    public class ProductSearchResult
    {
        public SystembolagetProduct Product { get; set; } = new();
        public string Source { get; set; } = string.Empty;
        public double Confidence { get; set; }
    }

    public interface ISystembolagetService
    {
        Task<List<SystembolagetProduct>> GetProductsAsync();
        Task<ProductSearchResult?> SearchByEanAsync(string ean);
        Task<List<ProductSearchResult>> SearchByTextAsync(string query, int maxResults = 20);
        Task RefreshDataAsync();
    }

    public class SystembolagetService : ISystembolagetService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<SystembolagetService> _logger;
        private readonly string _dataUrl = "https://raw.githubusercontent.com/AlexGustafsson/systembolaget-api-data/main/data/assortment.json";
        private readonly string _cacheFilePath;
        private readonly TimeSpan _cacheExpiry = TimeSpan.FromHours(24);

        private List<SystembolagetProduct> _products = new();
        private DateTime _lastFetch = DateTime.MinValue;

        public SystembolagetService(HttpClient httpClient, ILogger<SystembolagetService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _cacheFilePath = Path.Combine(Path.GetTempPath(), "systembolaget_products.json");
        }

        public async Task<List<SystembolagetProduct>> GetProductsAsync()
        {
            await EnsureDataLoadedAsync();
            return _products;
        }

        public async Task<ProductSearchResult?> SearchByEanAsync(string ean)
        {
            await EnsureDataLoadedAsync();

            var product = _products.FirstOrDefault(p =>
                p.ProductNumber == ean ||
                p.ProductNumberShort == ean ||
                p.ProductId == ean);

            if (product != null)
            {
                return new ProductSearchResult
                {
                    Product = product,
                    Source = "systembolaget",
                    Confidence = 1.0
                };
            }

            return null;
        }

        public async Task<List<ProductSearchResult>> SearchByTextAsync(string query, int maxResults = 20)
        {
            await EnsureDataLoadedAsync();

            if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
            {
                return new List<ProductSearchResult>();
            }

            var searchTerm = query.Trim().ToLowerInvariant();
            var results = new List<ProductSearchResult>();

            foreach (var product in _products)
            {
                var score = 0.0;
                var matches = 0;

                // Search in product names
                var fullName = $"{product.ProductNameBold} {product.ProductNameThin}".ToLowerInvariant();
                if (fullName.Contains(searchTerm))
                {
                    score += fullName == searchTerm ? 10 : 5;
                    matches++;
                }

                // Search in producer name
                if (product.ProducerName.ToLowerInvariant().Contains(searchTerm))
                {
                    score += 3;
                    matches++;
                }

                // Search in product number
                if (product.ProductNumber.Contains(searchTerm) || product.ProductNumberShort.Contains(searchTerm))
                {
                    score += 8;
                    matches++;
                }

                // Search in category
                if (product.CategoryLevel1.ToLowerInvariant().Contains(searchTerm) ||
                    product.CategoryLevel2.ToLowerInvariant().Contains(searchTerm) ||
                    (product.CategoryLevel3?.ToLowerInvariant().Contains(searchTerm) == true))
                {
                    score += 2;
                    matches++;
                }

                // Search in country
                if (product.Country.ToLowerInvariant().Contains(searchTerm))
                {
                    score += 1;
                    matches++;
                }

                // Search in grapes
                if (product.Grapes.Any(grape => grape.ToLowerInvariant().Contains(searchTerm)))
                {
                    score += 2;
                    matches++;
                }

                if (matches > 0)
                {
                    var confidence = Math.Min(score / 10.0, 1.0);
                    results.Add(new ProductSearchResult
                    {
                        Product = product,
                        Source = "systembolaget",
                        Confidence = confidence
                    });
                }
            }

            return results
                .OrderByDescending(r => r.Confidence)
                .Take(maxResults)
                .ToList();
        }

        public async Task RefreshDataAsync()
        {
            await FetchProductsAsync();
        }

        private async Task EnsureDataLoadedAsync()
        {
            if (_products.Count == 0 || DateTime.UtcNow - _lastFetch > _cacheExpiry)
            {
                await FetchProductsAsync();
            }
        }

        private async Task FetchProductsAsync()
        {
            try
            {
                _logger.LogInformation("Fetching Systembolaget products from API...");

                // Try to load from cache first
                if (await TryLoadFromCacheAsync())
                {
                    _logger.LogInformation("Loaded {Count} products from cache", _products.Count);
                    return;
                }

                // Fetch from API
                var response = await _httpClient.GetAsync(_dataUrl);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                var allProducts = JsonSerializer.Deserialize<List<SystembolagetProduct>>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (allProducts != null)
                {
                    // Filter out discontinued and out of stock products
                    _products = allProducts
                        .Where(p => !p.IsDiscontinued && 
                                   !p.IsCompletelyOutOfStock && 
                                   p.AlcoholPercentage > 0)
                        .ToList();

                    _lastFetch = DateTime.UtcNow;

                    // Save to cache
                    await SaveToCacheAsync();

                    _logger.LogInformation("Loaded {Count} Systembolaget products from API", _products.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching Systembolaget products");
            }
        }

        private async Task<bool> TryLoadFromCacheAsync()
        {
            try
            {
                if (!File.Exists(_cacheFilePath))
                    return false;

                var fileInfo = new FileInfo(_cacheFilePath);
                if (DateTime.UtcNow - fileInfo.LastWriteTimeUtc > _cacheExpiry)
                    return false;

                var json = await File.ReadAllTextAsync(_cacheFilePath);
                var cachedProducts = JsonSerializer.Deserialize<List<SystembolagetProduct>>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (cachedProducts != null && cachedProducts.Count > 0)
                {
                    _products = cachedProducts;
                    _lastFetch = fileInfo.LastWriteTimeUtc;
                    return true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error loading products from cache");
            }

            return false;
        }

        private async Task SaveToCacheAsync()
        {
            try
            {
                var json = JsonSerializer.Serialize(_products, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                await File.WriteAllTextAsync(_cacheFilePath, json);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error saving products to cache");
            }
        }
    }
}
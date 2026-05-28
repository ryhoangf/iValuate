const listingRepository = require('../repositories/listingRepository');
const priceHistoryRepository = require('../repositories/PriceHistoryRepository');
const priceForecastRepository = require('../repositories/PriceForecastRepository');
const mlModelService = require('./MLModelService');

class PriceInquiryService {
    async getBasicPriceInfo(keyword, filters = {}) {
        const listings = await listingRepository.findActiveListingsByName(keyword, filters);
        const availableFilters = await listingRepository.getAvailableFilters(keyword);

        let summary = null;
        if (listings.length > 0) {
            const prices = listings.map(item => Number(item.price));
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const total = prices.reduce((a, b) => a + b, 0);
            const avgPrice = Math.round(total / prices.length);
            const sortedPrices = [...prices].sort((a, b) => a - b);
            const mid = Math.floor(sortedPrices.length / 2);
            const medianPrice = sortedPrices.length % 2 !== 0 
                ? sortedPrices[mid] 
                : (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;

            summary = {
                min: minPrice,
                max: maxPrice,
                avg: avgPrice,
                median: Math.round(medianPrice),
                count: listings.length
            };
        }

        return {
            summary: summary,
            listings: listings,
            availableFilters: availableFilters
        };
    }

    async getMarketPriceRange(keyword, features = {}) {
        try {
            const product = await listingRepository.findProductIdByName(keyword);
            if (!product) throw new Error('Product not found');
            
            const productId = product.product_id;
            
            // Get price prediction with features
            const priceRangeData = await mlModelService.predictPriceInquiry(productId, features);
            if (!priceRangeData) throw new Error('Unable to calculate price range');
            
            // Get similar listings
            const similarListings = await listingRepository.findSimilarListingsByPrice(
                productId,
                priceRangeData.priceRange,
                20
            );
            
            // Get price history for chart (REAL historical prices)
            const priceHistory = await priceHistoryRepository.getLatestPriceData(productId, 30);
            
            // Get ML forecast data (PREDICTED prices) - NEW!
            const mlForecast = await priceForecastRepository.getLatestForecast(productId).catch(() => null);
            const forecastHistory = await priceForecastRepository.getForecastHistory(productId, 30).catch(() => []);
            
            return {
                product: {
                    id: product.product_id,
                    name: product.name,
                    brand: product.brand,
                    modelSeries: product.model_series,
                    baseSpecs: product.base_specs // Include JSON specs
                },
                marketPriceRange: {
                    min: priceRangeData.priceRange.min,
                    max: priceRangeData.priceRange.max,
                    average: priceRangeData.priceRange.avg,
                    median: priceRangeData.priceRange.median,
                    confidence: priceRangeData.confidence,
                    currency: 'VND'
                },
                featureAnalysis: {
                    featuresUsed: priceRangeData.featuresUsed || [],
                    impacts: priceRangeData.priceRange.impacts || [],
                    totalFeatureCount: priceRangeData.featuresUsed?.length || 0
                },
                similarListings: similarListings.map(listing => ({
                    id: listing.id,
                    name: listing.name,
                    price: listing.price,
                    condition: listing.condition,
                    batteryHealth: listing.battery_health,
                    color: listing.color,
                    platform: listing.platform,
                    sourceUrl: listing.source_url,
                    postedAt: listing.posted_at,
                    priceDifference: listing.price_difference
                })),
                priceHistory: priceHistory, // Historical REAL prices
                priceForecasts: {
                    latest: mlForecast ? {
                        date: mlForecast.forecast_date,
                        price: mlForecast.predicted_price,
                        confidence: mlForecast.confidence_score,
                        modelVersion: mlForecast.model_version
                    } : null,
                    history: forecastHistory // AI predicted prices history
                },
                dataSource: priceRangeData.dataSource, // NEW: Where data came from
                dataPoints: priceRangeData.dataPoints,
                lastUpdated: priceRangeData.lastUpdated
            };
            
        } catch (error) {
            console.error('Error in getMarketPriceRange:', error);
            throw error;
        }
    }

    async getFeatureImpact(keyword, features = {}) {
        try {
            const product = await listingRepository.findProductIdByName(keyword);
            if (!product) throw new Error('Product not found');
            
            const impact = await mlModelService.getFeatureImpact(product.product_id, features);
            
            return {
                product: {
                    id: product.product_id,
                    name: product.name,
                    brand: product.brand
                },
                impact: impact
            };
        } catch (error) {
            console.error('Error in getFeatureImpact:', error);
            throw error;
        }
    }
}

module.exports = new PriceInquiryService();
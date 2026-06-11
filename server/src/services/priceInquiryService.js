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

    async getMarketPriceRange(keyword, features = {}, productId = null, opts = {}) {
        try {
            const includePremiumData = opts.includePremiumData === true;
            let resolvedProductId = productId;

            if (resolvedProductId) {
                const row = await listingRepository.findProductById(resolvedProductId);
                if (!row) throw new Error('Product not found');
            } else {
                const specFilters = {
                    storage: features.storage,
                    ram: features.ram,
                };
                const product = await listingRepository.resolveProductForKeyword(keyword, specFilters);
                if (!product) throw new Error('Product not found');
                resolvedProductId = product.product_id;
            }

            // Run price prediction + similar listings + product info in parallel
            const [priceRangeData, productRow] = await Promise.all([
                mlModelService.predictPriceInquiry(
                    resolvedProductId,
                    features,
                    { useForecastSignal: includePremiumData }
                ),
                listingRepository.findProductById(resolvedProductId),
            ]);
            if (!priceRangeData) throw new Error('Unable to calculate price range');

            // Fetch similar listings + premium data all in parallel
            const [similarListings, priceHistory, mlForecast, forecastHistory] =
                await Promise.all([
                    listingRepository.findSimilarListingsByPrice(
                        resolvedProductId,
                        priceRangeData.priceRange,
                        20
                    ),
                    includePremiumData
                        ? priceHistoryRepository.getLatestPriceData(resolvedProductId, 30)
                        : Promise.resolve([]),
                    includePremiumData
                        ? priceForecastRepository.getLatestForecast(resolvedProductId).catch(() => null)
                        : Promise.resolve(null),
                    includePremiumData
                        ? priceForecastRepository.getForecastHistory(resolvedProductId, 30).catch(() => [])
                        : Promise.resolve([]),
                ]);

            return {
                product: {
                    id: resolvedProductId,
                    name: productRow.name,
                    brand: productRow.brand,
                    modelSeries: productRow.model_series,
                    baseSpecs: productRow.base_specs // Include JSON specs
                },
                marketPriceRange: {
                    min: priceRangeData.priceRange.min,
                    max: priceRangeData.priceRange.max,
                    average: priceRangeData.priceRange.avg,
                    median: priceRangeData.priceRange.median,
                    confidence: priceRangeData.confidence,
                    currency: 'VND'
                },
                featureAnalysis: includePremiumData
                    ? {
                        featuresUsed: priceRangeData.featuresUsed || [],
                        impacts: priceRangeData.priceRange.impacts || [],
                        totalFeatureCount: priceRangeData.featuresUsed?.length || 0
                    }
                    : null,
                similarListings: similarListings.map(listing => ({
                    id: listing.id,
                    name: listing.name,
                    price: listing.price,
                    originalPrice: listing.originalPrice,
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
            const specFilters = {
                storage: features.storage,
                ram: features.ram,
            };
            const product = await listingRepository.resolveProductForKeyword(keyword, specFilters);
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

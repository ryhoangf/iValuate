const listingRepository = require('../repositories/listingRepository');
const priceHistoryRepository = require('../repositories/PriceHistoryRepository');
const mlModelService = require('./MLModelService');

class PriceInquiryService {
    async getBasicPriceInfo(keyword, filters = {}) {
        // 1. Get filtered listings from repository
        const listings = await listingRepository.findActiveListingsByName(keyword, filters);

        // 2. Get available filter options (for dynamic filter UI)
        const availableFilters = await listingRepository.getAvailableFilters(keyword);

        // 3. Calculate price statistics
        let summary = null;

        if (listings.length > 0) {
            const prices = listings.map(item => Number(item.price));
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            
            // Calculate average
            const total = prices.reduce((a, b) => a + b, 0);
            const avgPrice = Math.round(total / prices.length);

            // Calculate median
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

        // 4. Return Data Transfer Object (DTO)
        return {
            summary: summary,
            listings: listings,
            availableFilters: availableFilters
        };
    }

    /**
     * Lấy khoảng giá thị trường hợp lý và danh sách sản phẩm tương tự
     * @param {string} keyword - Tên sản phẩm
     * @param {object} features - Các thuộc tính (condition, battery_health, etc.)
     * @returns {PricingInquiryDTO}
     */
    async getMarketPriceRange(keyword, features = {}) {
        try {
            // 1. Tìm product_id từ keyword
            const product = await listingRepository.findProductIdByName(keyword);
            
            if (!product) {
                throw new Error('Product not found');
            }
            
            const productId = product.product_id;
            
            // 2. Lấy khoảng giá hợp lý từ ML Model Service
            const priceRangeData = await mlModelService.predictPriceInquiry(productId, features);
            
            if (!priceRangeData) {
                throw new Error('Unable to calculate price range');
            }
            
            // 3. Tìm các sản phẩm có giá tương tự
            const similarListings = await listingRepository.findSimilarListingsByPrice(
                productId,
                priceRangeData.priceRange,
                20 // Limit 20 listings
            );
            
            // 4. Lấy price history để hiển thị trend
            const priceHistory = await priceHistoryRepository.getLatestPriceData(productId, 30);
            
            // 5. Return DTO
            return {
                product: {
                    id: product.product_id,
                    name: product.name,
                    brand: product.brand,
                    modelSeries: product.model_series
                },
                marketPriceRange: {
                    min: priceRangeData.priceRange.min,
                    max: priceRangeData.priceRange.max,
                    average: priceRangeData.priceRange.avg,
                    median: priceRangeData.priceRange.median,
                    confidence: priceRangeData.confidence,
                    currency: 'VND'
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
                priceHistory: priceHistory,
                dataPoints: priceRangeData.dataPoints,
                lastUpdated: priceRangeData.lastUpdated
            };
            
        } catch (error) {
            console.error('Error in getMarketPriceRange:', error);
            throw error;
        }
    }
}

module.exports = new PriceInquiryService();
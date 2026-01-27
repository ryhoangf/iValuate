const priceHistoryRepository = require('../repositories/PriceHistoryRepository');
const listingRepository = require('../repositories/listingRepository');

class MLModelService {
    /**
     * Tính khoảng giá thị trường hợp lý dựa trên lịch sử và listings hiện tại
     * @param {string} productId - ID sản phẩm
     * @param {object} features - Các thuộc tính sản phẩm (condition, battery_health, etc.)
     * @returns {PriceRangeDTO}
     */
    async predictPriceInquiry(productId, features = {}) {
        try {
            // 1. Lấy dữ liệu lịch sử giá (30 ngày gần nhất)
            const historicalData = await priceHistoryRepository.calculatePriceRange(productId, 30);
            
            // 2. Lấy giá của các listings hiện tại
            const currentListings = await listingRepository.findActiveListingsByName(
                '', 
                { /* không filter */ }
            );
            
            // 3. Tính toán statistical price range
            let priceRange;
            
            if (historicalData && historicalData.avgPrice) {
                // Sử dụng historical data nếu có
                const avgPrice = parseFloat(historicalData.avgPrice);
                const stdDev = parseFloat(historicalData.priceStdDev) || avgPrice * 0.15; // Default 15% if no stddev
                
                priceRange = {
                    min: Math.round(avgPrice - stdDev),
                    max: Math.round(avgPrice + stdDev),
                    avg: Math.round(avgPrice),
                    median: Math.round((historicalData.avgMinPrice + historicalData.avgMaxPrice) / 2),
                    confidence: 0.85 // 85% confidence with historical data
                };
            } else if (currentListings && currentListings.length > 0) {
                // Fallback: Sử dụng current listings
                const prices = currentListings.map(l => parseFloat(l.price));
                const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
                const sortedPrices = prices.sort((a, b) => a - b);
                const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
                
                // Tính standard deviation
                const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
                const stdDev = Math.sqrt(variance);
                
                priceRange = {
                    min: Math.round(avgPrice - stdDev),
                    max: Math.round(avgPrice + stdDev),
                    avg: Math.round(avgPrice),
                    median: Math.round(median),
                    confidence: 0.70 // 70% confidence with only current data
                };
            } else {
                // Không có data
                return null;
            }
            
            // 4. Điều chỉnh theo features (condition, battery_health)
            if (features.condition) {
                priceRange = this.adjustPriceByCondition(priceRange, features.condition);
            }
            
            if (features.battery_health) {
                priceRange = this.adjustPriceByBattery(priceRange, features.battery_health);
            }
            
            return {
                productId,
                priceRange,
                confidence: priceRange.confidence,
                dataPoints: currentListings.length,
                lastUpdated: new Date()
            };
            
        } catch (error) {
            console.error('Error in predictPriceInquiry:', error);
            throw error;
        }
    }

    /**
     * Điều chỉnh giá theo condition
     */
    adjustPriceByCondition(priceRange, condition) {
        const conditionMultipliers = {
            'S': 1.15,  // +15% for excellent condition
            'A': 1.05,  // +5% for good condition
            'B': 1.0,   // Base price
            'C': 0.90,  // -10% for fair condition
            'D': 0.75   // -25% for poor condition
        };
        
        const multiplier = conditionMultipliers[condition.toUpperCase()] || 1.0;
        
        return {
            ...priceRange,
            min: Math.round(priceRange.min * multiplier),
            max: Math.round(priceRange.max * multiplier),
            avg: Math.round(priceRange.avg * multiplier),
            median: Math.round(priceRange.median * multiplier)
        };
    }

    /**
     * Điều chỉnh giá theo battery health
     */
    adjustPriceByBattery(priceRange, batteryHealth) {
        let multiplier = 1.0;
        
        if (batteryHealth >= 95) multiplier = 1.05;      // +5%
        else if (batteryHealth >= 85) multiplier = 1.0;  // Base
        else if (batteryHealth >= 80) multiplier = 0.95; // -5%
        else if (batteryHealth >= 70) multiplier = 0.90; // -10%
        else multiplier = 0.85;                          // -15%
        
        return {
            ...priceRange,
            min: Math.round(priceRange.min * multiplier),
            max: Math.round(priceRange.max * multiplier),
            avg: Math.round(priceRange.avg * multiplier),
            median: Math.round(priceRange.median * multiplier)
        };
    }

    /**
     * Lấy các attribute ảnh hưởng đến giá
     */
    async getFeatureImpact(productId, features) {
        const baseRange = await this.predictPriceInquiry(productId, {});
        const adjustedRange = await this.predictPriceInquiry(productId, features);
        
        return {
            condition: {
                impact: features.condition ? 
                    ((adjustedRange.priceRange.avg - baseRange.priceRange.avg) / baseRange.priceRange.avg * 100).toFixed(2) + '%' 
                    : '0%',
                description: `Condition ${features.condition} affects price`
            },
            batteryHealth: {
                impact: features.battery_health ?
                    ((adjustedRange.priceRange.avg - baseRange.priceRange.avg) / baseRange.priceRange.avg * 100).toFixed(2) + '%'
                    : '0%',
                description: `Battery health ${features.battery_health}% affects price`
            }
        };
    }
}

module.exports = new MLModelService();
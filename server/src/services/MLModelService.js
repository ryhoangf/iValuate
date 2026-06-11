const priceHistoryRepository = require('../repositories/PriceHistoryRepository');
const priceForecastRepository = require('../repositories/PriceForecastRepository'); // NEW
const listingRepository = require('../repositories/listingRepository');

class MLModelService {
    async predictPriceInquiry(productId, features = {}, opts = {}) {
        try {
            const useForecastSignal = opts.useForecastSignal === true;
            // Run all independent data fetches in parallel
            const [historicalData, mlForecast, currentListings] = await Promise.all([
                priceHistoryRepository.calculatePriceRange(productId, 30),
                useForecastSignal
                    ? priceForecastRepository.getLatestForecast(productId).catch(() => null)
                    : Promise.resolve(null),
                this.getFilteredListingsByFeatures(productId, features),
            ]);
            
            // 4. Tính statistical price range
            let priceRange;
            let dataSource = 'listings';
            
            if (historicalData && historicalData.avgPrice) {
                //Dùng historical data nếu có
                const avgPrice = parseFloat(historicalData.avgPrice);
                const stdDev = parseFloat(historicalData.priceStdDev) || avgPrice * 0.15;
                
                priceRange = {
                    min: Math.round(avgPrice - stdDev),
                    max: Math.round(avgPrice + stdDev),
                    avg: Math.round(avgPrice),
                    median: Math.round((historicalData.avgMinPrice + historicalData.avgMaxPrice) / 2),
                    confidence: 0.80,
                };
                dataSource = 'price_history';
                
                // ENHANCEMENT: Adjust confidence nếu có ML forecast đồng ý
                if (mlForecast && mlForecast.predicted_price) {
                    const forecastPrice = parseFloat(mlForecast.predicted_price);
                    const difference = Math.abs(forecastPrice - avgPrice) / avgPrice;
                    
                    // Nếu ML forecast gần với historical avg → tăng confidence
                    if (difference < 0.1) { // Within 10%
                        priceRange.confidence = Math.min(0.95, priceRange.confidence + 0.1);
                        dataSource = 'price_history + ml_forecast';
                    }
                }
                
            } else if (currentListings && currentListings.length > 0) {
                // PRIORITY 2: Fallback to current listings
                const prices = currentListings.map(l => parseFloat(l.price));
                const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
                const sortedPrices = prices.sort((a, b) => a - b);
                const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
                
                const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
                const stdDev = Math.sqrt(variance);
                
                priceRange = {
                    min: Math.round(Math.max(0, avgPrice - stdDev)),
                    max: Math.round(avgPrice + stdDev),
                    avg: Math.round(avgPrice),
                    median: Math.round(median),
                    confidence: 0.70
                };
                dataSource = 'active_listings';
                
            } else if (mlForecast && mlForecast.predicted_price) {
                // PRIORITY 3: Last resort - dùng ML forecast nếu không có data nào
                const forecastPrice = parseFloat(mlForecast.predicted_price);
                const confidence = parseFloat(mlForecast.confidence_score) / 100;
                const margin = forecastPrice * (1 - confidence) * 0.5;
                
                priceRange = {
                    min: Math.round(forecastPrice - margin),
                    max: Math.round(forecastPrice + margin),
                    avg: Math.round(forecastPrice),
                    median: Math.round(forecastPrice),
                    confidence: confidence
                };
                dataSource = 'ml_forecast_only';
                
            } else {
                return null;
            }
            
            // 5. Điều chỉnh giá theo TẤT CẢ features
            priceRange = this.adjustPriceByAllFeatures(priceRange, features);
            
            return {
                productId,
                priceRange,
                confidence: priceRange.confidence,
                dataPoints: currentListings.length,
                dataSource: dataSource, // NEW: Show where data came from
                lastUpdated: new Date(),
                featuresUsed: this.getUsedFeatures(features)
            };
            
        } catch (error) {
            console.error('Error in predictPriceInquiry:', error);
            throw error;
        }
    }

    /**
     * Lấy listings có features tương tự để so sánh chính xác hơn
     */
    async getFilteredListingsByFeatures(productId, features) {
        const product = await listingRepository.findProductById(productId);
        if (!product) return [];

        const filters = {};
        if (features.condition) filters.condition = features.condition;
        if (features.color) filters.color = features.color;
        if (features.batteryStatus) filters.batteryStatus = features.batteryStatus;
        if (features.screenCondition) filters.screenCondition = features.screenCondition;
        if (features.bodyCondition) filters.bodyCondition = features.bodyCondition;
        if (features.battery_health) filters.minBattery = Math.max(0, features.battery_health - 5);
        if (features.batteryReplaced !== undefined) filters.batteryReplaced = features.batteryReplaced;
        if (features.hasBox !== undefined) filters.hasBox = features.hasBox;
        if (features.hasCharger !== undefined) filters.hasCharger = features.hasCharger;
        if (features.hasCable !== undefined) filters.hasCable = features.hasCable;
        if (features.hasEarphones !== undefined) filters.hasEarphones = features.hasEarphones;
        if (features.isSimFree !== undefined) filters.isSimFree = features.isSimFree;
        if (features.fullyFunctional !== undefined) filters.fullyFunctional = features.fullyFunctional;

        // Limit to 2000 rows for price statistics — sufficient for accurate range calculation
        return await listingRepository.findActiveListingsByName(product.name, filters, 2000);
    }

    /**
     * Điều chỉnh giá theo TẤT CẢ features (comprehensive)
     */
    adjustPriceByAllFeatures(priceRange, features) {
        let totalMultiplier = 1.0;
        const impacts = [];

        if (features.condition) {
            const multiplier = this.getConditionMultiplier(features.condition);
            totalMultiplier *= multiplier;
            impacts.push({ feature: 'condition', value: features.condition, multiplier });
        }

        if (features.battery_health) {
            const multiplier = this.getBatteryHealthMultiplier(features.battery_health);
            totalMultiplier *= multiplier;
            impacts.push({ feature: 'battery_health', value: features.battery_health, multiplier });
        }

        if (features.screenCondition) {
            const multiplier = this.getScreenConditionMultiplier(features.screenCondition);
            totalMultiplier *= multiplier;
            impacts.push({ feature: 'screenCondition', value: features.screenCondition, multiplier });
        }

        if (features.bodyCondition) {
            const multiplier = this.getBodyConditionMultiplier(features.bodyCondition);
            totalMultiplier *= multiplier;
            impacts.push({ feature: 'bodyCondition', value: features.bodyCondition, multiplier });
        }

        if (features.batteryReplaced === true) {
            totalMultiplier *= 1.08;
            impacts.push({ feature: 'batteryReplaced', value: true, multiplier: 1.08 });
        }

        const accessoryMultiplier = this.getAccessoryMultiplier(features);
        if (accessoryMultiplier !== 1.0) {
            totalMultiplier *= accessoryMultiplier;
            impacts.push({ feature: 'accessories', value: 'bundled', multiplier: accessoryMultiplier });
        }

        if (features.isSimFree === true) {
            totalMultiplier *= 1.03;
            impacts.push({ feature: 'isSimFree', value: true, multiplier: 1.03 });
        }

        if (features.fullyFunctional === false) {
            totalMultiplier *= 0.85;
            impacts.push({ feature: 'fullyFunctional', value: false, multiplier: 0.85 });
        }

        return {
            ...priceRange,
            min: Math.round(priceRange.min * totalMultiplier),
            max: Math.round(priceRange.max * totalMultiplier),
            avg: Math.round(priceRange.avg * totalMultiplier),
            median: Math.round(priceRange.median * totalMultiplier),
            impacts: impacts
        };
    }

    /**
     * Điều chỉnh giá theo condition
     */
    getConditionMultiplier(condition) {
        const multipliers = { 'S': 1.20, 'A': 1.10, 'B': 1.0, 'C': 0.88, 'D': 0.70 };
        return multipliers[condition.toUpperCase()] || 1.0;
    }

    /**
     * Điều chỉnh giá theo battery health
     */
    getBatteryHealthMultiplier(batteryHealth) {
        if (batteryHealth >= 95) return 1.08;
        if (batteryHealth >= 90) return 1.04;
        if (batteryHealth >= 85) return 1.0;
        if (batteryHealth >= 80) return 0.96;
        if (batteryHealth >= 75) return 0.92;
        if (batteryHealth >= 70) return 0.88;
        return 0.82;
    }

    /**
     * Điều chỉnh giá theo screen condition
     */
    getScreenConditionMultiplier(screenCondition) {
        const multipliers = {
            'Perfect': 1.05, 'Excellent': 1.02, 'Good': 1.0,
            'Fair': 0.95, 'Scratched': 0.90, 'Cracked': 0.75
        };
        return multipliers[screenCondition] || 1.0;
    }

    /**
     * Điều chỉnh giá theo body condition
     */
    getBodyConditionMultiplier(bodyCondition) {
        const multipliers = {
            'Perfect': 1.04, 'Excellent': 1.02, 'Good': 1.0,
            'Fair': 0.96, 'Scratched': 0.92, 'Dented': 0.85
        };
        return multipliers[bodyCondition] || 1.0;
    }

    /**
     * Điều chỉnh giá theo phụ kiện đi kèm
     */
    getAccessoryMultiplier(features) {
        let multiplier = 1.0;
        let count = 0;

        if (features.hasBox === true) { multiplier += 0.03; count++; }
        if (features.hasCharger === true) { multiplier += 0.02; count++; }
        if (features.hasCable === true) { multiplier += 0.01; count++; }
        if (features.hasEarphones === true) { multiplier += 0.02; count++; }

        if (count >= 4) multiplier += 0.02;
        return multiplier;
    }

    /**
     * Lấy danh sách features đã sử dụng để predict
     */
    getUsedFeatures(features) {
        const used = [];
        Object.keys(features).forEach(key => {
            if (features[key] !== undefined && features[key] !== null && features[key] !== 'all') {
                used.push(key);
            }
        });
        return used;
    }

    /**
     * Lấy các attribute ảnh hưởng đến giá với chi tiết
     */
    async getFeatureImpact(productId, features) {
        const baseRange = await this.predictPriceInquiry(productId, {});
        const adjustedRange = await this.predictPriceInquiry(productId, features);
        
        if (!baseRange || !adjustedRange) return null;

        const impacts = adjustedRange.priceRange.impacts || [];
        const totalImpact = ((adjustedRange.priceRange.avg - baseRange.priceRange.avg) / baseRange.priceRange.avg * 100).toFixed(2);

        return {
            totalImpact: `${totalImpact}%`,
            breakdown: impacts.map(impact => ({
                feature: impact.feature,
                value: impact.value,
                impact: `${((impact.multiplier - 1) * 100).toFixed(2)}%`,
                multiplier: impact.multiplier
            })),
            basePrice: baseRange.priceRange.avg,
            adjustedPrice: adjustedRange.priceRange.avg,
            priceDifference: adjustedRange.priceRange.avg - baseRange.priceRange.avg
        };
    }
}

module.exports = new MLModelService();

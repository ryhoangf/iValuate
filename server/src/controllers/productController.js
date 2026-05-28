const priceInquiryService = require('../services/priceInquiryService');
const depreciationCurveService = require('../services/depreciationCurveService');
const counterfactualImpactService = require('../services/counterfactualImpactService');

/** Lite: khoảng giá + tin tương tự. Premium: thêm lịch sử, dự báo, feature breakdown. */
function marketPricePayloadForSubscription(full, tier) {
    if (tier === 'premium') {
        return { ...full, subscriptionTier: 'premium' };
    }
    return {
        ...full,
        priceHistory: [],
        priceForecasts: { latest: null, history: [] },
        featureAnalysis: null,
        subscriptionTier: 'lite',
    };
}

class ProductController {
    // Handle search and filter requests
    async searchAndEvaluate(req, res) {
        try {
            const { 
                keyword, 
                condition, 
                color,
                platform,
                batteryStatus,
                screenCondition,
                bodyCondition,
                minBattery,
                batteryReplaced,
                hasBox,
                hasCharger,
                hasCable,
                hasEarphones,
                isSimFree,
                fullyFunctional,
                minPrice,
                maxPrice
            } = req.query;

            if (!keyword) {
                return res.status(400).json({ message: "Vui lòng nhập tên sản phẩm cần tìm" });
            }

            // Build filters object from query parameters
            const filters = {};
            if (condition && condition !== 'all') filters.condition = condition;
            if (color && color !== 'all') filters.color = color;
            if (platform && platform !== 'all') filters.platform = platform;
            if (batteryStatus && batteryStatus !== 'all') filters.batteryStatus = batteryStatus;
            if (screenCondition && screenCondition !== 'all') filters.screenCondition = screenCondition;
            if (bodyCondition && bodyCondition !== 'all') filters.bodyCondition = bodyCondition;
            
            // Boolean filters
            if (batteryReplaced === '1') filters.batteryReplaced = true;
            if (hasBox === '1') filters.hasBox = true;
            if (hasCharger === '1') filters.hasCharger = true;
            if (hasCable === '1') filters.hasCable = true;
            if (hasEarphones === '1') filters.hasEarphones = true;
            if (isSimFree === '1') filters.isSimFree = true;
            if (fullyFunctional === '1') filters.fullyFunctional = true;
            
            if (minBattery) filters.minBattery = minBattery;
            if (minPrice) filters.minPrice = minPrice;
            if (maxPrice) filters.maxPrice = maxPrice;

            // Call service with filters
            const result = await priceInquiryService.getBasicPriceInfo(keyword, filters);
            
            res.json(result);

        } catch (error) {
            console.error("Lỗi Controller:", error);
            res.status(500).json({ 
                message: "Lỗi Server nội bộ",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Endpoint: Lấy khoảng giá thị trường với TẤT CẢ features
     * GET /api/products/market-price?keyword=iPhone&condition=A&battery_health=85&screenCondition=Good&hasBox=1...
     */
    async getMarketPriceRange(req, res) {
        try {
            const { 
                keyword, 
                condition, 
                battery_health,
                screenCondition,
                bodyCondition,
                batteryStatus,
                batteryReplaced,
                hasBox,
                hasCharger,
                hasCable,
                hasEarphones,
                isSimFree,
                fullyFunctional,
                color
            } = req.query;

            if (!keyword) {
                return res.status(400).json({ message: "Vui lòng nhập tên sản phẩm" });
            }

            // Build features object với TẤT CẢ thuộc tính
            const features = {};
            
            // Basic features
            if (condition) features.condition = condition;
            if (battery_health) features.battery_health = parseInt(battery_health);
            if (color) features.color = color;
            
            // Condition features
            if (screenCondition) features.screenCondition = screenCondition;
            if (bodyCondition) features.bodyCondition = bodyCondition;
            if (batteryStatus) features.batteryStatus = batteryStatus;
            
            // Boolean features - accessories
            if (batteryReplaced === '1' || batteryReplaced === 'true') features.batteryReplaced = true;
            if (hasBox === '1' || hasBox === 'true') features.hasBox = true;
            if (hasCharger === '1' || hasCharger === 'true') features.hasCharger = true;
            if (hasCable === '1' || hasCable === 'true') features.hasCable = true;
            if (hasEarphones === '1' || hasEarphones === 'true') features.hasEarphones = true;
            
            // Boolean features - functionality
            if (isSimFree === '1' || isSimFree === 'true') features.isSimFree = true;
            if (fullyFunctional === '0' || fullyFunctional === 'false') features.fullyFunctional = false;
            else if (fullyFunctional === '1' || fullyFunctional === 'true') features.fullyFunctional = true;

            const result = await priceInquiryService.getMarketPriceRange(keyword, features);
            const tier = req.subscriptionTier || 'lite';
            res.json(marketPricePayloadForSubscription(result, tier));

        } catch (error) {
            console.error("Lỗi getMarketPriceRange:", error);
            res.status(500).json({ 
                message: error.message || "Lỗi Server nội bộ",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * NEW: Endpoint để xem impact của từng feature
     * GET /api/products/feature-impact?keyword=iPhone&condition=A&battery_health=85
     */
    async getFeatureImpact(req, res) {
        try {
            const { keyword, ...features } = req.query;

            if (!keyword) {
                return res.status(400).json({ message: "Vui lòng nhập tên sản phẩm" });
            }

            // Parse features
            const parsedFeatures = {};
            if (features.condition) parsedFeatures.condition = features.condition;
            if (features.battery_health) parsedFeatures.battery_health = parseInt(features.battery_health);
            if (features.screenCondition) parsedFeatures.screenCondition = features.screenCondition;
            if (features.bodyCondition) parsedFeatures.bodyCondition = features.bodyCondition;
            if (features.hasBox) parsedFeatures.hasBox = features.hasBox === '1';
            if (features.hasCharger) parsedFeatures.hasCharger = features.hasCharger === '1';

            const result = await priceInquiryService.getFeatureImpact(keyword, parsedFeatures);
            
            res.json(result);

        } catch (error) {
            console.error("Lỗi getFeatureImpact:", error);
            res.status(500).json({ 
                message: error.message || "Lỗi Server nội bộ",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * GET /api/products/depreciation-curve?product_id=...&keyword=...
     * Proxy tới FastAPI SmartPricePredictor (đường cong trượt giá mô hình).
     */
    async getDepreciationCurve(req, res) {
        try {
            const { product_id, keyword } = req.query;
            if (!product_id && !keyword) {
                return res.status(400).json({
                    message: 'Cần product_id hoặc keyword',
                });
            }
            const result = await depreciationCurveService.getCurve({
                productId: product_id || undefined,
                keyword: keyword || undefined,
            });
            res.json(result);
        } catch (error) {
            console.error('Lỗi getDepreciationCurve:', error);
            const msg = error.message || '';
            let status = 500;
            if (msg.includes('Không tìm thấy') || msg.includes('Cần product_id')) {
                status = 404;
            } else if (msg.includes('503') || msg.includes('Chưa có model')) {
                status = 503;
            }
            res.status(status).json({
                message: msg || 'Lỗi Server nội bộ',
            });
        }
    }

    /**
     * POST /api/products/counterfactual-impact
     * Body: { product_id?, keyword?, filters?, include_all_scenarios? }
     * Proxy FastAPI POST /feature-impact/counterfactual
     */
    async postCounterfactualImpact(req, res) {
        try {
            const { product_id, keyword, filters: bodyFilters = {}, include_all_scenarios } = req.body || {};
            if (!product_id && !keyword) {
                return res.status(400).json({ message: 'Cần product_id hoặc keyword trong body' });
            }
            const filters = {
                ...bodyFilters,
                include_all_scenarios: include_all_scenarios === true,
            };
            const result = await counterfactualImpactService.getReport({
                productId: product_id || undefined,
                keyword: keyword || undefined,
                filters,
            });
            res.json(result);
        } catch (error) {
            console.error('Lỗi postCounterfactualImpact:', error);
            const msg = error.message || '';
            let status = 500;
            if (msg.includes('Không tìm thấy') || msg.includes('Cần product_id')) {
                status = 404;
            } else if (msg.includes('503') || msg.includes('Chưa có model') || msg.includes('Không tìm thấy model')) {
                status = 503;
            }
            res.status(status).json({
                message: msg || 'Lỗi Server nội bộ',
            });
        }
    }
}

module.exports = new ProductController();
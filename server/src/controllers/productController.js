const priceInquiryService = require('../services/priceInquiryService');
const depreciationCurveService = require('../services/depreciationCurveService');
const counterfactualImpactService = require('../services/counterfactualImpactService');
const priceForecast30dService = require('../services/priceForecast30dService');
const listingRepository = require('../repositories/listingRepository');
const { MARKET_BRANDS } = require('../constants/marketBrands');

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
    /** GET /api/products/brand-catalog — hãng + model nhiều tin nhất */
    async getBrandCatalog(req, res) {
        try {
            const maxBrands = req.query.maxBrands;
            const perBrand = req.query.perBrand;
            const data = await listingRepository.getBrandCatalog({ maxBrands, perBrand });
            res.json(data);
        } catch (error) {
            console.warn('Brand catalog DB unavailable, using static fallback:', error.message);
            res.json({
                brands: MARKET_BRANDS.map((brand) => ({ ...brand, models: [] })),
                suggestions: [],
                fallback: true,
            });
        }
    }

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
                maxPrice,
                storage,
                ram
            } = req.query;

            if (!keyword) {
                return res.status(400).json({ message: "Please enter a product name to search" });
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
            if (storage && storage !== 'all') filters.storage = storage;
            if (ram && ram !== 'all') filters.ram = ram;

            // Call service with filters
            const result = await priceInquiryService.getBasicPriceInfo(keyword, filters);
            
            res.json(result);

        } catch (error) {
            console.error("Lỗi Controller:", error);
            res.status(500).json({ 
                message: "Internal server error",
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
                product_id,
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
                color,
                storage,
                ram
            } = req.query;

            if (!keyword) {
                return res.status(400).json({ message: "Please enter a product name" });
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
            if (storage && storage !== 'all') features.storage = storage;
            if (ram && ram !== 'all') features.ram = ram;

            const tier = req.subscriptionTier || 'lite';
            const result = await priceInquiryService.getMarketPriceRange(
                keyword,
                features,
                product_id || undefined,
                { includePremiumData: tier === 'premium' }
            );
            res.json(marketPricePayloadForSubscription(result, tier));

        } catch (error) {
            console.error("Lỗi getMarketPriceRange:", error);
            const msg = error.message || '';
            const status =
                msg === 'Product not found' || msg.includes('Product not found')
                    ? 404
                    : 500;
            res.status(status).json({
                message: msg || "Internal server error",
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
                return res.status(400).json({ message: "Please enter a product name" });
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
                message: error.message || "Internal server error",
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
                    message: 'product_id or keyword is required',
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
            if (msg.includes('Product not found') || msg.includes('product_id or keyword')) {
                status = 404;
            } else if (msg.includes('503') || msg.includes('No model') || msg.includes('model not found')) {
                status = 503;
            }
            res.status(status).json({
                message: msg || 'Internal server error',
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
                return res.status(400).json({ message: 'product_id or keyword is required in body' });
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
            if (msg.includes('Product not found') || msg.includes('product_id or keyword')) {
                status = 404;
            } else if (msg.includes('503') || msg.includes('No model') || msg.includes('model not found')) {
                status = 503;
            }
            res.status(status).json({
                message: msg || 'Internal server error',
            });
        }
    }

    /**
     * GET /api/products/price-forecast-30d?product_id=...&keyword=...&horizon_days=30
     * Proxy FastAPI GET /price-forecast/30d
     */
    async getPriceForecast30d(req, res) {
        try {
            const { product_id, keyword, horizon_days } = req.query;
            if (!product_id && !keyword) {
                return res.status(400).json({ message: 'product_id or keyword is required' });
            }
            const horizonDays =
                horizon_days != null && horizon_days !== ''
                    ? Number.parseInt(String(horizon_days), 10)
                    : undefined;
            const result = await priceForecast30dService.getForecast({
                productId: product_id || undefined,
                keyword: keyword || undefined,
                horizonDays: Number.isNaN(horizonDays) ? undefined : horizonDays,
            });
            res.json(result);
        } catch (error) {
            console.error('Lỗi getPriceForecast30d:', error);
            const msg = error.message || '';
            let status = 500;
            if (msg.includes('Product not found') || msg.includes('product_id or keyword')) {
                status = 404;
            } else if (msg.includes('503') || msg.includes('No model') || msg.includes('model not found')) {
                status = 503;
            }
            res.status(status).json({
                message: msg || 'Internal server error',
            });
        }
    }
}

module.exports = new ProductController();

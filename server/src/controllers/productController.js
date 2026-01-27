const priceInquiryService = require('../services/priceInquiryService');

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
     * Endpoint mới: Lấy khoảng giá thị trường và sản phẩm tương tự
     * GET /api/products/market-price?keyword=iPhone&condition=A&battery_health=85
     */
    async getMarketPriceRange(req, res) {
        try {
            const { keyword, condition, battery_health } = req.query;

            if (!keyword) {
                return res.status(400).json({ message: "Vui lòng nhập tên sản phẩm" });
            }

            const features = {};
            if (condition) features.condition = condition;
            if (battery_health) features.battery_health = parseInt(battery_health);

            const result = await priceInquiryService.getMarketPriceRange(keyword, features);
            
            res.json(result);

        } catch (error) {
            console.error("Lỗi getMarketPriceRange:", error);
            res.status(500).json({ 
                message: error.message || "Lỗi Server nội bộ",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = new ProductController();
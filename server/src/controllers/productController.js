const priceInquiryService = require('../services/priceInquiryService');

class ProductController {
    // Xử lý Request tìm kiếm
    async searchAndEvaluate(req, res) {
        try {
            const { keyword } = req.query;

            if (!keyword) {
                return res.status(400).json({ message: "Vui lòng nhập tên sản phẩm cần tìm" });
            }

            // Gọi xuống Service
            const result = await priceInquiryService.getBasicPriceInfo(keyword);

            // Trả kết quả
            res.json(result);

        } catch (error) {
            console.error("Lỗi Controller:", error);
            res.status(500).json({ message: "Lỗi Server nội bộ" });
        }
    }
}

module.exports = new ProductController();
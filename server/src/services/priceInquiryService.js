const listingRepository = require('../repositories/listingRepository');

class PriceInquiryService {
    async getBasicPriceInfo(keyword) {
        // 1. Gọi Repository để lấy dữ liệu thô
        const listings = await listingRepository.findActiveListingsByName(keyword);

        // 2. Xử lý logic nghiệp vụ: Tính toán thống kê
        let summary = null;

        if (listings.length > 0) {
            const prices = listings.map(item => Number(item.price));
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            
            // Tính trung bình
            const total = prices.reduce((a, b) => a + b, 0);
            const avgPrice = Math.round(total / prices.length);

            summary = {
                min: minPrice,
                max: maxPrice,
                avg: avgPrice
            };
        }

        // 3. Trả về Data Transfer Object (DTO)
        return {
            summary: summary,
            listings: listings
        };
    }
}

module.exports = new PriceInquiryService();
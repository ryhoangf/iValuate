const db = require('../config/db');

class ListingRepository {
    // Hàm tìm kiếm sản phẩm theo tên (đúng như method findActiveListings trong UML)
    async findActiveListingsByName(keyword) {
        const query = `
            SELECT 
                l.listing_id as id,
                p.name as name, 
                l.price, 
                l.condition_rank as 'condition',
                l.source_url,
                l.platform,
                l.posted_at
            FROM active_listings l
            JOIN products p ON l.product_id = p.product_id
            WHERE p.name LIKE ? OR p.model_series LIKE ?
            ORDER BY l.price ASC
        `;
        const searchTerm = `%${keyword}%`;
        
        // Thực thi query
        const [rows] = await db.query(query, [searchTerm, searchTerm]);
        return rows;
    }
}

module.exports = new ListingRepository();
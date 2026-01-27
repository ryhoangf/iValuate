const db = require('../config/db');

class PriceHistoryRepository {
    // Lấy lịch sử giá của một sản phẩm trong khoảng thời gian
    async queryPriceHistory(productId, dateRange) {
        let query = `
            SELECT 
                history_id,
                product_id,
                record_date,
                avg_price,
                min_price,
                max_price,
                listing_count,
                original_price
            FROM price_history
            WHERE product_id = ?
        `;
        
        const params = [productId];
        
        if (dateRange && dateRange.startDate) {
            query += ' AND record_date >= ?';
            params.push(dateRange.startDate);
        }
        
        if (dateRange && dateRange.endDate) {
            query += ' AND record_date <= ?';
            params.push(dateRange.endDate);
        }
        
        query += ' ORDER BY record_date DESC';
        
        const [rows] = await db.query(query, params);
        return rows;
    }

    // Lấy dữ liệu giá gần nhất cho biểu đồ
    async getLatestPriceData(productId, limit = 30) {
        const query = `
            SELECT 
                record_date as date,
                avg_price as averagePrice,
                min_price as minPrice,
                max_price as maxPrice,
                listing_count as count
            FROM price_history
            WHERE product_id = ?
            ORDER BY record_date DESC
            LIMIT ?
        `;
        
        const [rows] = await db.query(query, [productId, limit]);
        return rows.reverse(); // Reverse to show oldest to newest
    }

    // Tính khoảng giá hợp lý dựa trên lịch sử
    async calculatePriceRange(productId, days = 30) {
        const query = `
            SELECT 
                AVG(avg_price) as avgPrice,
                MIN(min_price) as minPrice,
                MAX(max_price) as maxPrice,
                AVG(min_price) as avgMinPrice,
                AVG(max_price) as avgMaxPrice,
                STDDEV(avg_price) as priceStdDev
            FROM price_history
            WHERE product_id = ?
            AND record_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        `;
        
        const [rows] = await db.query(query, [productId, days]);
        return rows[0];
    }

    // Lưu/cập nhật dữ liệu price history
    async savePriceHistory(historyData) {
        const { history_id, product_id, record_date, avg_price, min_price, max_price, listing_count, original_price } = historyData;
        
        const query = `
            INSERT INTO price_history 
            (history_id, product_id, record_date, avg_price, min_price, max_price, listing_count, original_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            avg_price = VALUES(avg_price),
            min_price = VALUES(min_price),
            max_price = VALUES(max_price),
            listing_count = VALUES(listing_count),
            original_price = VALUES(original_price)
        `;
        
        await db.query(query, [history_id, product_id, record_date, avg_price, min_price, max_price, listing_count, original_price]);
    }
}

module.exports = new PriceHistoryRepository();
const db = require('../config/db');

class ListingRepository {
    async findActiveListingsByName(keyword, filters = {}) {
        let query = `
            SELECT 
                l.listing_id as id,
                p.name as name, 
                p.brand,
                p.model_series,
                l.price, 
                l.currency,
                l.condition_rank as 'condition',
                l.battery_health,
                l.battery_percentage,
                l.battery_status,
                l.battery_replaced,
                l.color,
                l.source_url,
                l.platform,
                l.posted_at,
                l.description,
                l.screen_condition,
                l.body_condition,
                l.has_box,
                l.has_charger,
                l.has_cable,
                l.has_earphones,
                l.is_sim_free,
                l.network_restriction,
                l.fully_functional,
                l.has_issues,
                p.base_specs
            FROM active_listings l
            JOIN products p ON l.product_id = p.product_id
            WHERE (p.name LIKE ? OR p.model_series LIKE ?)
        `;
        
        const params = [`%${keyword}%`, `%${keyword}%`];

        // Add filter conditions dynamically
        if (filters.condition && filters.condition !== 'all') {
            query += ' AND l.condition_rank = ?';
            params.push(filters.condition);
        }

        if (filters.color && filters.color !== 'all') {
            query += ' AND l.color = ?';
            params.push(filters.color);
        }

        if (filters.batteryStatus && filters.batteryStatus !== 'all') {
            query += ' AND l.battery_status = ?';
            params.push(filters.batteryStatus);
        }

        if (filters.screenCondition && filters.screenCondition !== 'all') {
            query += ' AND l.screen_condition = ?';
            params.push(filters.screenCondition);
        }

        if (filters.bodyCondition && filters.bodyCondition !== 'all') {
            query += ' AND l.body_condition = ?';
            params.push(filters.bodyCondition);
        }

        // Boolean filters
        if (filters.batteryReplaced === true) {
            query += ' AND l.battery_replaced = 1';
        }

        if (filters.hasBox === true) {
            query += ' AND l.has_box = 1';
        }

        if (filters.hasCharger === true) {
            query += ' AND l.has_charger = 1';
        }

        if (filters.isSimFree === true) {
            query += ' AND l.is_sim_free = 1';
        }

        if (filters.fullyFunctional === true) {
            query += ' AND l.fully_functional = 1';
        }

        // Filter by battery health - use COALESCE to handle NULL values
        if (filters.minBattery != null && !isNaN(filters.minBattery)) {
            query += ' AND COALESCE(l.battery_health, l.battery_percentage, 0) >= ?';
            params.push(parseInt(filters.minBattery));
        }

        // Filter by price range
        if (filters.minPrice) {
            query += ' AND l.price >= ?';
            params.push(parseFloat(filters.minPrice));
        }

        if (filters.maxPrice) {
            query += ' AND l.price <= ?';
            params.push(parseFloat(filters.maxPrice));
        }

        if (filters.platform && filters.platform !== 'all') {
            query += ' AND l.platform = ?';
            params.push(filters.platform);
        }

        query += ' ORDER BY l.price ASC';

        const [rows] = await db.query(query, params);
        
        // Normalize battery data
        return rows.map(row => ({
            ...row,
            battery_health: row.battery_health || row.battery_percentage || null
        }));
    }

    // Get available filter options for a specific product search
    async getAvailableFilters(keyword) {
        const query = `
            SELECT 
                l.condition_rank,
                l.color,
                l.platform,
                l.battery_status,
                l.screen_condition,
                l.body_condition,
                l.battery_health,
                l.battery_percentage,
                l.price
            FROM active_listings l
            JOIN products p ON l.product_id = p.product_id
            WHERE (p.name LIKE ? OR p.model_series LIKE ?)
        `;
        
        const searchTerm = `%${keyword}%`;
        const [rows] = await db.query(query, [searchTerm, searchTerm]);
        
        // Extract unique values for each filter
        const conditions = [...new Set(rows.map(r => r.condition_rank).filter(Boolean))];
        const colors = [...new Set(rows.map(r => r.color).filter(Boolean))];
        const platforms = [...new Set(rows.map(r => r.platform).filter(Boolean))];
        const batteryStatuses = [...new Set(rows.map(r => r.battery_status).filter(Boolean))];
        const screenConditions = [...new Set(rows.map(r => r.screen_condition).filter(Boolean))];
        const bodyConditions = [...new Set(rows.map(r => r.body_condition).filter(Boolean))];
        
        // Get battery health range
        const batteryHealths = rows
            .map(r => r.battery_health || r.battery_percentage)
            .filter(val => val != null && !isNaN(val));
        
        const minBattery = batteryHealths.length > 0 ? Math.min(...batteryHealths) : 0;
        const maxBattery = batteryHealths.length > 0 ? Math.max(...batteryHealths) : 100;
        
        // Get price range
        const prices = rows.map(r => parseFloat(r.price)).filter(Boolean);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        
        return { 
            conditions, 
            colors,
            platforms,
            batteryStatuses,
            screenConditions,
            bodyConditions,
            batteryRange: { min: minBattery, max: maxBattery },
            priceRange: { min: minPrice, max: maxPrice }
        };
    }

    // Tìm sản phẩm tương tự theo khoảng giá
    async findSimilarListingsByPrice(productId, priceRange, limit = 20) {
        const query = `
            SELECT 
                l.listing_id as id,
                p.name as name,
                p.brand,
                p.model_series,
                l.price,
                l.currency,
                l.condition_rank as 'condition',
                l.battery_health,
                l.color,
                l.source_url,
                l.platform,
                l.posted_at,
                l.description,
                ABS(l.price - ?) as price_difference
            FROM active_listings l
            JOIN products p ON l.product_id = p.product_id
            WHERE l.price BETWEEN ? AND ?
            AND l.product_id = ?
            ORDER BY price_difference ASC
            LIMIT ?
        `;
        
        const targetPrice = (priceRange.min + priceRange.max) / 2;
        const [rows] = await db.query(query, [
            targetPrice,
            priceRange.min,
            priceRange.max,
            productId,
            limit
        ]);
        
        return rows;
    }

    // Tìm sản phẩm theo product_id
    async findProductById(productId) {
        const query = `
            SELECT 
                product_id,
                name,
                brand,
                model_series,
                category,
                base_specs,
                created_at
            FROM products
            WHERE product_id = ?
        `;
        
        const [rows] = await db.query(query, [productId]);
        return rows[0];
    }

    // Tìm product_id từ tên sản phẩm - Improved version
    async findProductIdByName(keyword) {
        const query = `
            SELECT 
                product_id, 
                name, 
                brand, 
                model_series,
                CASE
                    -- Exact match gets highest priority
                    WHEN LOWER(name) = LOWER(?) THEN 1
                    WHEN LOWER(model_series) = LOWER(?) THEN 1
                    -- Starts with keyword gets second priority
                    WHEN LOWER(name) LIKE LOWER(CONCAT(?, ' %')) THEN 2
                    WHEN LOWER(model_series) LIKE LOWER(CONCAT(?, ' %')) THEN 2
                    -- Contains keyword gets lowest priority
                    WHEN LOWER(name) LIKE LOWER(CONCAT('%', ?, '%')) THEN 3
                    WHEN LOWER(model_series) LIKE LOWER(CONCAT('%', ?, '%')) THEN 3
                    ELSE 4
                END as match_priority,
                -- Calculate length difference (prefer shorter, more specific matches)
                ABS(LENGTH(name) - LENGTH(?)) as length_diff
            FROM products
            WHERE LOWER(name) LIKE LOWER(CONCAT('%', ?, '%')) 
               OR LOWER(model_series) LIKE LOWER(CONCAT('%', ?, '%'))
            ORDER BY match_priority ASC, length_diff ASC
            LIMIT 1
        `;
        
        const [rows] = await db.query(query, [
            keyword, keyword,  // exact match
            keyword, keyword,  // starts with
            keyword, keyword,  // contains
            keyword,           // length diff
            keyword, keyword   // WHERE clause
        ]);
        return rows[0];
    }
}

module.exports = new ListingRepository();
const db = require('../config/db');
const { MARKET_BRANDS, brandKeyToMarketId } = require('../constants/marketBrands');
const {
    resolveProductModelLabel,
    normalizeBrandKey,
    pickBrandDisplayLabel,
} = require('../utils/resolveProductModelLabel');
const {
    parseProductSpecs,
    productMatchesSpec,
} = require('../utils/parseProductSpecs');

function keywordLookupVariants(keyword) {
    const raw = String(keyword || '').trim().replace(/\s+/g, ' ');
    if (!raw) return [];

    const variants = new Set([raw]);
    const proMaxSpaced = raw.replace(/\bpro\s*max\b/gi, 'Pro Max');
    variants.add(proMaxSpaced);
    variants.add(raw.replace(/\bpromax\b/gi, 'Pro Max'));
    variants.add(raw.replace(/\bpro\s+max\b/gi, 'Promax'));

    return [...variants].filter(Boolean);
}

class ListingRepository {
    async findActiveListingsByName(keyword, filters = {}, limit = 500) {
        const variants = keywordLookupVariants(keyword);
        const keywordConditions = variants
            .map(() => '(p.name LIKE ? OR p.model_series LIKE ?)')
            .join(' OR ');
        let query = `
            SELECT 
                l.listing_id as id,
                p.product_id as product_id,
                p.name as name, 
                p.brand,
                p.model_series,
                l.price, 
                l.original_price as originalPrice,
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
            WHERE (${keywordConditions || '0'})
        `;
        
        const params = variants.flatMap((v) => [`%${v}%`, `%${v}%`]);

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

        if (filters.hasCable === true) {
            query += ' AND l.has_cable = 1';
        }

        if (filters.hasEarphones === true) {
            query += ' AND l.has_earphones = 1';
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

        // Show newest listings first; limit controls how many are returned
        query += ' ORDER BY l.posted_at DESC';
        if (limit > 0) {
            query += ' LIMIT ?';
            params.push(limit);
        }

        const [rows] = await db.query(query, params);
        
        // Normalize battery data; optional storage / RAM filter from product base_specs
        let results = rows.map(row => ({
            ...row,
            battery_health: row.battery_health || row.battery_percentage || null
        }));

        if (filters.storage && filters.storage !== 'all') {
            results = results.filter((row) =>
                productMatchesSpec(row.base_specs, { storage: filters.storage })
            );
        }
        if (filters.ram && filters.ram !== 'all') {
            results = results.filter((row) =>
                productMatchesSpec(row.base_specs, { ram: filters.ram })
            );
        }

        return results;
    }

    // Get available filter options for a specific product search
    async getAvailableFilters(keyword) {
        const variants = keywordLookupVariants(keyword);
        const keywordConditions = variants
            .map(() => '(p.name LIKE ? OR p.model_series LIKE ?)')
            .join(' OR ');
        // Limit to same 500 newest records used for listing display
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
            WHERE (${keywordConditions || '0'})
            ORDER BY l.posted_at DESC
            LIMIT 500
        `;
        
        const params = variants.flatMap((v) => [`%${v}%`, `%${v}%`]);
        const [rows] = await db.query(query, params);
        
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
            .filter(val => val != null && !isNaN(val) && Number(val) > 0);
        
        const minBattery = batteryHealths.length > 0 ? Math.min(...batteryHealths) : 80;
        const maxBattery = batteryHealths.length > 0 ? Math.max(...batteryHealths) : 100;
        
        // Get price range
        const prices = rows.map(r => parseFloat(r.price)).filter(Boolean);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

        const [specRows] = await db.query(
            `
            SELECT DISTINCT p.base_specs
            FROM products p
            JOIN active_listings l ON l.product_id = p.product_id
            WHERE (${keywordConditions || '0'})
            `,
            params
        );

        const storageSet = new Set();
        const ramSet = new Set();
        for (const row of specRows) {
            const { storage, ram } = parseProductSpecs(row.base_specs);
            if (storage) storageSet.add(storage);
            if (ram) ramSet.add(ram);
        }

        const sortNumeric = (a, b) => Number(a) - Number(b);
        
        return { 
            conditions, 
            colors,
            platforms,
            batteryStatuses,
            screenConditions,
            bodyConditions,
            batteryRange: { min: minBattery, max: maxBattery },
            priceRange: { min: minPrice, max: maxPrice },
            storages: [...storageSet].sort(sortNumeric),
            rams: [...ramSet].sort(sortNumeric),
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
                l.original_price as originalPrice,
                l.currency,
                l.condition_rank as 'condition',
                l.battery_health,
                l.color,
                l.source_url,
                l.platform,
                l.posted_at,
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

    /** Listings cùng product_id (dùng quét cơ hội giá / tình trạng) */
    async findActiveListingsByProductId(productId, limit = 150) {
        const query = `
            SELECT 
                l.listing_id as id,
                p.name as name, 
                p.brand,
                p.model_series,
                l.price, 
                l.original_price as originalPrice,
                l.currency,
                l.condition_rank as 'condition',
                l.battery_health,
                l.battery_percentage,
                l.color,
                l.source_url,
                l.platform,
                l.posted_at
            FROM active_listings l
            JOIN products p ON l.product_id = p.product_id
            WHERE l.product_id = ?
            ORDER BY l.price ASC
            LIMIT ?
        `;
        const [rows] = await db.query(query, [productId, limit]);
        return rows.map(row => ({
            ...row,
            battery_health: row.battery_health || row.battery_percentage || null
        }));
    }

    /**
     * Hãng + dòng model có nhiều tin nhất.
     * Nhãn từ model_series / base_specs.model_line / tên (bỏ hãng + GB); lọc nhãn chung chung.
     * @param {{ maxBrands?: number, perBrand?: number }} opts
     */
    async getBrandCatalog(opts = {}) {
        const perBrand = Math.min(Math.max(Number(opts.perBrand) || 6, 1), 20);

        const query = `
            SELECT
                TRIM(p.brand) AS brand,
                p.product_id,
                p.name,
                p.model_series,
                p.base_specs,
                COUNT(l.listing_id) AS listing_count
            FROM products p
            INNER JOIN active_listings l ON l.product_id = p.product_id
            WHERE p.brand IS NOT NULL AND TRIM(p.brand) <> ''
            GROUP BY p.brand, p.product_id, p.name, p.model_series, p.base_specs
            HAVING listing_count > 0
        `;

        const [rows] = await db.query(query);
        if (!rows.length) {
            return { brands: [], suggestions: [] };
        }

        const modelAgg = new Map();

        for (const row of rows) {
            const brand = String(row.brand).trim();
            const brandKey = normalizeBrandKey(brand);
            const marketId = brandKeyToMarketId(brandKey);
            const modelLabel = resolveProductModelLabel(row);
            if (!marketId || !modelLabel) continue;

            const key = `${marketId}::${modelLabel.toLowerCase()}`;
            const count = Number(row.listing_count) || 0;

            if (!modelAgg.has(key)) {
                modelAgg.set(key, {
                    brandKey: marketId,
                    brandLabel: brand,
                    name: modelLabel,
                    modelSeries: modelLabel,
                    productId: row.product_id,
                    listingCount: count,
                });
            } else {
                const cur = modelAgg.get(key);
                cur.listingCount += count;
                cur.brandLabel = pickBrandDisplayLabel(cur.brandLabel, brand);
            }
        }

        const byBrand = new Map();
        for (const entry of modelAgg.values()) {
            if (!byBrand.has(entry.brandKey)) {
                byBrand.set(entry.brandKey, {
                    label: entry.brandLabel,
                    models: [],
                });
            } else {
                const bucket = byBrand.get(entry.brandKey);
                bucket.label = pickBrandDisplayLabel(bucket.label, entry.brandLabel);
            }
            byBrand.get(entry.brandKey).models.push(entry);
        }

        for (const bucket of byBrand.values()) {
            bucket.models.sort((a, b) => b.listingCount - a.listingCount);
        }

        const brandTotals = [...byBrand.entries()].map(([brandKey, bucket]) => ({
            brandKey,
            models: bucket.models,
        }));

        const modelsByMarketId = new Map(brandTotals.map(({ brandKey, models }) => [brandKey, models]));

        const brands = MARKET_BRANDS.map(({ id, label }) => {
            const models = (modelsByMarketId.get(id) || []).slice(0, perBrand);
            return {
                id,
                label,
                models: models.map((m) => {
                    const display = m.name;
                    return {
                        name: display,
                        modelSeries: m.modelSeries,
                        searchKeyword: display,
                        productId: m.productId,
                    };
                }),
            };
        });

        const topOverall = [...modelAgg.values()]
            .sort((a, b) => b.listingCount - a.listingCount)
            .slice(0, 3)
            .map((m) => m.name);

        return { brands, suggestions: topOverall };
    }

    /** Biến thể từ khóa: bỏ prefix hãng ("Apple iPhone 13" → "iPhone 13"). */
    _keywordLookupVariants(keyword) {
        const raw = String(keyword || '').trim().replace(/\s+/g, ' ');
        if (!raw) return [];

        const variants = new Set(keywordLookupVariants(raw));
        const lower = raw.toLowerCase();
        const brandPrefixes = [
            'apple',
            'samsung',
            'xiaomi',
            'oppo',
            'vivo',
            'google',
            'huawei',
            'oneplus',
            'realme',
            'nokia',
            'sony',
            'motorola',
            'asus',
            'iphone',
        ];

        for (const b of brandPrefixes) {
            const prefix = `${b} `;
            if (lower.startsWith(prefix)) {
                variants.add(raw.slice(prefix.length).trim());
            }
        }

        return [...variants].filter(Boolean);
    }

    async _queryProductByKeyword(keyword, specFilters = {}) {
        const query = `
            SELECT 
                product_id, 
                name, 
                brand, 
                model_series,
                base_specs,
                CASE
                    WHEN LOWER(name) = LOWER(?) THEN 1
                    WHEN LOWER(model_series) = LOWER(?) THEN 1
                    WHEN LOWER(name) LIKE LOWER(CONCAT(?, ' %')) THEN 2
                    WHEN LOWER(model_series) LIKE LOWER(CONCAT(?, ' %')) THEN 2
                    WHEN LOWER(name) LIKE LOWER(CONCAT('%', ?, '%')) THEN 3
                    WHEN LOWER(model_series) LIKE LOWER(CONCAT('%', ?, '%')) THEN 3
                    ELSE 4
                END as match_priority,
                ABS(LENGTH(name) - LENGTH(?)) as length_diff
            FROM products
            WHERE LOWER(name) LIKE LOWER(CONCAT('%', ?, '%')) 
               OR LOWER(model_series) LIKE LOWER(CONCAT('%', ?, '%'))
            ORDER BY match_priority ASC, length_diff ASC
            LIMIT 25
        `;

        const [rows] = await db.query(query, [
            keyword,
            keyword,
            keyword,
            keyword,
            keyword,
            keyword,
            keyword,
            keyword,
            keyword,
        ]);

        if (!rows.length) return null;

        const wantsStorage = specFilters.storage && specFilters.storage !== 'all';
        const wantsRam = specFilters.ram && specFilters.ram !== 'all';

        if (wantsStorage || wantsRam) {
            const matched = rows.find((row) => productMatchesSpec(row.base_specs, specFilters));
            if (matched) return matched;
            // Spec mismatch — fall back to best keyword match instead of failing
            return rows[0];
        }

        return rows[0];
    }

    _mostCommonProductId(listings) {
        const counts = new Map();
        for (const row of listings) {
            const id = row.product_id;
            if (!id) continue;
            counts.set(id, (counts.get(id) || 0) + 1);
        }
        let bestId = listings[0]?.product_id;
        let bestCount = 0;
        for (const [id, count] of counts.entries()) {
            if (count > bestCount) {
                bestCount = count;
                bestId = id;
            }
        }
        return bestId;
    }

    /** Median battery % from active listings for a product (ignores 0 / missing). */
    medianBatteryFromListings(listings, productId) {
        const batteries = (listings || [])
            .filter((l) => !productId || l.product_id === productId)
            .map((l) => l.battery_health ?? l.battery_percentage)
            .filter((v) => v != null && !Number.isNaN(Number(v)) && Number(v) > 0)
            .map((v) => Number(v))
            .sort((a, b) => a - b);

        if (!batteries.length) return undefined;

        const mid = Math.floor(batteries.length / 2);
        return batteries.length % 2 !== 0
            ? batteries[mid]
            : Math.round((batteries[mid - 1] + batteries[mid]) / 2);
    }

    /**
     * Resolve product for ML/market price: prefer variant seen in active listings.
     */
    async resolveProductForKeyword(keyword, specFilters = {}) {
        const listingFilters = {};
        if (specFilters.storage && specFilters.storage !== 'all') {
            listingFilters.storage = specFilters.storage;
        }
        if (specFilters.ram && specFilters.ram !== 'all') {
            listingFilters.ram = specFilters.ram;
        }

        // Use lightweight query (only product_id needed for resolution)
        const productId = await this._mostCommonProductIdForKeyword(keyword, listingFilters);
        if (productId) {
            const row = await this.findProductById(productId);
            if (row) return row;
        }

        const fromName = await this.findProductIdByName(keyword, specFilters);
        if (fromName) return fromName;

        const fallbackId = await this._mostCommonProductIdForKeyword(keyword, {});
        if (fallbackId) {
            const row = await this.findProductById(fallbackId);
            if (row) return row;
        }

        return null;
    }

    /** Lean query: only fetches product_id to find the most common product for a keyword. */
    async _mostCommonProductIdForKeyword(keyword, filters = {}) {
        const variants = keywordLookupVariants(keyword);
        if (!variants.length) return null;
        const keywordConditions = variants
            .map(() => '(p.name LIKE ? OR p.model_series LIKE ?)')
            .join(' OR ');
        let query = `
            SELECT l.product_id, COUNT(*) AS cnt
            FROM active_listings l
            JOIN products p ON l.product_id = p.product_id
            WHERE (${keywordConditions})
        `;
        const params = variants.flatMap((v) => [`%${v}%`, `%${v}%`]);

        if (filters.storage && filters.storage !== 'all') {
            query += ' AND JSON_UNQUOTE(JSON_EXTRACT(p.base_specs, "$.storage")) = ?';
            params.push(String(filters.storage));
        }
        if (filters.ram && filters.ram !== 'all') {
            query += ' AND JSON_UNQUOTE(JSON_EXTRACT(p.base_specs, "$.ram")) = ?';
            params.push(String(filters.ram));
        }

        query += ' GROUP BY l.product_id ORDER BY cnt DESC LIMIT 1';
        const [rows] = await db.query(query, params);
        return rows[0]?.product_id || null;
    }

    // Tìm product_id từ tên sản phẩm — thử nhiều biến thể từ khóa
    async findProductIdByName(keyword, specFilters = {}) {
        const variants = this._keywordLookupVariants(keyword);
        for (const v of variants) {
            const row = await this._queryProductByKeyword(v, specFilters);
            if (row) return row;
        }
        return null;
    }
}

module.exports = new ListingRepository();

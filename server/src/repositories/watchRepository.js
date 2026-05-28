const db = require('../config/db');

class WatchRepository {
    async createWatch(row) {
        const {
            watch_id,
            user_id,
            product_id,
            product_name_snapshot,
            reference_price,
            reference_condition,
            reference_battery,
            price_improvement_pct,
            only_new_listings,
        } = row;
        await db.query(
            `INSERT INTO product_watches (
                watch_id, user_id, product_id, product_name_snapshot,
                reference_price, reference_condition, reference_battery,
                price_improvement_pct, only_new_listings, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                watch_id,
                user_id,
                product_id,
                product_name_snapshot || null,
                reference_price,
                reference_condition ?? null,
                reference_battery ?? null,
                price_improvement_pct ?? 3,
                only_new_listings ? 1 : 0,
            ]
        );
        return watch_id;
    }

    async findByUserId(userId) {
        const [rows] = await db.query(
            `SELECT * FROM product_watches WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC`,
            [userId]
        );
        return rows;
    }

    async findByIdForUser(watchId, userId) {
        const [rows] = await db.query(
            `SELECT * FROM product_watches WHERE watch_id = ? AND user_id = ? AND is_active = 1`,
            [watchId, userId]
        );
        return rows[0];
    }

    async deactivate(watchId, userId) {
        const [r] = await db.query(
            `UPDATE product_watches SET is_active = 0 WHERE watch_id = ? AND user_id = ?`,
            [watchId, userId]
        );
        return r.affectedRows > 0;
    }

    async getDismissedListingIds(watchId) {
        const [rows] = await db.query(
            `SELECT listing_id FROM watch_dismissed_listings WHERE watch_id = ?`,
            [watchId]
        );
        return new Set(rows.map((r) => r.listing_id));
    }

    async dismissListing(watchId, listingId) {
        await db.query(
            `INSERT IGNORE INTO watch_dismissed_listings (watch_id, listing_id) VALUES (?, ?)`,
            [watchId, listingId]
        );
    }
}

module.exports = new WatchRepository();

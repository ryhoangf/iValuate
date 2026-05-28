const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

class SubscriptionRepository {
    /** Số ngày gói PREMIUM (end_date = start + days). LITE dùng end_date NULL (vĩnh viễn). */
    _premiumPeriodDays() {
        const raw = parseInt(process.env.SUBSCRIPTION_PREMIUM_DAYS || '90', 10);
        if (Number.isNaN(raw) || raw < 1) {
            return 90;
        }
        return raw;
    }

    /**
     * Tạo subscription: LITE → end_date NULL; PREMIUM → end_date = start + SUBSCRIPTION_PREMIUM_DAYS.
     */
    async createSubscriptionForNewUser(userId, planType) {
        const upper = String(planType || 'LITE').toUpperCase() === 'PREMIUM' ? 'PREMIUM' : 'LITE';
        if (upper === 'LITE') {
            await db.query(
                `INSERT INTO subscriptions (subscription_id, user_id, plan_type, start_date, end_date, status)
                 VALUES (?, ?, ?, NOW(), NULL, 'ACTIVE')`,
                [uuidv4(), userId, upper]
            );
        } else {
            const days = this._premiumPeriodDays();
            await db.query(
                `INSERT INTO subscriptions (subscription_id, user_id, plan_type, start_date, end_date, status)
                 VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), 'ACTIVE')`,
                [uuidv4(), userId, upper, days]
            );
        }
    }

    /**
     * Gói hiệu lực: subscription ACTIVE, đã bắt đầu, chưa hết hạn (end_date NULL hoặc > now).
     * @returns {'lite'|'premium'}
     */
    async getSubscriptionTierForUser(userId) {
        const [rows] = await db.query(
            `SELECT plan_type FROM subscriptions
             WHERE user_id = ?
               AND status = 'ACTIVE'
               AND start_date <= NOW()
               AND (end_date IS NULL OR end_date > NOW())
             ORDER BY start_date DESC
             LIMIT 1`,
            [userId]
        );
        if (!rows.length) {
            return 'lite';
        }
        const raw = String(rows[0].plan_type || '').toUpperCase();
        return raw === 'PREMIUM' ? 'premium' : 'lite';
    }

    /** Hủy mọi subscription PREMIUM đang ACTIVE của user; nếu không còn LITE active thì tạo LITE. */
    async cancelPremiumForUser(userId) {
        await db.query(
            `UPDATE subscriptions
             SET status = 'CANCELLED'
             WHERE user_id = ?
               AND UPPER(plan_type) = 'PREMIUM'
               AND status = 'ACTIVE'`,
            [userId]
        );
        const [liteRows] = await db.query(
            `SELECT 1 FROM subscriptions
             WHERE user_id = ?
               AND UPPER(plan_type) = 'LITE'
               AND status = 'ACTIVE'
               AND start_date <= NOW()
               AND (end_date IS NULL OR end_date > NOW())
             LIMIT 1`,
            [userId]
        );
        if (!liteRows.length) {
            await this.createSubscriptionForNewUser(userId, 'LITE');
        }
    }
}

module.exports = new SubscriptionRepository();

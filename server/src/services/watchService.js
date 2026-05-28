const { v4: uuidv4 } = require('uuid');
const watchRepository = require('../repositories/watchRepository');
const listingRepository = require('../repositories/listingRepository');

const RANK = {
    S: 5,
    s: 5,
    A: 4,
    a: 4,
    B: 3,
    b: 3,
    C: 2,
    c: 2,
    D: 1,
    d: 1,
    J: 0,
    j: 0,
};

function conditionRank(cond) {
    if (cond == null || cond === '') return 0;
    return RANK[String(cond).trim()] ?? 0;
}

class WatchService {
    /**
     * @param {string} userId
     * @param {{ product_id: string, product_name?: string, reference_price?: number, reference_condition?: string|null, reference_battery?: number|null, price_improvement_pct?: number, only_new_listings?: boolean }} body
     */
    async createWatch(userId, body) {
        const {
            product_id,
            product_name,
            reference_price: refIn,
            reference_condition,
            reference_battery,
            price_improvement_pct = 3,
            only_new_listings = true,
        } = body;

        if (!product_id) {
            throw new Error('Thiếu product_id');
        }

        const product = await listingRepository.findProductById(product_id);
        if (!product) throw new Error('Không tìm thấy sản phẩm');

        let reference_price = refIn != null ? Number(refIn) : null;
        if (reference_price == null || Number.isNaN(reference_price)) {
            const listings = await listingRepository.findActiveListingsByProductId(product_id, 50);
            if (listings.length === 0) {
                throw new Error('Chưa có tin đăng để lấy mốc giá — thêm reference_price hoặc thử sau');
            }
            reference_price = Math.min(...listings.map((l) => Number(l.price)));
        }

        const watch_id = uuidv4();
        await watchRepository.createWatch({
            watch_id,
            user_id: userId,
            product_id,
            product_name_snapshot: product_name || product.name,
            reference_price,
            reference_condition: reference_condition ?? null,
            reference_battery:
                reference_battery != null && !Number.isNaN(Number(reference_battery))
                    ? parseInt(reference_battery, 10)
                    : null,
            price_improvement_pct,
            only_new_listings,
        });

        return this.getWatchById(userId, watch_id);
    }

    async getWatchById(userId, watchId) {
        const w = await watchRepository.findByIdForUser(watchId, userId);
        if (!w) return null;
        return this._attachOpportunities(w);
    }

    async listWatches(userId, includeOpportunities = true) {
        const rows = await watchRepository.findByUserId(userId);
        if (!includeOpportunities) {
            return rows.map((w) => this._mapWatchRow(w));
        }
        return Promise.all(rows.map((w) => this._attachOpportunities(w)));
    }

    _mapWatchRow(w) {
        return {
            watch_id: w.watch_id,
            product_id: w.product_id,
            product_name_snapshot: w.product_name_snapshot,
            reference_price: Number(w.reference_price),
            reference_condition: w.reference_condition,
            reference_battery: w.reference_battery,
            price_improvement_pct: Number(w.price_improvement_pct),
            only_new_listings: w.only_new_listings === 1,
            created_at: w.created_at,
        };
    }

    async _attachOpportunities(w) {
        const base = this._mapWatchRow(w);
        const opportunities = await this._scanOpportunities(w);
        return { ...base, opportunities, opportunity_count: opportunities.length };
    }

    async _scanOpportunities(w) {
        const listings = await listingRepository.findActiveListingsByProductId(w.product_id, 200);
        const dismissed = await watchRepository.getDismissedListingIds(w.watch_id);
        const refRank = conditionRank(w.reference_condition);
        const refBattery =
            w.reference_battery != null ? parseInt(w.reference_battery, 10) : null;
        const refPrice = Number(w.reference_price);
        const pct = Number(w.price_improvement_pct) || 3;
        const priceThreshold = refPrice * (1 - pct / 100);
        const watchCreated = w.created_at ? new Date(w.created_at).getTime() : 0;

        const out = [];

        for (const L of listings) {
            if (dismissed.has(L.id)) continue;

            if (w.only_new_listings === 1 && L.posted_at) {
                const t = new Date(L.posted_at).getTime();
                if (!Number.isNaN(t) && t + 1000 < watchCreated) continue;
            }

            const reasons = [];
            const price = Number(L.price);
            if (price > 0 && price <= priceThreshold) {
                reasons.push('better_price');
            }

            const lr = conditionRank(L.condition);
            if (refRank > 0 && lr > refRank) {
                reasons.push('better_condition');
            }

            const bat = L.battery_health != null ? Number(L.battery_health) : null;
            if (refBattery != null && bat != null && bat >= refBattery + 5) {
                reasons.push('better_battery');
            }

            if (reasons.length === 0) continue;

            out.push({
                listing_id: L.id,
                name: L.name,
                price,
                condition: L.condition,
                battery_health: L.battery_health,
                platform: L.platform,
                source_url: L.source_url,
                posted_at: L.posted_at,
                reasons,
                price_vs_reference: price - refPrice,
            });
        }

        out.sort((a, b) => a.price - b.price);
        return out.slice(0, 25);
    }

    async removeWatch(userId, watchId) {
        const ok = await watchRepository.deactivate(watchId, userId);
        if (!ok) throw new Error('Không tìm thấy watch hoặc không thuộc tài khoản');
        return { ok: true };
    }

    async dismissOpportunity(userId, watchId, listingId) {
        const w = await watchRepository.findByIdForUser(watchId, userId);
        if (!w) throw new Error('Không tìm thấy watch');
        await watchRepository.dismissListing(watchId, listingId);
        return { ok: true };
    }
}

module.exports = new WatchService();

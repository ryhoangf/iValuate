const watchService = require('../services/watchService');

class WatchController {
    async list(req, res) {
        try {
            const includeOpportunities = req.query.include !== '0' && req.query.include !== 'false';
            const data = await watchService.listWatches(req.userId, includeOpportunities);
            res.json(data);
        } catch (e) {
            console.error('list watches:', e);
            this._handleDbError(res, e);
        }
    }

    async create(req, res) {
        try {
            const w = await watchService.createWatch(req.userId, req.body);
            res.status(201).json(w);
        } catch (e) {
            console.error('create watch:', e);
            const msg = e.message || '';
            if (msg.includes('Thiếu') || msg.includes('Không tìm thấy') || msg.includes('Chưa có')) {
                return res.status(400).json({ message: msg });
            }
            this._handleDbError(res, e);
        }
    }

    async remove(req, res) {
        try {
            await watchService.removeWatch(req.userId, req.params.id);
            res.json({ ok: true });
        } catch (e) {
            const msg = e.message || '';
            if (msg.includes('Không tìm thấy')) {
                return res.status(404).json({ message: msg });
            }
            console.error('remove watch:', e);
            this._handleDbError(res, e);
        }
    }

    async dismiss(req, res) {
        try {
            const listingId = req.body.listing_id;
            if (!listingId) {
                return res.status(400).json({ message: 'Thiếu listing_id' });
            }
            await watchService.dismissOpportunity(req.userId, req.params.id, listingId);
            res.json({ ok: true });
        } catch (e) {
            const msg = e.message || '';
            if (msg.includes('Không tìm thấy')) {
                return res.status(404).json({ message: msg });
            }
            console.error('dismiss watch listing:', e);
            this._handleDbError(res, e);
        }
    }

    _handleDbError(res, e) {
        const code = e.code;
        if (code === 'ER_NO_SUCH_TABLE' || code === 'ECONNREFUSED') {
            return res.status(503).json({
                message:
                    'Chưa chạy migration: mở server/sql/product_watches.sql trên MySQL (ivaluate).',
            });
        }
        res.status(500).json({ message: e.message || 'Lỗi server' });
    }
}

module.exports = new WatchController();

const db = require('../config/db');

class PriceForecastRepository {
    /**
     * Lấy dự đoán giá mới nhất cho sản phẩm
     */
    async getLatestForecast(productId) {
        const query = `
            SELECT 
                forecast_id,
                product_id,
                forecast_date,
                predicted_price,
                confidence_score,
                model_version,
                created_at
            FROM price_forecasts
            WHERE product_id = ?
            ORDER BY forecast_date DESC, created_at DESC
            LIMIT 1
        `;
        
        const [rows] = await db.query(query, [productId]);
        return rows[0];
    }

    /**
     * Lấy lịch sử dự đoán giá (để vẽ chart trend - optional, có thể overlay với price_history)
     */
    async getForecastHistory(productId, limit = 30) {
        const query = `
            SELECT 
                DATE(created_at) as date,
                predicted_price as price,
                confidence_score as confidence
            FROM price_forecasts
            WHERE product_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `;
        
        const [rows] = await db.query(query, [productId, limit]);
        return rows.reverse(); // Oldest to newest for chart
    }

    /**
     * Lấy tất cả forecasts trong khoảng thời gian
     */
    async getForecastsByDateRange(productId, startDate, endDate) {
        const query = `
            SELECT 
                forecast_id,
                product_id,
                forecast_date,
                predicted_price,
                confidence_score,
                model_version,
                created_at
            FROM price_forecasts
            WHERE product_id = ?
            AND forecast_date BETWEEN ? AND ?
            ORDER BY forecast_date ASC
        `;
        
        const [rows] = await db.query(query, [productId, startDate, endDate]);
        return rows;
    }

    /**
     * Tính khoảng giá dự đoán dựa trên forecasts gần đây (optional - ít dùng)
     */
    async calculateForecastRange(productId, days = 30) {
        const query = `
            SELECT 
                AVG(predicted_price) as avgPrice,
                MIN(predicted_price) as minPrice,
                MAX(predicted_price) as maxPrice,
                STDDEV(predicted_price) as priceStdDev,
                AVG(confidence_score) as avgConfidence,
                COUNT(*) as forecastCount
            FROM price_forecasts
            WHERE product_id = ?
            AND forecast_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        `;
        
        const [rows] = await db.query(query, [productId, days]);
        return rows[0];
    }

    /**
     * Lưu dự đoán giá mới (được gọi từ ML model)
     */
    async saveForecast(forecastData) {
        const { forecast_id, product_id, forecast_date, predicted_price, confidence_score, model_version } = forecastData;
        
        const query = `
            INSERT INTO price_forecasts 
            (forecast_id, product_id, forecast_date, predicted_price, confidence_score, model_version)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            predicted_price = VALUES(predicted_price),
            confidence_score = VALUES(confidence_score),
            model_version = VALUES(model_version)
        `;
        
        await db.query(query, [forecast_id, product_id, forecast_date, predicted_price, confidence_score, model_version]);
    }

    /**
     * Lưu nhiều forecasts cùng lúc (batch insert)
     */
    async batchSaveForecasts(forecastsArray) {
        if (!forecastsArray || forecastsArray.length === 0) return;

        const query = `
            INSERT INTO price_forecasts 
            (forecast_id, product_id, forecast_date, predicted_price, confidence_score, model_version)
            VALUES ?
            ON DUPLICATE KEY UPDATE
            predicted_price = VALUES(predicted_price),
            confidence_score = VALUES(confidence_score),
            model_version = VALUES(model_version)
        `;

        const values = forecastsArray.map(f => [
            f.forecast_id,
            f.product_id,
            f.forecast_date,
            f.predicted_price,
            f.confidence_score,
            f.model_version
        ]);

        await db.query(query, [values]);
    }

    /**
     * Xóa forecasts cũ (cleanup)
     */
    async deleteOldForecasts(daysToKeep = 90) {
        const query = `
            DELETE FROM price_forecasts
            WHERE forecast_date < DATE_SUB(CURDATE(), INTERVAL ? DAY)
        `;
        
        const [result] = await db.query(query, [daysToKeep]);
        return result.affectedRows;
    }

    /**
     * Kiểm tra xem product đã có forecast chưa
     */
    async hasForecast(productId) {
        const query = `
            SELECT COUNT(*) as count
            FROM price_forecasts
            WHERE product_id = ?
        `;
        
        const [rows] = await db.query(query, [productId]);
        return rows[0].count > 0;
    }

    /**
     * Lấy forecast theo model version cụ thể
     */
    async getForecastsByModelVersion(modelVersion, limit = 100) {
        const query = `
            SELECT 
                forecast_id,
                product_id,
                forecast_date,
                predicted_price,
                confidence_score,
                model_version,
                created_at
            FROM price_forecasts
            WHERE model_version = ?
            ORDER BY created_at DESC
            LIMIT ?
        `;
        
        const [rows] = await db.query(query, [modelVersion, limit]);
        return rows;
    }

    /**
     * So sánh forecast vs actual price (để evaluate model accuracy)
     */
    async compareForecastWithActual(productId, forecastDate) {
        const query = `
            SELECT 
                pf.forecast_date,
                pf.predicted_price,
                pf.confidence_score,
                ph.avg_price as actual_price,
                ABS(pf.predicted_price - ph.avg_price) as difference,
                (ABS(pf.predicted_price - ph.avg_price) / ph.avg_price * 100) as error_percent
            FROM price_forecasts pf
            LEFT JOIN price_history ph ON pf.product_id = ph.product_id 
                AND pf.forecast_date = ph.record_date
            WHERE pf.product_id = ?
            AND pf.forecast_date = ?
        `;
        
        const [rows] = await db.query(query, [productId, forecastDate]);
        return rows[0];
    }
}

module.exports = new PriceForecastRepository();
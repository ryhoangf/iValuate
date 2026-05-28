const db = require('../config/db');

class UserRepository {
    // Tìm user bằng email (Dùng cho đăng nhập)
    async findUserByEmail(email) {
        const query = `SELECT * FROM users WHERE email = ?`;
        const [rows] = await db.query(query, [email]);
        return rows[0]; // Trả về user đầu tiên tìm thấy hoặc undefined
    }

    async findById(userId) {
        const query = `SELECT * FROM users WHERE user_id = ?`;
        const [rows] = await db.query(query, [userId]);
        return rows[0];
    }

    // Tạo user mới (Dùng cho đăng ký)
    async createUser(userData) {
        const { user_id, email, password_hash, full_name, role } = userData;
        const query = `
            INSERT INTO users (user_id, email, password_hash, full_name, role, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        await db.query(query, [user_id, email, password_hash, full_name, role]);
        return userData;
    }

    /**
     * @param {string} userId
     * @param {{ full_name?: string, email?: string, password_hash?: string }} fields
     */
    async updateUserFields(userId, fields) {
        const sets = [];
        const vals = [];
        if (fields.full_name !== undefined) {
            sets.push('full_name = ?');
            vals.push(fields.full_name);
        }
        if (fields.email !== undefined) {
            sets.push('email = ?');
            vals.push(fields.email);
        }
        if (fields.password_hash !== undefined) {
            sets.push('password_hash = ?');
            vals.push(fields.password_hash);
        }
        if (sets.length === 0) return false;
        vals.push(userId);
        const query = `UPDATE users SET ${sets.join(', ')} WHERE user_id = ?`;
        const [result] = await db.query(query, vals);
        return result.affectedRows > 0;
    }
}

module.exports = new UserRepository();
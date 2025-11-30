const db = require('../config/db');

class UserRepository {
    // Tìm user bằng email (Dùng cho đăng nhập)
    async findUserByEmail(email) {
        const query = `SELECT * FROM users WHERE email = ?`;
        const [rows] = await db.query(query, [email]);
        return rows[0]; // Trả về user đầu tiên tìm thấy hoặc undefined
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
}

module.exports = new UserRepository();
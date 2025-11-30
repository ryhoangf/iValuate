const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid'); // Thư viện tạo ID

class AuthService {
    
    // Xử lý Đăng Ký
    async register(email, password, fullName) {
        // 1. Kiểm tra email đã tồn tại chưa
        const existingUser = await userRepository.findUserByEmail(email);
        if (existingUser) {
            throw new Error('Email này đã được sử dụng!');
        }

        // 2. Mã hóa mật khẩu (Hashing)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Tạo User Object
        const newUser = {
            user_id: uuidv4(), // Tạo UUID v4
            email,
            password_hash: passwordHash,
            full_name: fullName,
            role: 'USER' // Mặc định là USER, muốn ADMIN thì sửa trong DB sau
        };

        // 4. Lưu xuống DB
        return await userRepository.createUser(newUser);
    }

    // Xử lý Đăng Nhập
    async login(email, password) {
        // 1. Tìm user
        const user = await userRepository.findUserByEmail(email);
        if (!user) {
            throw new Error('Email hoặc mật khẩu không đúng');
        }

        // 2. So sánh mật khẩu (Hash vs Raw)
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new Error('Email hoặc mật khẩu không đúng');
        }

        // 3. Tạo Token (Thẻ bài)
        const token = jwt.sign(
            { id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Hết hạn sau 1 ngày
        );

        return {
            token,
            user: {
                id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        };
    }
}

module.exports = new AuthService();
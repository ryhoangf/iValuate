const userRepository = require('../repositories/userRepository');
const mailService = require('./mailService');
const subscriptionRepository = require('../repositories/subscriptionRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid'); // Thư viện tạo ID
const { getJwtSecret } = require('../config/jwt');

class AuthService {
    
    // Xử lý Đăng Ký
    async register(email, password, fullName, planTier = 'lite') {
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
        await userRepository.createUser(newUser);
        try {
            const dbPlan = String(planTier).toLowerCase() === 'premium' ? 'PREMIUM' : 'LITE';
            await subscriptionRepository.createSubscriptionForNewUser(newUser.user_id, dbPlan);
        } catch (e) {
            console.error('Không tạo subscription khi đăng ký:', e.message);
        }
        return newUser;
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

        const subscriptionTier = await subscriptionRepository.getSubscriptionTierForUser(user.user_id);

        // 3. Tạo Token (Thẻ bài)
        const token = jwt.sign(
            { id: user.user_id, role: user.role, subscriptionTier },
            getJwtSecret(),
            { expiresIn: '1d' } // Hết hạn sau 1 ngày
        );

        return {
            token,
            user: {
                id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                subscriptionTier,
            },
        };
    }

    /** User Lite đã đăng nhập: thêm subscription PREMIUM (dùng thử), cấp JWT mới. */
    async upgradePremiumTrial(userId) {
        const current = await subscriptionRepository.getSubscriptionTierForUser(userId);
        if (current === 'premium') {
            throw new Error('Tài khoản đã là Premium.');
        }
        await subscriptionRepository.createSubscriptionForNewUser(userId, 'PREMIUM');
        const subscriptionTier = await subscriptionRepository.getSubscriptionTierForUser(userId);
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }
        const token = jwt.sign(
            { id: user.user_id, role: user.role, subscriptionTier },
            getJwtSecret(),
            { expiresIn: '1d' }
        );
        return {
            token,
            user: {
                id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                subscriptionTier,
            },
        };
    }

    /** Đang Premium → hủy về Lite, cấp JWT mới (giống upgrade nhưng ngược). */
    async downgradePremiumToLite(userId) {
        const current = await subscriptionRepository.getSubscriptionTierForUser(userId);
        if (current !== 'premium') {
            throw new Error('Tài khoản không phải Premium.');
        }
        await subscriptionRepository.cancelPremiumForUser(userId);
        const subscriptionTier = await subscriptionRepository.getSubscriptionTierForUser(userId);
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }
        const token = jwt.sign(
            { id: user.user_id, role: user.role, subscriptionTier },
            getJwtSecret(),
            { expiresIn: '1d' }
        );
        return {
            token,
            user: {
                id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                subscriptionTier,
            },
        };
    }

    async getProfile(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }
        const subscriptionTier = await subscriptionRepository.getSubscriptionTierForUser(userId);
        return {
            id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            subscriptionTier,
        };
    }

    /**
     * @param {string} userId
     * @param {{ full_name?: string, email?: string, current_password?: string, new_password?: string }} body
     */
    async updateProfile(userId, body) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }

        const updates = {};
        const { full_name: fullNameIn, email: emailIn, current_password, new_password } = body;

        if (fullNameIn !== undefined) {
            const fn = String(fullNameIn).trim();
            if (!fn) {
                throw new Error('Tên hiển thị không được để trống');
            }
            updates.full_name = fn.slice(0, 255);
        }

        if (emailIn !== undefined) {
            const em = String(emailIn).trim().toLowerCase();
            if (!em || !em.includes('@')) {
                throw new Error('Email không hợp lệ');
            }
            const other = await userRepository.findUserByEmail(em);
            if (other && String(other.user_id) !== String(userId)) {
                throw new Error('Email này đã được sử dụng');
            }
            updates.email = em.slice(0, 255);
        }

        if (new_password !== undefined && String(new_password).length > 0) {
            if (!current_password) {
                throw new Error('Vui lòng nhập mật khẩu hiện tại');
            }
            const ok = await bcrypt.compare(current_password, user.password_hash);
            if (!ok) {
                throw new Error('Mật khẩu hiện tại không đúng');
            }
            const np = String(new_password);
            if (np.length < 6) {
                throw new Error('Mật khẩu mới tối thiểu 6 ký tự');
            }
            const salt = await bcrypt.genSalt(10);
            updates.password_hash = await bcrypt.hash(np, salt);
        }

        if (Object.keys(updates).length > 0) {
            await userRepository.updateUserFields(userId, updates);
        }

        return this.getProfile(userId);
    }

    /** Đặt lại mật khẩu: JWT ký (stateless), không lưu token trong DB. `pv` bám theo hash mật khẩu hiện tại → link hết hiệu lực sau khi đổi mật khẩu. */
    async requestPasswordReset(email) {
        const generic =
            'Nếu email đã đăng ký trong hệ thống, kiểm tra hướng dẫn đặt lại mật khẩu (hộp thư hoặc liên hệ quản trị).';
        const em = String(email || '')
            .trim()
            .toLowerCase();
        if (!em || !em.includes('@')) {
            return { message: generic };
        }
        const user = await userRepository.findUserByEmail(em);
        if (!user) {
            return { message: generic };
        }
        const pv = crypto.createHash('sha256').update(user.password_hash).digest('hex').slice(0, 16);
        const token = jwt.sign(
            { sub: user.user_id, purpose: 'password_reset', pv },
            getJwtSecret(),
            { expiresIn: '1h' }
        );

        const base = (process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(
            /\/$/,
            ''
        );
        const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;
        console.info('[password-reset]', em, resetUrl);

        try {
            const mail = await mailService.sendPasswordResetEmail(em, resetUrl);
            if (mail.sent) {
                console.info('[password-reset] Đã gửi email tới', em);
            }
        } catch (err) {
            console.error('[password-reset] Gửi email thất bại:', err?.message || err);
        }

        const out = { message: generic };
        if (process.env.PASSWORD_RESET_DEV_LINK === 'true' || process.env.PASSWORD_RESET_DEV_LINK === '1') {
            out.resetUrl = resetUrl;
        }
        return out;
    }

    async resetPasswordWithToken(token, newPassword) {
        if (!token || !String(token).trim()) {
            throw new Error('Thiếu mã đặt lại mật khẩu');
        }
        const np = String(newPassword);
        if (np.length < 6) {
            throw new Error('Mật khẩu mới tối thiểu 6 ký tự');
        }
        let payload;
        try {
            payload = jwt.verify(String(token).trim(), getJwtSecret());
        } catch {
            throw new Error('Liên kết không hợp lệ hoặc đã hết hạn');
        }
        if (payload.purpose !== 'password_reset' || !payload.sub || !payload.pv) {
            throw new Error('Liên kết không hợp lệ hoặc đã hết hạn');
        }
        const user = await userRepository.findById(payload.sub);
        if (!user) {
            throw new Error('Liên kết không hợp lệ hoặc đã hết hạn');
        }
        const pvNow = crypto.createHash('sha256').update(user.password_hash).digest('hex').slice(0, 16);
        if (pvNow !== payload.pv) {
            throw new Error('Liên kết không còn hiệu lực (mật khẩu đã được đổi)');
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(np, salt);
        await userRepository.updateUserFields(user.user_id, { password_hash: passwordHash });
        return { message: 'Đã đặt lại mật khẩu. Bạn có thể đăng nhập.' };
    }
}

module.exports = new AuthService();
const authService = require('../services/authService');

class AuthController {
    
    // API: POST /api/auth/register
    async handleRegister(req, res) {
        try {
            const { email, password, full_name, plan_tier } = req.body;
            if (!email || !password || !full_name) {
                return res.status(400).json({ message: "Vui lòng nhập đủ thông tin!" });
            }

            const wantsPremium = plan_tier === 'premium' || plan_tier === 'PREMIUM';
            const user = await authService.register(
                email,
                password,
                full_name,
                wantsPremium ? 'premium' : 'lite'
            );
            res.status(201).json({
                message: wantsPremium
                    ? 'Đăng ký Premium thành công! Đăng nhập để dùng đầy đủ tính năng.'
                    : 'Đăng ký thành công! Đăng nhập để bắt đầu với gói Lite.',
                userId: user.user_id,
                plan_tier: wantsPremium ? 'premium' : 'lite',
            });

        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // API: POST /api/auth/login
    async handleLogin(req, res) {
        try {
            const { email, password } = req.body;
            
            const result = await authService.login(email, password);
            res.json({
                message: "Đăng nhập thành công!",
                ...result
            });

        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    }
    async handleUpgradePremiumTrial(req, res) {
        try {
            const result = await authService.upgradePremiumTrial(req.userId);
            res.json({
                message: 'Đã kích hoạt Premium (dùng thử). Đang cập nhật phiên đăng nhập…',
                token: result.token,
                user: result.user,
            });
        } catch (error) {
            const msg = error.message || '';
            if (msg.includes('đã là Premium')) {
                return res.status(400).json({ message: msg });
            }
            res.status(500).json({ message: msg || 'Lỗi server' });
        }
    }

    async handleGetMe(req, res) {
        try {
            const user = await authService.getProfile(req.userId);
            res.json({ user });
        } catch (error) {
            res.status(404).json({ message: error.message || 'Không tìm thấy' });
        }
    }

    async handlePatchMe(req, res) {
        try {
            const { full_name, email, current_password, new_password } = req.body || {};
            const user = await authService.updateProfile(req.userId, {
                full_name,
                email,
                current_password,
                new_password,
            });
            res.json({
                message: 'Đã cập nhật hồ sơ.',
                user,
            });
        } catch (error) {
            const msg = error.message || '';
            if (
                msg.includes('trống') ||
                msg.includes('không hợp lệ') ||
                msg.includes('đã được sử dụng') ||
                msg.includes('hiện tại') ||
                msg.includes('tối thiểu')
            ) {
                return res.status(400).json({ message: msg });
            }
            res.status(500).json({ message: msg || 'Lỗi server' });
        }
    }

    async handleDowngradePremiumToLite(req, res) {
        try {
            const result = await authService.downgradePremiumToLite(req.userId);
            res.json({
                message: 'Đã chuyển về gói Lite.',
                token: result.token,
                user: result.user,
            });
        } catch (error) {
            const msg = error.message || '';
            if (msg.includes('không phải Premium')) {
                return res.status(400).json({ message: msg });
            }
            res.status(500).json({ message: msg || 'Lỗi server' });
        }
    }

    async handleForgotPassword(req, res) {
        try {
            const email = req.body?.email;
            const result = await authService.requestPasswordReset(email);
            res.json(result);
        } catch (error) {
            res.status(500).json({ message: error.message || 'Lỗi server' });
        }
    }

    async handleResetPassword(req, res) {
        try {
            const { token, new_password: newPassword } = req.body || {};
            const result = await authService.resetPasswordWithToken(token, newPassword);
            res.json(result);
        } catch (error) {
            const msg = error.message || '';
            if (
                msg.includes('Thiếu') ||
                msg.includes('tối thiểu') ||
                msg.includes('không hợp lệ')
            ) {
                return res.status(400).json({ message: msg });
            }
            res.status(500).json({ message: msg || 'Lỗi server' });
        }
    }
}

module.exports = new AuthController();
const authService = require('../services/authService');

class AuthController {
    
    // API: POST /api/auth/register
    async handleRegister(req, res) {
        try {
            const { email, password, full_name } = req.body;
            if (!email || !password || !full_name) {
                return res.status(400).json({ message: "Vui lòng nhập đủ thông tin!" });
            }

            const user = await authService.register(email, password, full_name);
            res.status(201).json({ message: "Đăng ký thành công!", userId: user.user_id });

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
}

module.exports = new AuthController();
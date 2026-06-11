const authService = require('../services/authService');

class AuthController {
    
    // API: POST /api/auth/register
    async handleRegister(req, res) {
        try {
            const { email, password, full_name, plan_tier } = req.body;
            if (!email || !password || !full_name) {
                return res.status(400).json({ message: "Please fill in all required fields" });
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
                    ? 'Premium registration successful! Sign in to access all features.'
                    : 'Registration successful! Sign in to start with the Lite plan.',
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
                message: "Signed in successfully",
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
                message: 'Premium trial activated. Refreshing your session…',
                token: result.token,
                user: result.user,
            });
        } catch (error) {
            const msg = error.message || '';
            if (msg.includes('already Premium')) {
                return res.status(400).json({ message: msg });
            }
            res.status(500).json({ message: msg || 'Server error' });
        }
    }

    async handleGetMe(req, res) {
        try {
            const user = await authService.getProfile(req.userId);
            res.json({ user });
        } catch (error) {
            res.status(404).json({ message: error.message || 'Not found' });
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
                message: 'Profile updated.',
                user,
            });
        } catch (error) {
            const msg = error.message || '';
            if (
                msg.includes('empty') ||
                msg.includes('Invalid email') ||
                msg.includes('already in use') ||
                msg.includes('current password') ||
                msg.includes('at least 6')
            ) {
                return res.status(400).json({ message: msg });
            }
            res.status(500).json({ message: msg || 'Server error' });
        }
    }

    async handleDowngradePremiumToLite(req, res) {
        try {
            const result = await authService.downgradePremiumToLite(req.userId);
            res.json({
                message: 'Switched to Lite plan.',
                token: result.token,
                user: result.user,
            });
        } catch (error) {
            const msg = error.message || '';
            if (msg.includes('not Premium')) {
                return res.status(400).json({ message: msg });
            }
            res.status(500).json({ message: msg || 'Server error' });
        }
    }

    async handleForgotPassword(req, res) {
        try {
            const email = req.body?.email;
            const result = await authService.requestPasswordReset(email);
            res.json(result);
        } catch (error) {
            res.status(500).json({ message: error.message || 'Server error' });
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
                msg.includes('Missing') ||
                msg.includes('at least 6') ||
                msg.includes('Invalid') ||
                msg.includes('expired') ||
                msg.includes('no longer valid')
            ) {
                return res.status(400).json({ message: msg });
            }
            res.status(500).json({ message: msg || 'Server error' });
        }
    }
}

module.exports = new AuthController();

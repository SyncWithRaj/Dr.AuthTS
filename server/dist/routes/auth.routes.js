"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
router.post('/send-otp', auth_controller_1.sendOtp);
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.post('/forgot-password', auth_controller_1.forgotPassword);
router.post('/reset-password/:token', auth_controller_1.resetPassword);
router.post('/refresh-token', auth_controller_1.refreshToken);
router.post('/logout', auth_controller_1.logout);
router.get('/verify-reset-token/:token', auth_controller_1.verifyResetToken);
const socialAuthCallback = (req, res) => {
    if (!req.user) {
        return res.redirect('http://localhost:5173/login?error=auth_failed');
    }
    // @ts-ignore
    (0, auth_controller_1.sendTokenResponse)(req.user, 200, res);
};
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: '/login' }), socialAuthCallback);
router.get('/github', passport_1.default.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport_1.default.authenticate('github', { session: false, failureRedirect: '/login' }), socialAuthCallback);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map
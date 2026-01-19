import express, { Request, Response } from 'express';
import passport from 'passport';
import { register, login, sendOtp, forgotPassword, resetPassword, refreshToken, logout, verifyResetToken, sendTokenResponse } from '../controllers/auth.controller';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/verify-reset-token/:token', verifyResetToken);

// --- SOCIAL DATA HANDLER ---
// After Passport verifies user, we need to generate JWT cookies and redirect
const socialAuthCallback = (req: Request, res: Response) => {
    // req.user is set by Passport
    if (!req.user) {
        return res.redirect('http://localhost:5173/login?error=auth_failed');
    }
    // Reuse our cookie setter helper
    // @ts-ignore - Passport User matches our User but strict types might complain if not synced perfectly.
    // However, verify logic returns PrismaUser so it should be fine if types.d.ts works.
    sendTokenResponse(req.user, 200, res);
};

// Google Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), socialAuthCallback);

// GitHub Routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: '/login' }), socialAuthCallback);

export default router;

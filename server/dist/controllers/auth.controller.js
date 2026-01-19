"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTokenResponse = exports.verifyResetToken = exports.logout = exports.refreshToken = exports.resetPassword = exports.forgotPassword = exports.sendOtp = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const prisma = new client_1.PrismaClient();
const otpStore = new Map();
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
const sendTokenResponse = (user, statusCode, res) => {
    const jwtOptions = {
        expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || '15m')
    };
    const refreshJwtOptions = {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || '7d')
    };
    const accessToken = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, jwtOptions);
    const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, refreshJwtOptions);
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    };
    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000
    });
    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    if (res.req && (res.req.path.includes('google') || res.req.path.includes('github'))) {
        return res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
    }
    res.status(statusCode).json({
        message: "Success",
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
        }
    });
};
exports.sendTokenResponse = sendTokenResponse;
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: "Email already registered" });
            return;
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(email, {
            otp,
            expires: Date.now() + 10 * 60 * 1000
        });
        await transporter.sendMail({
            from: `"Dr.Auth Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Verification Code | Dr.Auth',
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Dr.Auth OTP</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
                    .wrapper { padding: 40px 20px; }
                    .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
                    .header { background: #000000; padding: 30px; text-align: center; }
                    .brand { color: #ffffff; font-size: 22px; font-weight: 800; text-decoration: none; letter-spacing: 1px; }
                    .content { padding: 40px 30px; text-align: center; color: #333; }
                    .h2 { font-size: 20px; font-weight: 700; margin-bottom: 10px; color: #111; }
                    .p { font-size: 15px; color: #666; line-height: 1.5; margin-bottom: 25px; }
                    .otp-block { background: #f9fafb; padding: 20px; border-radius: 10px; border: 1px dashed #e5e7eb; display: inline-block; margin-bottom: 25px; }
                    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; color: #4F46E5; letter-spacing: 6px; margin: 0; }
                    .footer { background: #fafafa; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #efefef; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <span class="brand">Dr.Auth</span>
                        </div>
                        <div class="content">
                            <div class="h2">Verify Your Identity</div>
                            <div class="p">Please use the verification code below to complete your secure sign-in. This code will expire in 10 minutes.</div>
                            
                            <div class="otp-block">
                                <div class="otp-code">${otp}</div>
                            </div>
                            
                            <div class="p" style="font-size: 13px; margin: 0;">If you didn't request this code, please ignore this email.</div>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} Dr.Auth. Secure Access Systems.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            `
        });
        res.json({ message: "OTP sent to your email" });
    }
    catch (error) {
        console.error("OTP Error:", error);
        res.status(500).json({ message: "Failed to send OTP" });
    }
};
exports.sendOtp = sendOtp;
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, role, otp } = req.body;
        const storedData = otpStore.get(email);
        if (!storedData) {
            res.status(400).json({ message: "OTP expired or not requested" });
            return;
        }
        if (storedData.otp !== otp) {
            res.status(400).json({ message: "Invalid OTP" });
            return;
        }
        if (Date.now() > storedData.expires) {
            otpStore.delete(email);
            res.status(400).json({ message: "OTP expired" });
            return;
        }
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: "Email already exists" });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = await prisma.user.create({
            data: { firstName, lastName, email, password: hashedPassword, phone, role: role || 'USER' }
        });
        otpStore.delete(email);
        sendTokenResponse(newUser, 201, res);
    }
    catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        if (!user.password && (user.googleId || user.githubId)) {
            res.status(400).json({ message: "Please login with Google/GitHub" });
            return;
        }
        if (!user.password) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        sendTokenResponse(user, 200, res);
    }
    catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.login = login;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetPasswordToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
        const resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
        await prisma.user.update({
            where: { email },
            data: { resetPasswordToken, resetPasswordExpires }
        });
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
        await transporter.sendMail({
            from: `"Dr.Auth Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Your Password | Dr.Auth',
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Password</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
                    .wrapper { padding: 40px 20px; }
                    .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
                    .header { background: #000000; padding: 30px; text-align: center; }
                    .brand { color: #ffffff; font-size: 22px; font-weight: 800; text-decoration: none; letter-spacing: 1px; }
                    .content { padding: 40px 30px; text-align: center; color: #333; }
                    .h2 { font-size: 20px; font-weight: 700; margin-bottom: 10px; color: #111; }
                    .p { font-size: 15px; color: #666; line-height: 1.5; margin-bottom: 30px; }
                    .btn { display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); }
                    .footer { background: #fafafa; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #efefef; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <span class="brand">Dr.Auth</span>
                        </div>
                        <div class="content">
                            <div class="h2">Reset Your Password</div>
                            <div class="p">You have requested to reset your password. Click the button below to verify your identity and create a new password.</div>
                            
                            <a href="${resetUrl}" class="btn">Reset Password</a>
                            
                            <div class="p" style="font-size: 13px; margin: 30px 0 0; color: #999;">Link expires in 30 minutes.</div>
                        </div>
                        <div class="footer">
                             <p>&copy; ${new Date().getFullYear()} Dr.Auth. Secure Access Systems.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            `
        });
        res.json({ message: "Reset link sent to email" });
    }
    catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Error sending email" });
    }
};
exports.forgotPassword = forgotPassword;
const verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;
        const resetPasswordToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken,
                resetPasswordExpires: { gt: new Date() }
            }
        });
        if (!user) {
            res.status(400).json({ valid: false, message: "Invalid or expired token" });
            return;
        }
        res.status(200).json({ valid: true });
    }
    catch (error) {
        console.error("Verify Token Error:", error);
        res.status(500).json({ valid: false, message: "Server error" });
    }
};
exports.verifyResetToken = verifyResetToken;
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const resetPasswordToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken,
                resetPasswordExpires: { gt: new Date() }
            }
        });
        if (!user) {
            res.status(400).json({ message: "Invalid or expired token" });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });
        res.json({ message: "Password updated successfully" });
    }
    catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Error resetting password" });
    }
};
exports.resetPassword = resetPassword;
const refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) {
        res.status(401).json({ message: "No token provided" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }
        const jwtOptions = {
            expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || '15m')
        };
        const accessToken = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, jwtOptions);
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000
        });
        res.json({
            message: "Refreshed",
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    }
    catch (error) {
        res.status(403).json({ message: "Invalid refresh token" });
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res) => {
    res.cookie('accessToken', '', { httpOnly: true, expires: new Date(0) });
    res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
    res.json({ message: "Logged out" });
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map
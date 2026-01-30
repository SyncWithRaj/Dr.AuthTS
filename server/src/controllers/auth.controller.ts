import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Temporary OTP Store
const otpStore = new Map<string, { otp: string; expires: number }>();

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper: Send Cookies
const sendTokenResponse = (user: User, statusCode: number, res: Response) => {

    // Cast to any to avoid strict "StringValue" type mismatch from @types/jsonwebtoken
    const jwtOptions: jwt.SignOptions = {
        expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || '15m') as any
    };

    const refreshJwtOptions: jwt.SignOptions = {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || '7d') as any
    };

    const accessToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET as string,
        jwtOptions
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET as string,
        refreshJwtOptions
    );

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true in production
        sameSite: 'lax' as const,
    };

    // 15 minutes in ms
    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000
    });

    // 7 days in ms
    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Handle Redirect for Social Login vs JSON for Regular Login
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

// --- 1. SEND OTP ---
const sendOtp = async (req: Request, res: Response) => {
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
            expires: Date.now() + 10 * 60 * 1000 // 10 mins
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

    } catch (error) {
        console.error("OTP Error:", error);
        res.status(500).json({ message: "Failed to send OTP" });
    }
};

// --- 2. REGISTER ---
const register = async (req: Request, res: Response) => {
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

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: { firstName, lastName, email, password: hashedPassword, phone, role: role || 'USER' }
        });

        otpStore.delete(email);

        sendTokenResponse(newUser, 201, res);

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// --- 3. LOGIN ---
const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }

        // Handle social users with no password
        if (!user.password && (user.googleId || user.githubId)) {
            res.status(400).json({ message: "Please login with Google/GitHub" });
            return;
        }

        if (!user.password) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }

        sendTokenResponse(user, 200, res);

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// --- 4. FORGOT PASSWORD ---
const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Generate Token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

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

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Error sending email" });
    }
};

// --- 4.5 VERIFY RESET TOKEN (For Frontend Valid/Invalid Check) ---
const verifyResetToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const resetPasswordToken = crypto.createHash('sha256').update(token as string).digest('hex');

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

    } catch (error) {
        console.error("Verify Token Error:", error);
        res.status(500).json({ valid: false, message: "Server error" });
    }
};

// --- 5. RESET PASSWORD ---
const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const resetPasswordToken = crypto.createHash('sha256').update(token as string).digest('hex');

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

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

        res.json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Error resetting password" });
    }
};

// --- 6. REFRESH TOKEN ---
const refreshToken = async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken; // Read from cookie
    if (!token) {
        res.status(401).json({ message: "No token provided" });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as { id: number };

        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }

        // Generate new Access Token Only
        const jwtOptions: jwt.SignOptions = {
            expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || '15m') as any
        };

        const accessToken = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            jwtOptions
        );

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Relaxed for redirect flows
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

    } catch (error) {
        res.status(403).json({ message: "Invalid refresh token" });
    }
};

const logout = async (req: Request, res: Response) => {
    res.cookie('accessToken', '', { httpOnly: true, expires: new Date(0) });
    res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
    res.json({ message: "Logged out" });
}

// --- 7. MAGIC LINK ---
const sendMagicLink = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Check if email format is valid at least? Validation usually happens before controller.
            // Requirement says: "email not register then toast user not found"
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Generate Magic Link Token (Short lived - 10 mins)
        // using crypto for one-time use token, stored in DB or stateless JWT?
        // Plan said JWT. Let's use JWT for statelessness, but we might want to prevent replay attacks.
        // For simplicity and speed, stateless JWT is fine.
        const magicToken = jwt.sign(
            { id: user.id, type: 'magic-link' },
            process.env.JWT_SECRET as string,
            { expiresIn: '10m' }
        );

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const magicLink = `${clientUrl}/magic-login/${magicToken}`;

        await transporter.sendMail({
            from: `"Dr.Auth Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Login with Magic Link | Dr.Auth',
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Magic Login Link</title>
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
                            <div class="h2">Magic Login</div>
                            <div class="p">Click the button below to log in instantly without a password. This link is valid for 10 minutes.</div>
                            
                            <a href="${magicLink}" class="btn">Login Now</a>
                            
                            <div class="p" style="font-size: 13px; margin: 30px 0 0; color: #999;">If you didn't request this link, you can safely ignore it.</div>
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

        res.json({ message: `Magic link sent to ${email}` });

    } catch (error) {
        console.error("Magic Link Error:", error);
        res.status(500).json({ message: "Failed to send magic link" });
    }
};

const verifyMagicLink = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        if (!token) {
            res.status(400).json({ message: "Token required" });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number, type: string };

        if (decoded.type !== 'magic-link') {
            res.status(400).json({ message: "Invalid token type" });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        sendTokenResponse(user, 200, res);

    } catch (error) {
        console.error("Verify Magic Link Error:", error);
        res.status(401).json({ message: "Invalid or expired magic link" });
    }
};

export { register, login, sendOtp, forgotPassword, resetPassword, refreshToken, logout, verifyResetToken, sendTokenResponse, sendMagicLink, verifyMagicLink };

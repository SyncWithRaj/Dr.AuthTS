"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const protect = async (req, res, next) => {
    let token;
    // Check Cookies first (Preferred)
    if (req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }
    // Fallback to Header (Optional support)
    else if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
            });
            if (!user) {
                res.status(401).json({ message: 'Not authorized, token failed' });
                return;
            }
            req.user = user;
            next();
        }
        catch (error) {
            console.error("Token verification failed:", error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};
exports.protect = protect;
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    }
    else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};
exports.admin = admin;
//# sourceMappingURL=auth.middleware.js.map
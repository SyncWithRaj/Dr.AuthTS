import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DecodedToken extends JwtPayload {
    id: number;
    role: string;
}

const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Check Cookies first (Preferred)
    if (req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }
    // Fallback to Header (Optional support)
    else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;

            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
            });

            if (!user) {
                res.status(401).json({ message: 'Not authorized, token failed' });
                return;
            }

            req.user = user;

            next();
        } catch (error: any) {
            console.error("Token verification failed:", error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

export { protect, admin };

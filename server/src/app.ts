/// <reference path="./@types/express/index.d.ts" />
import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import passport from 'passport';

// We will import these as we convert them
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import './config/passport';

const app: Express = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Allow Vite Frontend
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Test Route
app.get('/', (req: Request, res: Response) => {
    res.json({ message: "Dayflow API is running 🚀" });
});

export default app;

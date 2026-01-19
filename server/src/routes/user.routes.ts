import express from 'express';
import { protect, admin } from '../middlewares/auth.middleware';
import {
    getAllUsers,
    getUserById,
    updateUserProfile,
    getUserProfile,
    uploadMiddleware
} from '../controllers/user.controller';

const router = express.Router();

// Apply uploadMiddleware to handle 'multipart/form-data'
router.put('/profile', protect, uploadMiddleware, updateUserProfile);

router.get('/profile', protect, getUserProfile);
router.get('/', protect, getAllUsers);
router.get('/:id', protect, admin, getUserById);

export default router;

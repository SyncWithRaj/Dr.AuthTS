import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cloudinary from 'cloudinary';
import multer from 'multer';

const prisma = new PrismaClient();

// --- 1. CONFIGURATION ---
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer Storage (Memory for direct upload)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper: Upload to Cloudinary stream
const uploadToCloudinary = (buffer: Buffer): Promise<{ secure_url: string }> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
            { folder: "hrms_profiles" },
            (error, result) => {
                if (error || !result) reject(error || new Error("Upload failed"));
                else resolve(result as { secure_url: string }); // Cast or use proper type from SDK
            }
        );
        uploadStream.end(buffer);
    });
};

const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                phone: true,
                profilePic: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id as string) }
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// --- 2. UPDATE PROFILE (Handles Text + Image) ---
const updateUserProfile = async (req: Request, res: Response) => {
    try {
        // req.user is guaranteed by middleware but check needed for strict TS if not asserted
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ message: "User not authenticated" });
            return;
        }

        // Parse text fields (req.body contains text fields from FormData)
        const {
            firstName, lastName, phone, address, dateOfBirth,
            gender, nationality
        } = req.body;

        let profilePicUrl: string | undefined = undefined;

        // Check if file exists in request
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            profilePicUrl = result.secure_url;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName, lastName, phone, address, gender,
                nationality,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                // Only update profilePic if a new one was uploaded
                ...(profilePicUrl && { profilePic: profilePicUrl })
            },
        });

        res.json(updatedUser);
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
};

const getUserProfile = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            res.status(404).json({ message: "User not found" }); // Should be caught by middleware
            return;
        }
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Export 'upload' middleware so we can use it in routes
export const uploadMiddleware = upload.single('profilePic');

export {
    getAllUsers,
    getUserById,
    updateUserProfile,
    getUserProfile
};

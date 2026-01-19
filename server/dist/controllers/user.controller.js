"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.updateUserProfile = exports.getUserById = exports.getAllUsers = exports.uploadMiddleware = void 0;
const client_1 = require("@prisma/client");
const cloudinary_1 = __importDefault(require("cloudinary"));
const multer_1 = __importDefault(require("multer"));
const prisma = new client_1.PrismaClient();
// --- 1. CONFIGURATION ---
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
// Multer Storage (Memory for direct upload)
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
// Helper: Upload to Cloudinary stream
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.v2.uploader.upload_stream({ folder: "hrms_profiles" }, (error, result) => {
            if (error || !result)
                reject(error || new Error("Upload failed"));
            else
                resolve(result); // Cast or use proper type from SDK
        });
        uploadStream.end(buffer);
    });
};
const getAllUsers = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getUserById = getUserById;
// --- 2. UPDATE PROFILE (Handles Text + Image) ---
const updateUserProfile = async (req, res) => {
    try {
        // req.user is guaranteed by middleware but check needed for strict TS if not asserted
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "User not authenticated" });
            return;
        }
        // Parse text fields (req.body contains text fields from FormData)
        const { firstName, lastName, phone, address, dateOfBirth, gender, nationality } = req.body;
        let profilePicUrl = undefined;
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
    }
    catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
};
exports.updateUserProfile = updateUserProfile;
const getUserProfile = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getUserProfile = getUserProfile;
// Export 'upload' middleware so we can use it in routes
exports.uploadMiddleware = upload.single('profilePic');
//# sourceMappingURL=user.controller.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const user_controller_1 = require("../controllers/user.controller");
const router = express_1.default.Router();
// Apply uploadMiddleware to handle 'multipart/form-data'
router.put('/profile', auth_middleware_1.protect, user_controller_1.uploadMiddleware, user_controller_1.updateUserProfile);
router.get('/profile', auth_middleware_1.protect, user_controller_1.getUserProfile);
router.get('/', auth_middleware_1.protect, user_controller_1.getAllUsers);
router.get('/:id', auth_middleware_1.protect, auth_middleware_1.admin, user_controller_1.getUserById);
exports.default = router;
//# sourceMappingURL=user.routes.js.map
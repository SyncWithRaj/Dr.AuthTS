"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="./@types/express/index.d.ts" />
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
// We will import these as we convert them
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
require("./config/passport");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173', // Allow Vite Frontend
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
// Test Route
app.get('/', (req, res) => {
    res.json({ message: "Dayflow API is running 🚀" });
});
exports.default = app;
//# sourceMappingURL=app.js.map
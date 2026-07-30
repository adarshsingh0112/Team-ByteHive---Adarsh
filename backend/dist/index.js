"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const api_routes_1 = __importDefault(require("./routes/api.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Security & Production Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false
}));
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'https://*.vercel.app'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Rate Limiting Guards for Production
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // limit each IP to 150 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests from this IP, please try again after 15 minutes." }
});
app.use('/api', limiter);
// Serve static frontend files if present
const publicDir = path_1.default.join(__dirname, '../public');
app.use(express_1.default.static(publicDir));
// Mount REST API Routes
app.use('/api', api_routes_1.default);
// Health Endpoint
app.get('/health', (req, res) => {
    res.json({ status: "healthy", service: "KrishnaAI Production Node.js Server", timestamp: new Date().toISOString() });
});
// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error("Global Server Exception:", err.message);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
});
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 KrishnaAI Production Server running on port ${PORT}`);
    console.log(`👉 Health Check: http://localhost:${PORT}/health`);
    console.log(`====================================================`);
});

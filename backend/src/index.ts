import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import apiRoutes from './routes/api.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Production Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://*.vercel.app'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Rate Limiting Guards for Production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes." }
});
app.use('/api', limiter);

// Serve static frontend files if present
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// Mount REST API Routes
app.use('/api', apiRoutes);

// Health Endpoint
app.get('/health', (req, res) => {
  res.json({ status: "healthy", service: "KrishnaAI Production Node.js Server", timestamp: new Date().toISOString() });
});

// Global Error Handler Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Server Exception:", err.message);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 KrishnaAI Production Server running on port ${PORT}`);
  console.log(`👉 Health Check: http://localhost:${PORT}/health`);
  console.log(`====================================================`);
});

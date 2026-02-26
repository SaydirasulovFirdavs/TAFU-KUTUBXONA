import express from 'express';
import { query } from './config/database.js';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Define dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, 'error.log');

// Helper to log errors
const logError = (msg, error) => {
    const time = new Date().toISOString();
    const entry = `[${time}] ${msg}\n${error?.stack || error}\n\n`;
    try {
        fs.appendFileSync(LOG_FILE, entry);
    } catch (e) {
        console.error('Failed to write to log file', e);
    }
};

// Import routes
import authRoutes from './routes/auth.routes.js';
import booksRoutes from './routes/books.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// Security headers - Customize for PDF and Image loading
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
}));

// CORS
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://tafu-library-live.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploads) with custom headers for CORS required by PDF.js
const uploadsPath = path.resolve(process.cwd(), 'uploads');
console.log('--- SERVER STARTUP ---');
console.log('Current working directory:', process.cwd());
console.log('Uploads path resolved to:', uploadsPath);
if (fs.existsSync(uploadsPath)) {
    console.log('Uploads directory EXISTS');
    const contents = fs.readdirSync(uploadsPath);
    console.log('Uploads directory contents:', contents);
} else {
    console.log('CRITICAL: Uploads directory DOES NOT EXIST at', uploadsPath);
}

app.use('/uploads', express.static(uploadsPath, {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Juda ko\'p so\'rovlar yuborildi, keyinroq qayta urinib ko\'ring',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    message: 'Juda ko\'p login urinishlari, 15 daqiqadan keyin qayta urinib ko\'ring',
    skipSuccessfulRequests: true,
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Web Kutubxona API is running',
        timestamp: new Date().toISOString()
    });
});

// Version check for debugging deployment
app.get('/api/version', (req, res) => {
    res.json({
        version: '1.0.0-debug-2026-02-23-v4-cors',
        deployed_at: new Date().toISOString()
    });
});

// Direct log viewer (UNSAFE but needed for emergency)
app.get('/api/debug/logs', (req, res) => {
    if (fs.existsSync(LOG_FILE)) {
        const logs = fs.readFileSync(LOG_FILE, 'utf8');
        res.header('Content-Type', 'text/plain');
        res.send(logs);
    } else {
        res.send('No logs yet');
    }
});

// Auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);

// Books routes
app.use('/api/books', booksRoutes);

// User routes
app.use('/api/user', userRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Image sync trigger
app.get('/api/debug/sync-images', async (req, res) => {
    try {
        const booksResult = await query('SELECT id, title FROM books');
        const books = booksResult.rows;

        const updates = [
            { title: 'Temur Tuzuklari', img: 'uploads/books/bb54a5d0-075b-475c-8f6c-d87029c7d097.jpg' },
            { title: 'Kecha va Kunduz', img: 'uploads/books/d0e64e7b-f710-4be8-8310-21dee6a07bcd.jpg' },
            { title: 'Ikki eshik orasi', img: 'uploads/books/d736df53-99a1-4b4b-9a13-929cf98609c7.jpg' },
            { title: 'Sariq devni minib', img: 'uploads/books/02cbe054-5c5f-4f3c-b5ed-7ed0776b9054.png' },
            { title: 'Kaktuslar ham gullaydi', img: 'uploads/books/3a8e7ac8-b3a0-40cf-aa5e-e8be51183593.png' }
        ];

        let updatedCount = 0;
        for (const update of updates) {
            const book = books.find(b => b.title.toLowerCase().includes(update.title.toLowerCase()));
            if (book) {
                await query('UPDATE books SET cover_image = $1 WHERE id = $2', [update.img, book.id]);
                updatedCount++;
            }
        }
        res.json({ success: true, updated: updatedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Directory list viewer
app.get('/api/debug/dir', async (req, res) => {
    try {
        const p = req.query.path || uploadsPath;
        // The 'fs' module is already imported at the top of the file.
        // The instruction included 'const fs = await import('fs');' which is redundant here.
        // To make the code syntactically correct as per the instruction's provided snippet,
        // the route handler must be 'async' if 'await' is used inside it.
        // We will use the already imported 'fs' module directly.
        if (fs.existsSync(p)) {
            const files = fs.readdirSync(p);
            res.json({ path: p, files });
        } else {
            res.status(404).json({ error: 'Path not found', attempted: p });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route topilmadi'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);

    // DEBUG LOGGING
    logError('Global Error', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Server xatosi',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// START SERVER
// ============================================

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`
    ╔═══════════════════════════════════════════╗
    ║   📚 Web Kutubxona API Server            ║
    ║   🚀 Server running on port ${PORT}         ║
    ║   🌍 Environment: ${process.env.NODE_ENV || 'development'}           ║
    ║   📡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'} ║
    ╚═══════════════════════════════════════════╝
        `);
    });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});

export default app;

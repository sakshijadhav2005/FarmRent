const dotenv = require('dotenv');
dotenv.config(); // Load environment variables FIRST, before other imports

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./db/db');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const workRequestRoutes = require('./routes/workRequests');
const mapRoutes = require('./routes/maps');
const weatherRoutes = require('./routes/weather');
// New feature routes
const reviewRoutes = require('./routes/reviews');
const wishlistRoutes = require('./routes/wishlist');
const notificationRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/messages');

console.log('DEBUG - GEMINI_API_KEY from process.env:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'NOT SET');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS Configuration for Render deployment
const allowedOrigins = [
    'http://localhost:5173',           // Local development
    'http://localhost:5174',           // Alternative local port
    'http://localhost:3000',           // Alternative local
    process.env.FRONTEND_URL,          // Production frontend URL from env
].filter(Boolean); // Remove undefined values

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Session configuration for OAuth
app.use(session({
    secret: process.env.JWT_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        console.log('Body:', JSON.stringify(req.body));
    }
    next();
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to Database, then start server and register routes
(async () => {
    const connected = await connectDB();
    if (!connected) {
        console.error('Failed to connect to database. Exiting.');
        process.exit(1);
        return;
    }

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/equipment', equipmentRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/work-requests', workRequestRoutes);
    app.use('/api/maps', mapRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/payments", paymentRoutes);
    app.use("/api/weather", weatherRoutes);
    // New feature routes
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/wishlist', wishlistRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/messages', messageRoutes);

    app.get('/', (req, res) => {
        res.send('Farm Equipment Rental API is running');
    });

    // Basic Error handling
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).send('Something broke!');
    });

    // Start Server with error handling for EADDRINUSE
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            const fallbackPort = Number(PORT) + 1;
            console.warn(`Port ${PORT} in use, attempting to start on port ${fallbackPort}`);
            server.close(() => {
                app.listen(fallbackPort, () => console.log(`Server running on port ${fallbackPort}`));
            });
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
})();

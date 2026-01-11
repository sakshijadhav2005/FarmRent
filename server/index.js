const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
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
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

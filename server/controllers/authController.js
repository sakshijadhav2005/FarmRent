const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const passport = require('passport');

// Generate Token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

// REGISTER USER
exports.registerUser = async (req, res) => {
    try {
        const { name, email, mobile, password, role } = req.body;

        if (!name || !email || !mobile || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Check email already exists
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: "Email already registered",
            });
        }

        // Check mobile already exists
        const mobileExists = await User.findOne({ mobile });
        if (mobileExists) {
            return res.status(400).json({
                success: false,
                message: "Mobile number already registered",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            mobile,
            password: hashedPassword,
            role
        });

        const token = generateToken(user._id, user.role);

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role
            },
            token
        });

    } catch (err) {
        console.error("REGISTRATION ERROR:", err);
        // Duplicate key error handler
        if (err.code === 11000) {
            const duplicateField = Object.keys(err.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1)} already registered`,
            });
        }

        // Mongoose validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message).join(', ');
            return res.status(400).json({ success: false, message: messages });
        }

        // Fallback - return error message to help debugging (do not expose stack in production)
        return res.status(500).json({
            success: false,
            message: err.message || "Server error during registration",
        });
    }
};

// LOGIN USER
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        // Find user by email or mobile
        const user = await User.findOne({ $or: [{ email }, { mobile: email }] });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        if (!user.password) {
            return res.status(500).json({ success: false, message: "User password missing" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = generateToken(user._id, user.role);

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role
            },
            token
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ success: false, message: "Server error during login" });
    }
};


// GET LOGGED IN USER
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// @desc    Update logged in user
// @route   PUT /api/auth/me
// @access  Private
exports.updateMe = async (req, res) => {
    try {
        const updates = {};
        const { name, mobile, location, password } = req.body;

        if (name) updates.name = name;
        if (mobile) updates.mobile = mobile;
        if (location) updates.location = location;
        // Allow updating hourly rate
        if (req.body.hourlyRate !== undefined) updates.hourlyRate = Number(req.body.hourlyRate);

        // If password provided, hash it
        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            updates.password = hashed;
        }

        // If mobile is being updated, ensure uniqueness
        if (mobile) {
            const existing = await User.findOne({ mobile, _id: { $ne: req.user.id } });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Mobile number already in use' });
            }
        }

        const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password');

        return res.status(200).json({ success: true, data: user });
    } catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};

// GOOGLE OAUTH - Initiate authentication
exports.googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email']
});

// GOOGLE OAUTH - Callback handler
exports.googleCallback = (req, res, next) => {
    passport.authenticate('google', async (err, user, info) => {
        try {
            if (err) {
                console.error('Google OAuth callback error:', err);
                return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`);
            }

            if (!user) {
                return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=no_user`);
            }

            // Check if user needs role selection (new Google user)
            if (user.needsRoleSelection) {
                // Store user info in session for role selection
                req.session.pendingGoogleUser = {
                    email: user.email,
                    name: user.name,
                    googleId: user.googleId
                };
                // Redirect to role selection page
                return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/select-role?google=true`);
            }

            // Existing user - generate token and redirect
            const token = generateToken(user._id, user.role);

            // Redirect to frontend with token
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}&role=${user.role}`);

        } catch (error) {
            console.error('Google callback processing error:', error);
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=processing_failed`);
        }
    })(req, res, next);
};

// GOOGLE OAUTH - Complete profile with role selection
exports.completeGoogleProfile = async (req, res) => {
    try {
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ success: false, message: 'Role is required' });
        }

        // Get pending user from session
        const pendingUser = req.session.pendingGoogleUser;

        if (!pendingUser) {
            return res.status(400).json({ success: false, message: 'No pending Google registration found' });
        }

        // Create new user with selected role
        const user = await User.create({
            name: pendingUser.name,
            email: pendingUser.email,
            googleId: pendingUser.googleId,
            authProvider: 'google',
            role
        });

        // Clear pending user from session
        delete req.session.pendingGoogleUser;

        // Generate token
        const token = generateToken(user._id, user.role);

        return res.status(201).json({
            success: true,
            message: 'Profile completed successfully',
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role
            },
            token
        });

    } catch (err) {
        console.error('Complete Google profile error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to complete profile'
        });
    }
};

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Extract user info from Google profile
            const email = profile.emails[0].value;
            const name = profile.displayName;
            const googleId = profile.id;

            // Check if user already exists with this Google ID
            let user = await User.findOne({ googleId });

            if (user) {
                // User exists with Google ID, return user
                return done(null, user);
            }

            // Check if user exists with this email (account linking)
            user = await User.findOne({ email });

            if (user) {
                // Link Google account to existing user
                user.googleId = googleId;
                user.authProvider = 'google';
                await user.save();
                return done(null, user);
            }

            // New user - create with pending role selection
            // We'll store user info in session and complete registration later
            const newUser = {
                email,
                name,
                googleId,
                authProvider: 'google',
                needsRoleSelection: true
            };

            return done(null, newUser);

        } catch (err) {
            console.error('Google OAuth Error:', err);
            return done(err, null);
        }
    }
));

module.exports = passport;

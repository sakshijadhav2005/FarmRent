---
title: Google OAuth 2.0 Login Integration
status: draft
priority: high
created: 2026-01-14
---

# Google OAuth 2.0 Login Integration

## Overview
Implement Google OAuth 2.0 authentication to allow users to sign in and register using their Google accounts. This will provide a seamless, secure login experience alongside the existing email/password authentication.

## Business Value
- **Improved User Experience**: One-click login reduces friction in the registration/login process
- **Increased Conversion**: Users are more likely to complete registration with social login
- **Enhanced Security**: Leverages Google's robust authentication infrastructure
- **Reduced Password Management**: Users don't need to remember another password

## User Stories

### US-1: Google Sign-In on Login Page
**As a** returning user  
**I want to** sign in with my Google account  
**So that** I can quickly access my account without entering credentials

**Acceptance Criteria:**
- [ ] "Sign in with Google" button is visible on the login page
- [ ] Clicking the button opens Google OAuth consent screen
- [ ] After successful authentication, user is logged in and redirected to appropriate dashboard
- [ ] If Google account doesn't exist in system, user is prompted to complete profile (select role)
- [ ] Error messages are displayed if authentication fails
- [ ] Multi-language support (English, Hindi, Marathi) for button text

### US-2: Google Sign-Up on Register Page
**As a** new user  
**I want to** register using my Google account  
**So that** I can quickly create an account without filling a long form

**Acceptance Criteria:**
- [ ] "Sign up with Google" button is visible on the register page
- [ ] Clicking the button opens Google OAuth consent screen
- [ ] After authentication, user can select their role (farmer/owner/worker/driver)
- [ ] User profile is created with Google account information (name, email)
- [ ] User is logged in and redirected to appropriate dashboard
- [ ] Mobile number can be added later (optional during Google signup)
- [ ] Error handling for duplicate accounts

### US-3: Account Linking
**As a** user with existing email/password account  
**I want to** link my Google account  
**So that** I can use either method to log in

**Acceptance Criteria:**
- [ ] If Google email matches existing account email, accounts are linked
- [ ] User is notified when accounts are linked
- [ ] User can log in with either Google or email/password
- [ ] No duplicate accounts are created

## Technical Requirements

### Backend Requirements

#### 1. Dependencies
Install required npm packages:
```bash
npm install passport passport-google-oauth20 express-session
```

#### 2. Environment Variables
Add to `server/.env`:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

Add to `client/.env`:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

#### 3. User Model Updates
Update `server/models/User.js`:
- Make `password` field optional (not required for Google users)
- Add `googleId` field (String, optional, unique, sparse index)
- Add `authProvider` field (String, enum: ['local', 'google'], default: 'local')
- Make `mobile` field optional (can be added later)

```javascript
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, unique: true, sparse: true, minlength: 10, maxlength: 10 },
    password: { type: String }, // Optional for Google users
    googleId: { type: String, unique: true, sparse: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    location: { type: String },
    role: { type: String, enum: ["farmer", "owner", "worker", "admin", "driver"], required: true },
    hourlyRate: { type: Number, default: 0 }
}, { timestamps: true });
```

#### 4. Passport Configuration
Create `server/config/passport.js`:
- Configure Google OAuth 2.0 strategy
- Handle user lookup by googleId
- Handle user creation for new Google users
- Handle account linking for existing email users

#### 5. Auth Controller Updates
Update `server/controllers/authController.js`:
- Add `googleAuth` function to initiate Google OAuth
- Add `googleCallback` function to handle OAuth callback
- Add `completeGoogleProfile` function for role selection
- Update existing functions to handle Google users

#### 6. Auth Routes Updates
Update `server/routes/auth.js`:
```javascript
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.post('/google/complete-profile', protect, completeGoogleProfile);
```

#### 7. Session Management
Configure express-session in `server/index.js`:
```javascript
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));
```

### Frontend Requirements

#### 1. Dependencies
Install required npm packages:
```bash
npm install @react-oauth/google
```

#### 2. Google OAuth Provider Setup
Update `client/src/main.jsx`:
```javascript
import { GoogleOAuthProvider } from '@react-oauth/google';

<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <App />
</GoogleOAuthProvider>
```

#### 3. Login Page Updates
Update `client/src/pages/Login.jsx`:
- Add Google Sign-In button using `@react-oauth/google`
- Handle successful Google authentication
- Send Google credential to backend
- Handle errors and display messages
- Add divider between traditional login and Google login

#### 4. Register Page Updates
Update `client/src/pages/Register.jsx`:
- Add Google Sign-Up button
- Show role selection modal after Google authentication
- Handle profile completion flow
- Maintain existing role selection UI

#### 5. API Integration
Update `client/src/api.js`:
```javascript
export const googleLogin = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    return data;
};

export const completeGoogleProfile = async (role) => {
    const { data } = await api.post('/auth/google/complete-profile', { role });
    return data;
};
```

#### 6. Translation Keys
Add to all language files (`en.json`, `hi.json`, `mr.json`):
```json
{
    "auth": {
        "signInWithGoogle": "Sign in with Google",
        "signUpWithGoogle": "Sign up with Google",
        "orContinueWith": "Or continue with",
        "selectRole": "Select Your Role",
        "completeProfile": "Complete Your Profile"
    }
}
```

## Implementation Plan

### Phase 1: Backend Setup (2-3 hours)
1. Install backend dependencies
2. Set up Google Cloud Console project and obtain credentials
3. Update User model schema
4. Create Passport configuration
5. Update auth controller with Google OAuth functions
6. Update auth routes
7. Configure session management
8. Test backend endpoints with Postman

### Phase 2: Frontend Setup (2-3 hours)
1. Install frontend dependencies
2. Set up GoogleOAuthProvider in main.jsx
3. Create reusable GoogleLoginButton component
4. Update Login page with Google Sign-In
5. Update Register page with Google Sign-Up
6. Add translation keys
7. Test OAuth flow end-to-end

### Phase 3: Testing & Refinement (1-2 hours)
1. Test new user registration via Google
2. Test existing user login via Google
3. Test account linking scenario
4. Test error scenarios (network failure, cancelled auth, etc.)
5. Test multi-language support
6. Verify mobile responsiveness
7. Security audit

## Google Cloud Console Setup

### Steps to Obtain OAuth Credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen:
   - User Type: External
   - App name: FarmRent
   - User support email: your-email@example.com
   - Authorized domains: localhost (for development)
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: FarmRent Web Client
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5001/api/auth/google/callback`
7. Copy Client ID and Client Secret to `.env` files

## Security Considerations

1. **HTTPS in Production**: Always use HTTPS for OAuth callbacks in production
2. **State Parameter**: Implement CSRF protection using state parameter
3. **Token Storage**: Store JWT tokens securely (httpOnly cookies in production)
4. **Scope Limitation**: Only request necessary Google scopes (profile, email)
5. **Error Handling**: Never expose sensitive error details to frontend
6. **Rate Limiting**: Implement rate limiting on auth endpoints
7. **Session Security**: Use secure session configuration in production

## Testing Checklist

### Functional Testing
- [ ] New user can register with Google
- [ ] Existing user can login with Google
- [ ] Account linking works for matching emails
- [ ] Role selection works after Google signup
- [ ] Redirects work correctly based on role
- [ ] Error messages display correctly
- [ ] Multi-language support works

### Security Testing
- [ ] OAuth flow cannot be hijacked
- [ ] Tokens are properly validated
- [ ] No sensitive data exposed in URLs
- [ ] CSRF protection works
- [ ] Session management is secure

### UI/UX Testing
- [ ] Google button is visually consistent
- [ ] Loading states are clear
- [ ] Error states are user-friendly
- [ ] Mobile responsive design works
- [ ] All languages display correctly

## Success Metrics

- **Adoption Rate**: 30%+ of new users sign up with Google within first month
- **Conversion Rate**: 15%+ increase in registration completion rate
- **Login Time**: Average login time reduced by 50%
- **Error Rate**: Less than 2% authentication failures

## Rollback Plan

If issues arise:
1. Disable Google OAuth routes on backend
2. Hide Google login buttons on frontend
3. Revert User model changes if necessary
4. Users can still use email/password authentication
5. No data loss - Google users can reset password to use email/password

## Future Enhancements

- Add Facebook OAuth
- Add Apple Sign-In
- Add Microsoft OAuth
- Implement account unlinking feature
- Add profile picture sync from Google
- Add email verification for Google accounts

## Dependencies

- No blocking dependencies
- Can be implemented independently
- Does not affect existing authentication flow

## Notes

- Keep existing email/password authentication fully functional
- Google OAuth is an additional option, not a replacement
- Maintain backward compatibility with existing users
- Follow Google's branding guidelines for buttons
- Test thoroughly in development before production deployment

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)

# Google OAuth Implementation - Quick Start Guide

## Prerequisites Checklist
- [ ] Google Cloud Console account
- [ ] Project created in Google Cloud Console
- [ ] OAuth 2.0 credentials obtained (Client ID & Secret)

## Step-by-Step Implementation

### Step 1: Google Cloud Console Setup (15 minutes)

1. **Create/Select Project**
   - Go to https://console.cloud.google.com/
   - Create new project: "FarmRent" or select existing

2. **Enable APIs**
   - Navigate to "APIs & Services" → "Library"
   - Search and enable "Google+ API"

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - User Type: External
   - App Information:
     - App name: `FarmRent`
     - User support email: `your-email@example.com`
     - Developer contact: `your-email@example.com`
   - Scopes: Add `userinfo.email` and `userinfo.profile`
   - Test users: Add your email for testing

4. **Create OAuth 2.0 Credentials**
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: Web application
   - Name: `FarmRent Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:5173` (Vite dev server)
   - Authorized redirect URIs:
     - `http://localhost:5001/api/auth/google/callback`
   - Click "Create"
   - **SAVE** Client ID and Client Secret

### Step 2: Backend Implementation (2-3 hours)

#### 2.1 Install Dependencies
```bash
cd server
npm install passport passport-google-oauth20 express-session
```

#### 2.2 Update Environment Variables
Add to `server/.env`:
```env
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

#### 2.3 Update User Model
File: `server/models/User.js`

Changes needed:
- Make `password` optional (remove `required: true`)
- Make `mobile` optional (remove `required: true`, add `sparse: true` to unique)
- Add `googleId` field
- Add `authProvider` field

#### 2.4 Create Passport Configuration
File: `server/config/passport.js` (NEW FILE)

Implement:
- Google OAuth 2.0 strategy
- User lookup/creation logic
- Account linking for existing emails

#### 2.5 Update Auth Controller
File: `server/controllers/authController.js`

Add new functions:
- `googleAuth` - Initiates Google OAuth flow
- `googleCallback` - Handles OAuth callback
- `completeGoogleProfile` - Handles role selection for new Google users

#### 2.6 Update Auth Routes
File: `server/routes/auth.js`

Add routes:
```javascript
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.post('/google/complete-profile', protect, completeGoogleProfile);
```

#### 2.7 Configure Express Session
File: `server/index.js`

Add before routes:
```javascript
const session = require('express-session');

app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());
```

### Step 3: Frontend Implementation (2-3 hours)

#### 3.1 Install Dependencies
```bash
cd client
npm install @react-oauth/google
```

#### 3.2 Update Environment Variables
Add to `client/.env`:
```env
VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here
```

#### 3.3 Setup Google OAuth Provider
File: `client/src/main.jsx`

Wrap App with GoogleOAuthProvider:
```javascript
import { GoogleOAuthProvider } from '@react-oauth/google';

<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <App />
</GoogleOAuthProvider>
```

#### 3.4 Update API Functions
File: `client/src/api.js`

Add:
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

#### 3.5 Update Login Page
File: `client/src/pages/Login.jsx`

Add:
- Import GoogleLogin component
- Add "Sign in with Google" button
- Handle credential response
- Show loading/error states

#### 3.6 Update Register Page
File: `client/src/pages/Register.jsx`

Add:
- Import GoogleLogin component
- Add "Sign up with Google" button
- Show role selection modal after Google auth
- Handle profile completion

#### 3.7 Add Translation Keys
Files: `client/src/i18n/locales/en.json`, `hi.json`, `mr.json`

Add keys:
```json
{
    "auth": {
        "signInWithGoogle": "Sign in with Google / Google से साइन इन करें / Google सह साइन इन करा",
        "signUpWithGoogle": "Sign up with Google / Google से साइन अप करें / Google सह साइन अप करा",
        "orContinueWith": "Or continue with / या जारी रखें / किंवा सुरू ठेवा",
        "selectRole": "Select Your Role / अपनी भूमिका चुनें / तुमची भूमिका निवडा",
        "completeProfile": "Complete Your Profile / अपनी प्रोफ़ाइल पूरी करें / तुमचे प्रोफाइल पूर्ण करा"
    }
}
```

### Step 4: Testing (1-2 hours)

#### 4.1 Backend Testing
- [ ] Test `/api/auth/google` endpoint redirects to Google
- [ ] Test `/api/auth/google/callback` handles OAuth response
- [ ] Test user creation with Google account
- [ ] Test account linking with existing email
- [ ] Test role selection endpoint

#### 4.2 Frontend Testing
- [ ] Test Google button appears on Login page
- [ ] Test Google button appears on Register page
- [ ] Test OAuth flow completes successfully
- [ ] Test role selection modal appears for new users
- [ ] Test redirect to correct dashboard based on role
- [ ] Test error handling (cancelled auth, network error)
- [ ] Test multi-language support

#### 4.3 Integration Testing
- [ ] New user registers with Google → selects role → redirected to dashboard
- [ ] Existing user logs in with Google → redirected to dashboard
- [ ] User with matching email → accounts linked → logged in
- [ ] Error scenarios handled gracefully

## Common Issues & Solutions

### Issue 1: "Redirect URI mismatch"
**Solution**: Ensure redirect URI in Google Console exactly matches backend callback URL

### Issue 2: "Access blocked: This app's request is invalid"
**Solution**: Add test users in OAuth consent screen or publish app

### Issue 3: "Invalid client ID"
**Solution**: Verify VITE_GOOGLE_CLIENT_ID matches Google Console Client ID

### Issue 4: "Session not found"
**Solution**: Ensure express-session is configured before passport initialization

### Issue 5: "User not found after Google auth"
**Solution**: Check User model allows optional password and mobile fields

## Production Deployment Checklist

- [ ] Update authorized origins to production domain
- [ ] Update redirect URIs to production callback URL
- [ ] Enable HTTPS for all OAuth endpoints
- [ ] Set `cookie: { secure: true }` in session config
- [ ] Publish OAuth consent screen (remove test mode)
- [ ] Add production domain to authorized domains
- [ ] Update environment variables on production server
- [ ] Test OAuth flow on production
- [ ] Monitor error logs for OAuth failures

## Security Best Practices

1. **Never commit credentials** - Keep `.env` files in `.gitignore`
2. **Use HTTPS in production** - OAuth requires secure connections
3. **Validate tokens** - Always verify Google tokens on backend
4. **Limit scopes** - Only request necessary permissions
5. **Implement rate limiting** - Prevent OAuth abuse
6. **Log authentication attempts** - Monitor for suspicious activity
7. **Use httpOnly cookies** - Store tokens securely in production

## Support Resources

- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **Passport.js Docs**: http://www.passportjs.org/
- **React OAuth Docs**: https://www.npmjs.com/package/@react-oauth/google
- **Stack Overflow**: Tag questions with `google-oauth`, `passport.js`, `react-oauth`

## Next Steps After Implementation

1. Monitor adoption rate of Google login
2. Collect user feedback on login experience
3. Consider adding other OAuth providers (Facebook, Apple)
4. Implement profile picture sync from Google
5. Add email verification for Google accounts
6. Optimize OAuth flow for mobile devices

---

**Estimated Total Time**: 5-8 hours
**Difficulty Level**: Intermediate
**Risk Level**: Low (existing auth remains functional)

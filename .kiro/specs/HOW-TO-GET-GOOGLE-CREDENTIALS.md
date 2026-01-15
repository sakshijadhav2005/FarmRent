# How to Get Google OAuth Credentials - Step by Step Guide

## 📋 Overview
This guide will walk you through getting your Google Client ID and Client Secret for OAuth authentication.

**Time Required**: 10-15 minutes  
**Cost**: FREE  
**Requirements**: Google Account

---

## 🚀 Step-by-Step Instructions

### Step 1: Go to Google Cloud Console

1. Open your browser and go to: **https://console.cloud.google.com/**
2. Sign in with your Google account (any Gmail account works)

---

### Step 2: Create a New Project

1. **Click** on the project dropdown at the top of the page (next to "Google Cloud")
2. **Click** "NEW PROJECT" button in the top right
3. **Enter** project details:
   - **Project name**: `FarmRent` (or any name you prefer)
   - **Organization**: Leave as "No organization" (default)
4. **Click** "CREATE" button
5. **Wait** 10-20 seconds for project creation
6. **Select** your new project from the dropdown

---

### Step 3: Enable Google+ API

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
   - Or use the search bar at top and search for "APIs & Services"
2. In the API Library search bar, type: **"Google+ API"**
3. **Click** on "Google+ API" from the results
4. **Click** the blue **"ENABLE"** button
5. **Wait** for the API to be enabled (takes 5-10 seconds)

**Alternative**: You can also enable "Google Identity Services" which is the newer API

---

### Step 4: Configure OAuth Consent Screen

1. In the left sidebar, click **"OAuth consent screen"**
2. **Select** "External" user type
3. **Click** "CREATE" button

#### Fill in the OAuth Consent Screen Form:

**App Information:**
- **App name**: `FarmRent` (or your app name)
- **User support email**: Select your email from dropdown
- **App logo**: (Optional - you can skip this)

**App Domain:** (Optional - you can skip these for development)
- Application home page: (leave blank)
- Application privacy policy link: (leave blank)
- Application terms of service link: (leave blank)

**Authorized domains:** (Optional for localhost development)
- Leave blank for now

**Developer contact information:**
- **Email addresses**: Enter your email address

4. **Click** "SAVE AND CONTINUE"

#### Scopes Page:
1. **Click** "ADD OR REMOVE SCOPES"
2. **Select** these scopes:
   - `.../auth/userinfo.email` - See your primary Google Account email address
   - `.../auth/userinfo.profile` - See your personal info
3. **Click** "UPDATE" button
4. **Click** "SAVE AND CONTINUE"

#### Test Users Page:
1. **Click** "ADD USERS"
2. **Enter** your email address (the one you'll use for testing)
3. **Click** "ADD"
4. **Click** "SAVE AND CONTINUE"

#### Summary Page:
1. **Review** your settings
2. **Click** "BACK TO DASHBOARD"

---

### Step 5: Create OAuth 2.0 Credentials

1. In the left sidebar, click **"Credentials"**
2. **Click** the **"+ CREATE CREDENTIALS"** button at the top
3. **Select** "OAuth client ID" from the dropdown

#### Configure OAuth Client:

**Application type:**
- **Select** "Web application"

**Name:**
- **Enter**: `FarmRent Web Client` (or any name)

**Authorized JavaScript origins:**
- **Click** "+ ADD URI"
- **Enter**: `http://localhost:5173`
- **Click** "+ ADD URI" again
- **Enter**: `http://localhost:5174` (backup port)

**Authorized redirect URIs:**
- **Click** "+ ADD URI"
- **Enter**: `http://localhost:5001/api/auth/google/callback`

4. **Click** "CREATE" button

---

### Step 6: Copy Your Credentials

A popup will appear with your credentials:

```
Your Client ID
1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com

Your Client Secret
GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
```

**IMPORTANT**: 
- **Copy** the Client ID
- **Copy** the Client Secret
- **Keep these safe** - treat them like passwords!

You can also:
- **Click** "DOWNLOAD JSON" to save credentials
- Access them later from the Credentials page

---

## 🔧 Update Your Environment Files

### Update Backend Environment File

1. Open `server/.env`
2. Find these lines:
```env
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

3. Replace with your actual credentials:
```env
GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
```

### Update Frontend Environment File

1. Open `client/.env`
2. Find this line:
```env
VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here
```

3. Replace with your Client ID (same as backend):
```env
VITE_GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

**Note**: Only use the Client ID in frontend, NOT the Client Secret!

---

## ✅ Verify Your Setup

### Check Your Credentials Page

1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. You should see:
   - ✅ OAuth 2.0 Client IDs section
   - ✅ Your "FarmRent Web Client" listed
   - ✅ Type: Web application

### Check OAuth Consent Screen

1. Go to **OAuth consent screen**
2. You should see:
   - ✅ Publishing status: "Testing"
   - ✅ User type: External
   - ✅ Your app name: "FarmRent"

---

## 🧪 Test Your Implementation

### Start Your Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Test Google Login

1. Open browser: `http://localhost:5173/login`
2. Click "Sign in with Google" button
3. You should see Google's login screen
4. Sign in with your test user email
5. Grant permissions
6. You should be redirected back to your app

---

## 🐛 Troubleshooting

### Error: "Redirect URI mismatch"
**Solution**: 
- Check that redirect URI in Google Console exactly matches: `http://localhost:5001/api/auth/google/callback`
- No trailing slashes
- Correct port number (5001 for backend)

### Error: "Access blocked: This app's request is invalid"
**Solution**:
- Make sure you added your email as a test user in OAuth consent screen
- Check that you enabled the Google+ API

### Error: "Invalid client ID"
**Solution**:
- Verify you copied the entire Client ID (it's very long)
- Check for extra spaces or line breaks
- Make sure you're using the Client ID in frontend, not Client Secret

### Error: "Origin not allowed"
**Solution**:
- Add `http://localhost:5173` to Authorized JavaScript origins
- Wait 5 minutes for changes to propagate
- Clear browser cache and try again

### Can't find credentials later?
**Solution**:
1. Go to Google Cloud Console
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Click the pencil icon (edit)
6. Your Client ID and Secret are shown there

---

## 🔒 Security Best Practices

### DO:
- ✅ Keep Client Secret private (never commit to Git)
- ✅ Add `.env` to `.gitignore`
- ✅ Use environment variables
- ✅ Regenerate credentials if exposed

### DON'T:
- ❌ Share Client Secret publicly
- ❌ Commit credentials to GitHub
- ❌ Use production credentials in development
- ❌ Hardcode credentials in source code

---

## 📝 Quick Reference

### Important URLs
- **Google Cloud Console**: https://console.cloud.google.com/
- **API Library**: https://console.cloud.google.com/apis/library
- **Credentials**: https://console.cloud.google.com/apis/credentials
- **OAuth Consent**: https://console.cloud.google.com/apis/credentials/consent

### Your Configuration
```
Project Name: FarmRent
Application Type: Web application
JavaScript Origins: http://localhost:5173
Redirect URI: http://localhost:5001/api/auth/google/callback
Scopes: email, profile
```

---

## 🎯 Next Steps After Setup

1. ✅ Test Google login on Login page
2. ✅ Test new user registration via Google
3. ✅ Test existing user login via Google
4. ✅ Test account linking
5. ✅ Test role selection for new Google users
6. ✅ Verify multi-language support

---

## 📞 Need Help?

If you're stuck:
1. Check the troubleshooting section above
2. Verify all steps were completed
3. Check browser console for errors
4. Check server logs for backend errors
5. Make sure both servers are running

---

## 🎉 Success!

Once you see the Google login screen and can successfully authenticate, you're all set! The Google OAuth integration is working correctly.

**Congratulations!** 🎊

---

**Last Updated**: 2026-01-14  
**Version**: 1.0

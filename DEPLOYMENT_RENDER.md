# 🚀 FarmLink Deployment Guide - Render.com

This guide explains how to deploy the FarmLink application (Frontend + Backend) on Render.com.

---

## 📋 Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **MongoDB Atlas** - Cloud database (render doesn't provide MongoDB)

---

## 🗄️ Step 1: Setup MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 - Free tier)
3. Create a database user with password
4. Whitelist IP: `0.0.0.0/0` (Allow from anywhere)
5. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/farmlink?retryWrites=true&w=majority
   ```

---

## ⚙️ Step 2: Deploy Backend (Node.js Server)

### 2.1 Prepare Backend for Deployment

Add a `render.yaml` in project root (optional, for blueprint):

```yaml
# Optional - Render will auto-detect Node.js
```

Ensure your `server/package.json` has:
```json
{
  "scripts": {
    "start": "node index.js"
  }
}
```

### 2.2 Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `farmlink-api` |
| **Region** | Oregon (US West) or nearest |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

### 2.3 Add Environment Variables

Click **"Environment"** tab and add:

| Key | Value |
|-----|-------|
| `PORT` | `5001` |
| `MONGO_URI` | `mongodb+srv://...` (your Atlas URI) |
| `JWT_SECRET` | `your-super-secret-key-here` |
| `GEMINI_API_KEY` | `your-gemini-api-key` |
| `NODE_ENV` | `production` |

5. Click **"Create Web Service"**
6. Wait for deployment (5-10 minutes)
7. Copy your backend URL: `https://farmlink-api.onrender.com`

---

## 🎨 Step 3: Deploy Frontend (React/Vite)

### 3.1 Update Frontend API URL

Before deploying, update `client/src/api.js`:

```javascript
// Change this line
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// The environment variable will be set in Render
```

### 3.2 Create Static Site on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `farmlink-app` |
| **Branch** | `main` |
| **Root Directory** | `client` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### 3.3 Add Environment Variables

Click **"Environment"** tab and add:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://farmlink-api.onrender.com/api` |

5. Click **"Create Static Site"**
6. Wait for deployment (3-5 minutes)
7. Your frontend URL: `https://farmlink-app.onrender.com`

---

## 🔧 Step 4: Configure CORS (Important!)

Update `server/index.js` to allow your frontend domain:

```javascript
// Replace this:
app.use(cors());

// With this:
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://farmlink-app.onrender.com',  // Your frontend URL
        /\.onrender\.com$/  // Allow all Render subdomains
    ],
    credentials: true
}));
```

Redeploy the backend after this change.

---

## ✅ Step 5: Test Your Deployment

1. Open `https://farmlink-app.onrender.com`
2. Try to register a new user
3. Login and test features
4. Check browser console for any errors

---

## 🐛 Troubleshooting

### Backend Not Starting
- Check Render logs: Dashboard → Your Service → Logs
- Ensure `PORT` is set (Render sometimes uses its own port)
- Verify MongoDB connection string is correct

### CORS Errors
- Add your frontend URL to the CORS origin array
- Redeploy backend

### API Not Connecting
- Verify `VITE_API_BASE_URL` is correct
- Make sure it ends with `/api`
- Redeploy frontend after changing env vars

### Free Tier Spin Down
- Free services sleep after 15 min of inactivity
- First request after sleep takes 30-60 seconds
- Upgrade to paid tier for always-on

---

## 📊 Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Backend deployed on Render
- [ ] Backend environment variables set
- [ ] Frontend deployed on Render
- [ ] Frontend `VITE_API_BASE_URL` set
- [ ] CORS configured for frontend URL
- [ ] Test registration/login
- [ ] Test all features

---

## 💡 Tips

1. **Custom Domain**: Go to Settings → Custom Domains
2. **Auto Deploy**: Enable auto-deploy from GitHub
3. **Logs**: Check logs for debugging
4. **Upgrade**: Consider paid tier for production

---

## 📱 Your Live URLs

After deployment:
- **Frontend**: `https://farmlink-app.onrender.com`
- **Backend API**: `https://farmlink-api.onrender.com`
- **API Health Check**: `https://farmlink-api.onrender.com/` (should show "Farm Equipment Rental API is running")

---

**Need Help?** Check [Render Docs](https://render.com/docs) or open an issue on GitHub.

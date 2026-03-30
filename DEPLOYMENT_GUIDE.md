# AXIS Deployment Guide

## The Problem

AXIS has **two separate applications**:
- **Frontend** (React) - in `/frontend` folder
- **Backend** (Node.js/Express) - in `/backend` folder

Vercel is designed for **single applications**, which is why you're getting a 404 error.

---

## ⚠️ Important: Vercel Limitations

**Vercel cannot run the full AXIS app as-is because:**
1. SQLite database doesn't work on serverless platforms
2. Express server needs special configuration
3. Separate frontend/backend structure needs adjustment

---

## Solution Options

### Option 1: Deploy Frontend Only on Vercel (Recommended for Demo)

This deploys the **React UI only** - good for showing the interface.

**Steps:**

1. **Create `vercel.json` in AXIS root:**
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/build",
  "framework": "create-react-app",
  "installCommand": "cd frontend && npm install"
}
```

2. **Problem:** Frontend won't work without backend API

3. **Solution:** Deploy backend separately (see Option 3)

---

### Option 2: Deploy Backend Only on Vercel (Advanced)

Deploy the Express API as serverless functions.

**Steps:**

1. **Create `vercel.json` in AXIS root:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    }
  ]
}
```

2. **Problem:** SQLite won't work on Vercel (it's stateless)

3. **Solution:** You need a cloud database (PostgreSQL, MongoDB)

---

### Option 3: Best Solution - Use Different Hosting

For a full-stack app like AXIS with SQLite, use platforms that support persistent storage:

#### **A. Render.com** (Recommended - Free Tier Available)

**Frontend Deployment:**
1. Go to https://render.com
2. Connect your GitHub repository
3. Create "Static Site"
4. Root Directory: `frontend`
5. Build Command: `npm install && npm run build`
6. Publish Directory: `build`

**Backend Deployment:**
1. Create "Web Service"
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables from `.env`

**Note:** Free tier may have limitations, database will persist.

---

#### **B. Railway.app** (Simple, Free Tier)

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Add two services:
   - Frontend (set root to `frontend`)
   - Backend (set root to `backend`)
4. Configure environment variables
5. Database persists automatically

---

#### **C. Heroku** (Requires Credit Card for Free Tier)

**Frontend:**
```bash
cd frontend
heroku create axis-frontend
git push heroku main
```

**Backend:**
```bash
cd backend
heroku create axis-backend
git push heroku main
```

---

#### **D. DigitalOcean App Platform** (Simple, $5/month)

1. Connect GitHub repository
2. Configure as "Web App"
3. Set build/run commands
4. Deploy

---

### Option 4: Quick Fix for Vercel (Frontend Only Demo)

If you just want to show the UI on Vercel:

1. **Update `vercel.json` in AXIS root:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

2. **Run locally:**
```bash
cd frontend
npm run build
```

3. **Redeploy to Vercel**

**Note:** This will only show static UI, no backend functionality.

---

## Recommended Solution for Your Project

Since AXIS uses SQLite and has a backend, I recommend:

### **Use Render.com** (Best for your use case)

**Why?**
- ✅ Free tier available
- ✅ Supports SQLite
- ✅ Easy to deploy both frontend and backend
- ✅ Persistent database storage
- ✅ Good for university projects

**Quick Steps:**

1. **Sign up at render.com**

2. **Deploy Backend:**
   - New → Web Service
   - Connect repository
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables

3. **Deploy Frontend:**
   - New → Static Site
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Publish Directory: `build`

4. **Connect them:**
   - Update frontend to use backend URL
   - Update backend CORS to allow frontend URL

---

## Alternative: Keep It Simple - Video Demo

For a university project, consider:
1. Keep the app running locally
2. Record a video demonstration
3. Upload video to YouTube/Vimeo
4. Share video link instead of deployment

**Benefits:**
- Shows full functionality
- No hosting costs
- No deployment complexity
- Database works perfectly

---

## Summary

| Platform | Frontend | Backend | Database | Cost | Difficulty |
|----------|----------|---------|----------|------|------------|
| **Vercel** | ✅ | ⚠️ Limited | ❌ No SQLite | Free | Medium |
| **Render** | ✅ | ✅ | ✅ SQLite | Free | Easy |
| **Railway** | ✅ | ✅ | ✅ SQLite | Free | Easy |
| **Heroku** | ✅ | ✅ | ⚠️ Addon needed | Free* | Medium |
| **Local + Video** | ✅ | ✅ | ✅ SQLite | Free | Very Easy |

**Recommendation:** Use **Render.com** or keep it **local with video demo**.

---

## Need Help?

If you want to proceed with a specific deployment option, let me know and I can provide detailed step-by-step instructions!

# Deploy AXIS on Render.com - Step-by-Step Guide

## Prerequisites
✅ GitHub account with AXIS repository pushed
✅ AXIS project is committed and pushed to GitHub

---

## Step 1: Sign Up for Render

1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account** (easiest option)
4. Authorize Render to access your repositories

---

## Step 2: Deploy the Backend (API Server)

### 2.1 Create Web Service

1. On Render Dashboard, click **"New +"** button
2. Select **"Web Service"**
3. Connect your GitHub repository:
   - Click **"Connect account"** if not connected
   - Find and select your **AXIS** repository
   - Click **"Connect"**

### 2.2 Configure Backend Service

Fill in the following settings:

| Field | Value |
|-------|-------|
| **Name** | `axis-backend` |
| **Region** | Choose closest to you (e.g., Oregon, Frankfurt) |
| **Root Directory** | `backend` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 2.3 Add Environment Variables

Scroll down to **"Environment Variables"** section and add these:

| Key | Value |
|-----|-------|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `8f4e7c2a9b1d6f3e5a8c7b4d9e2f1a6c3b8d5e7f2a9c6e1b4d8a3f7c2e9b5d1a` |
| `DB_PATH` | `./database/axis.db` |
| `FRONTEND_URL` | (Leave empty for now, we'll update this) |

Click **"Add"** for each variable.

### 2.4 Deploy Backend

1. Click **"Create Web Service"** at the bottom
2. Wait for deployment (3-5 minutes)
3. You'll see logs showing the build process
4. When done, you'll see **"Your service is live"** ✅

### 2.5 Get Backend URL

1. At the top, you'll see your service URL: `https://axis-backend-xxxxx.onrender.com`
2. **Copy this URL** - you'll need it for the frontend!
3. Test it by opening: `https://axis-backend-xxxxx.onrender.com/api/health`
4. You should see: `{"status":"OK","message":"AXIS Backend API is running"}`

### 2.6 Important: Seed the Database

Your backend is running but has no data! You need to seed it:

**Option A: Using Render Shell (Recommended)**
1. In your backend service, click **"Shell"** tab on the left
2. Run: `npm run seed`
3. Wait for "Database seeded successfully!" message

**Option B: Automatic on Deploy**
- Edit `backend/package.json` and add to scripts:
  ```json
  "scripts": {
    "start": "npm run seed && node server.js"
  }
  ```
- Commit and push to GitHub
- Render will auto-redeploy

---

## Step 3: Deploy the Frontend (Website)

### 3.1 Create Static Site

1. On Render Dashboard, click **"New +"** again
2. Select **"Static Site"**
3. Select your **AXIS** repository again

### 3.2 Configure Frontend Service

| Field | Value |
|-------|-------|
| **Name** | `axis-frontend` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `build` |

### 3.3 Add Environment Variable

In the **"Environment Variables"** section:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | Paste your backend URL from Step 2.5 |

Example: `https://axis-backend-xxxxx.onrender.com`

### 3.4 Deploy Frontend

1. Click **"Create Static Site"**
2. Wait for deployment (2-3 minutes)
3. When done, you'll get a URL like: `https://axis-frontend-xxxxx.onrender.com`

---

## Step 4: Connect Frontend to Backend

### 4.1 Update Backend CORS Settings

The backend needs to allow requests from your frontend URL.

**Method 1: Update via Render Dashboard**

1. Go to your **axis-backend** service
2. Click **"Environment"** tab
3. Add/Update this variable:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | Your frontend URL from Step 3.4 |

Example: `https://axis-frontend-xxxxx.onrender.com`

4. Click **"Save Changes"**
5. Backend will auto-redeploy

**Method 2: Update Code (Better)**

1. Edit `backend/server.js` - Update CORS to allow any origin:
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL || '*',
     credentials: true
   }));
   ```

2. Commit and push to GitHub
3. Render auto-deploys

### 4.2 Update Frontend API URL

If you didn't use environment variable, update frontend code:

1. Create `frontend/src/config.js`:
   ```javascript
   const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
   export default API_URL;
   ```

2. Update API calls in frontend to use this URL

3. Commit and push to GitHub

---

## Step 5: Test Your Deployed App

1. Open your frontend URL: `https://axis-frontend-xxxxx.onrender.com`
2. You should see the AXIS landing page
3. Click **"Sign In"**
4. Login with test account:
   - Email: `student@axis.com`
   - Password: `student123`
5. If login works, ✅ **Deployment successful!**

---

## ⚠️ Important Notes

### Free Tier Limitations

**Backend (Web Service):**
- ⚠️ **Spins down after 15 minutes of inactivity**
- First request after sleep takes 30-60 seconds to wake up
- 750 hours/month free
- Database persists (SQLite file stays)

**Frontend (Static Site):**
- ✅ Always on, no sleep
- Free bandwidth: 100GB/month

### Database Persistence

- Your SQLite database is stored on the backend server
- ⚠️ If you delete and recreate the service, database is lost
- **Backup strategy:** Download database periodically via Shell

---

## Troubleshooting

### Frontend can't reach backend

**Symptom:** Login fails, "Network Error"

**Solution:**
1. Check backend is running: Visit `https://axis-backend-xxxxx.onrender.com/api/health`
2. Check CORS settings in backend
3. Check `FRONTEND_URL` environment variable
4. Check browser console for errors

### Backend database is empty

**Symptom:** "No courses found", can't login

**Solution:**
1. Go to backend service → Shell tab
2. Run: `npm run seed`
3. Refresh frontend

### Backend is slow/timeout

**Symptom:** First request takes forever

**Solution:**
- This is normal on free tier (cold start)
- Backend sleeps after 15 minutes inactivity
- First request wakes it up (30-60 seconds)
- Subsequent requests are fast
- **Upgrade to paid tier** ($7/month) to keep it always on

### Build fails

**Symptom:** "Build failed" message

**Solution:**
1. Check build logs for errors
2. Make sure `package.json` is correct
3. Try building locally first: `npm install && npm run build`
4. Check Node version compatibility

---

## Step 6: Custom Domain (Optional)

### Add Your Own Domain

1. Go to your frontend service
2. Click **"Settings"** tab
3. Scroll to **"Custom Domain"**
4. Click **"Add Custom Domain"**
5. Enter your domain: `axis.yourdomain.com`
6. Follow DNS setup instructions
7. Wait for SSL certificate (automatic)

---

## Updating Your App

Every time you push to GitHub:
- ✅ Render automatically redeploys both services
- ✅ No manual steps needed
- ✅ Watch deployment logs in Render dashboard

To disable auto-deploy:
1. Go to service Settings
2. Find "Auto-Deploy"
3. Toggle off

---

## Monitoring Your App

### View Logs

**Backend:**
1. Go to axis-backend service
2. Click **"Logs"** tab
3. See real-time server logs

**Frontend:**
1. Static sites don't have logs
2. Use browser console for errors

### Check Status

- Green dot = Service is running
- Yellow = Deploying
- Red = Service stopped/error

---

## Cost Breakdown

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Backend | 750 hours/month, Spins down | $7/month, Always on |
| Frontend | 100GB bandwidth | $19/month, More bandwidth |
| Database | Included | Included |

**Total Free:** $0/month (with sleep mode)
**Total Paid:** $26/month (always on)

**For university project:** Free tier is perfect! ✅

---

## Quick Reference

### Your URLs

**Backend API:** `https://axis-backend-xxxxx.onrender.com`
**Frontend Site:** `https://axis-frontend-xxxxx.onrender.com`

### Commands in Render Shell

```bash
# Seed database
npm run seed

# Check database
ls -la database/

# View logs
tail -f logs/error.log
```

---

## Need More Help?

**Common Questions:**

**Q: Can I use a real database instead of SQLite?**
A: Yes! Render offers PostgreSQL for free. You'd need to modify the backend code.

**Q: How do I backup my database?**
A: Use Render Shell → `cat database/axis.db > backup.db`, then download.

**Q: Can I deploy backend and frontend together?**
A: Not recommended. Separate services are easier to manage.

**Q: What if I run out of free hours?**
A: Upgrade to paid tier or reduce usage.

---

## Success Checklist

- [ ] Backend deployed and running
- [ ] Backend URL working: `/api/health` returns OK
- [ ] Database seeded with test data
- [ ] Frontend deployed and accessible
- [ ] Frontend can reach backend API
- [ ] Can login with test account
- [ ] Courses and features working

If all checked ✅, **you're done!** 🎉

---

**Your AXIS app is now live on the internet!** 🚀

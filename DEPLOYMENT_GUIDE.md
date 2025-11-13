# 🚀 MediaConverter Deployment Guide

## Table of Contents
1. [Understanding Your Options](#understanding-your-options)
2. [Recommended: Railway Deployment](#option-1-railway-recommended)
3. [Alternative: Render](#option-2-render)
4. [Alternative: Self-Hosting with Coolify](#option-3-self-hosting-with-coolify)
5. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Understanding Your Options

### Option Comparison Table

| Platform | Free Tier | ffmpeg Support | Best For | Difficulty |
|----------|-----------|----------------|----------|------------|
| **Railway** | $5 free credit/month | ✅ Yes | Full-stack apps | ⭐⭐ Easy |
| **Render** | 750 hours/month | ✅ Yes | Backend + static frontend | ⭐⭐ Easy |
| **Fly.io** | 3 VMs free | ✅ Yes | Docker apps | ⭐⭐⭐ Medium |
| **Coolify** | Unlimited (self-hosted) | ✅ Yes | Full control | ⭐⭐⭐⭐ Advanced |

### ⚠️ Important Limitations to Know

**Free tier limitations you'll face:**
- **Processing limits**: Heavy video conversions may timeout (usually 30-60 second limits)
- **Storage**: Temporary files only (good for your app since you auto-delete)
- **Sleep mode**: Apps may sleep after inactivity (30-second wake-up time)
- **Bandwidth**: Limited monthly bandwidth (usually enough for personal use)

---

## Option 1: Railway (Recommended) ⭐

**Why Railway?**
- ✅ Easiest deployment for beginners
- ✅ Built-in ffmpeg and system tools support
- ✅ $5 free credit monthly (~500 hours)
- ✅ Automatic SSL certificates
- ✅ Git-based deployments

### Step-by-Step Railway Deployment

#### Part A: Prepare Your Application

1. **Create Railway configuration file**

Create `railway.json` in your Backend folder:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **Create a startup script**

Create `Backend/package.json` - ensure you have a start script:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

3. **Install yt-dlp on Railway**

Create `Backend/nixpacks.toml`:

```toml
[phases.setup]
aptPkgs = ["ffmpeg", "python3", "python3-pip"]

[phases.install]
cmds = [
  "npm install",
  "pip3 install yt-dlp"
]

[start]
cmd = "node src/server.js"
```

#### Part B: Deploy Backend to Railway

1. **Sign up for Railway**
   - Go to https://railway.app
   - Click "Login with GitHub"
   - Authorize Railway to access your repositories

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `MediaConverter` repository
   - Railway will detect it's a Node.js project

3. **Configure Backend Service**
   ```
   - Root Directory: /Backend
   - Build Command: npm install
   - Start Command: npm start
   - Watch Paths: Backend/**
   ```

4. **Set Environment Variables**

   Click on your service → Variables → Add variables:
   ```
   NODE_ENV=production
   PORT=5000
   ```

5. **Deploy**
   - Railway will automatically build and deploy
   - Wait for deployment to complete (3-5 minutes)
   - Copy your backend URL (looks like: `https://mediaconverter-backend-production.up.railway.app`)

#### Part C: Deploy Frontend

Railway can also host your frontend, but we'll use **Vercel** (better for React apps):

1. **Sign up for Vercel**
   - Go to https://vercel.com
   - Click "Sign Up with GitHub"

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Import your `MediaConverter` repository

3. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Root Directory: Frontend
   Build Command: npm run build
   Output Directory: dist
   ```

4. **Add Environment Variables**

   Add this variable:
   ```
   VITE_API_URL=https://your-railway-backend-url.up.railway.app
   ```

5. **Update Frontend API Configuration**

   You need to update `Frontend/src/apiurls.tsx` to use environment variables:

   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

   const apiUrls = {
     media: {
       convert: `${API_BASE_URL}/api/media/convert`
     },
     playlistinfo: {
       value: `${API_BASE_URL}/api/media/playlist-info`
     },
     documents: {
       convert: `${API_BASE_URL}/api/documents/convert`
     },
     images: {
       convert: `${API_BASE_URL}/api/images/convert`
     }
   }
   ```

6. **Update Backend CORS**

   In `Backend/src/server.js`, update CORS to allow your Vercel domain:

   ```javascript
   app.use(cors({
     origin: [
       process.env.CORS_ORIGIN || 'http://localhost:5173',
       'https://your-app.vercel.app'  // Add your Vercel URL
     ],
     methods: ['GET', 'POST', 'OPTIONS'],
     allowedHeaders: ['Content-Type'],
     exposedHeaders: ['Content-Disposition']
   }))
   ```

7. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Your app will be live at `https://your-app.vercel.app`

#### Part D: Test Your Deployment

1. Visit your Vercel URL
2. Try downloading a short YouTube video (test with videos under 30 seconds first)
3. Check the browser console for any errors

---

## Option 2: Render

**Why Render?**
- ✅ 750 free hours/month
- ✅ Supports ffmpeg natively
- ✅ Both frontend and backend on one platform
- ⚠️ Apps sleep after 15 min of inactivity

### Step-by-Step Render Deployment

#### Part A: Create render.yaml

Create `render.yaml` in your project root:

```yaml
services:
  # Backend Service
  - type: web
    name: mediaconverter-backend
    env: node
    region: oregon
    plan: free
    buildCommand: cd Backend && npm install && pip install yt-dlp
    startCommand: cd Backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    healthCheckPath: /api/health

  # Frontend Service
  - type: web
    name: mediaconverter-frontend
    env: static
    buildCommand: cd Frontend && npm install && npm run build
    staticPublishPath: Frontend/dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

#### Part B: Deploy to Render

1. **Sign up for Render**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Blueprint**
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect `render.yaml`
   - Click "Apply"

3. **Configure Environment Variables**
   - Go to Backend service → Environment
   - Add any additional variables needed

4. **Get Your URLs**
   - Backend: `https://mediaconverter-backend.onrender.com`
   - Frontend: `https://mediaconverter-frontend.onrender.com`

5. **Update Frontend to use Backend URL** (same as Railway Part C, step 5)

6. **Update Backend CORS** (same as Railway Part C, step 6)

---

## Option 3: Self-Hosting with Coolify

**Why Coolify?**
- ✅ Completely free (you pay only for your VPS)
- ✅ Full control over resources
- ✅ No processing time limits
- ✅ Docker-based deployment
- ⚠️ Requires a VPS (DigitalOcean, Hetzner, etc.)
- ⚠️ More technical setup required

### Quick Overview

1. Get a VPS ($5-10/month from Hetzner or DigitalOcean)
2. Install Coolify on your VPS
3. Connect your GitHub repo
4. Deploy with one click

**Detailed Guide**: https://coolify.io/docs

---

## Post-Deployment Checklist

### ✅ Security Checklist

- [ ] Environment variables set correctly (no hardcoded secrets)
- [ ] CORS configured to only allow your frontend domain
- [ ] Rate limiting enabled (optional but recommended)
- [ ] HTTPS enabled (automatic on Railway/Render/Vercel)

### ✅ Performance Checklist

- [ ] Test with short videos first (< 30 seconds)
- [ ] Monitor Railway/Render dashboard for usage limits
- [ ] Set up error logging (console.log goes to platform logs)

### ✅ User Experience Checklist

- [ ] Add loading states for long operations
- [ ] Show error messages when conversions fail
- [ ] Add file size limits on frontend (e.g., max 100MB)
- [ ] Add conversion timeout warnings

---

## Troubleshooting Common Issues

### Issue 1: "yt-dlp: command not found"

**Solution**: Add installation to build script

For Railway, ensure `nixpacks.toml` includes:
```toml
[phases.install]
cmds = ["npm install", "pip3 install yt-dlp"]
```

### Issue 2: "Request timeout" errors

**Cause**: Free tiers have 30-60 second request limits

**Solutions**:
1. Test with shorter videos
2. Upgrade to paid tier for longer timeouts
3. Add frontend timeout warning

### Issue 3: CORS errors

**Solution**: Ensure backend CORS includes your frontend URL:

```javascript
origin: [
  'http://localhost:5173',
  'https://your-vercel-app.vercel.app'
]
```

### Issue 4: App goes to sleep (Render)

**Cause**: Free tier apps sleep after 15 min inactivity

**Solutions**:
1. Use a service like UptimeRobot to ping your app every 10 minutes
2. Show "Waking up..." message on first load
3. Upgrade to paid tier

---

## Recommended Workflow for Beginners

### Start with Railway + Vercel (Easiest)

1. **Week 1**: Deploy backend to Railway
2. **Week 1**: Deploy frontend to Vercel
3. **Week 2**: Test with friends, monitor usage
4. **Week 3-4**: Optimize based on feedback

### Cost Estimates

**Free tier (Railway + Vercel)**:
- Cost: $0/month for first month (Railway $5 credit)
- Suitable for: Testing, personal use, 100-500 requests/month

**If you outgrow free tier**:
- Railway Pro: $5/month + usage
- Vercel Pro: $20/month (usually not needed)
- VPS (Coolify): $5-10/month

---

## Next Steps

1. Choose your deployment platform (I recommend Railway + Vercel to start)
2. Follow the step-by-step guide for your chosen platform
3. Deploy backend first, then frontend
4. Test thoroughly with short videos
5. Share with friends and gather feedback!

## Need Help?

Common resources:
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- GitHub Issues: Post issues in your repo for community help

Good luck with your deployment! 🚀

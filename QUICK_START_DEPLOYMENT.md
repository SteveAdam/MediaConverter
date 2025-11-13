# 🚀 Quick Start - Deploy in 10 Minutes

This guide will get your MediaConverter app deployed as fast as possible using Railway (backend) and Vercel (frontend).

## ⏱️ Estimated Time: 10-15 minutes

---

## Step 1: Deploy Backend to Railway (5 minutes)

### 1.1 Sign Up
1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway

### 1.2 Create Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `MediaConverter` repository
4. Railway will start deploying automatically

### 1.3 Configure Service
1. Click on your deployed service
2. Go to "Settings" tab
3. Set **Root Directory**: `Backend`
4. Railway will automatically detect `nixpacks.toml` and install ffmpeg + yt-dlp

### 1.4 Copy Your Backend URL
1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. Copy the URL (e.g., `https://mediaconverter-production.up.railway.app`)
4. **Save this URL - you'll need it in Step 2!**

### 1.5 Test Backend
Visit: `https://your-railway-url.up.railway.app`

You should see:
```json
{
  "message": "Universal Converter API - Enhanced with Image Support",
  "version": "0.0.3"
}
```

✅ Backend is live!

---

## Step 2: Deploy Frontend to Vercel (5 minutes)

### 2.1 Sign Up
1. Go to https://vercel.com
2. Click "Sign Up with GitHub"
3. Authorize Vercel

### 2.2 Import Project
1. Click "Add New..." → "Project"
2. Find and import your `MediaConverter` repository

### 2.3 Configure Build
1. **Framework Preset**: Vite
2. **Root Directory**: `Frontend`
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `dist` (default)

### 2.4 Add Environment Variable
In the "Environment Variables" section:
- **Name**: `VITE_API_URL`
- **Value**: `https://your-railway-url.up.railway.app` (from Step 1.4)

### 2.5 Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)

---

## Step 3: Connect Frontend to Backend (2 minutes)

### 3.1 Update Backend CORS
1. Go back to Railway dashboard
2. Click on your service → "Variables"
3. Add new variable:
   - **Name**: `CORS_ORIGIN`
   - **Value**: `https://your-app.vercel.app` (from Step 2.5)
4. Click "Add" → Railway will automatically redeploy

### 3.2 Wait for Redeploy
- Railway will redeploy automatically (1-2 minutes)
- Watch the deployment logs to confirm success

---

## Step 4: Test Your App! 🎉

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try these tests:

### Test 1: YouTube Download (Short Video)
- Paste this URL: `https://www.youtube.com/watch?v=jNQXAC9IVRw`
- Format: MP3
- Quality: High
- Click "Convert Media"
- ✅ Should download in 10-30 seconds

### Test 2: File Upload
- Upload a small video or audio file (< 50MB)
- Convert to different format
- ✅ Should convert and download

---

## 🎊 Congratulations!

Your app is now live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-railway-url.up.railway.app`

---

## 📊 Monitor Your Usage

### Railway
- Free tier: $5 credit/month (~500 hours)
- Check usage: Railway Dashboard → Project → Usage

### Vercel
- Free tier: 100 GB bandwidth/month
- Check usage: Vercel Dashboard → Usage

---

## ⚠️ Important Notes

### Free Tier Limitations
1. **Video Length**: Best results with videos < 5 minutes
2. **File Size**: Keep uploads under 100MB
3. **Timeout**: Conversions timeout after 60 seconds on free tier
4. **Sleep Mode**: Railway apps don't sleep, but Render does (if you use Render instead)

### If You Hit Limits
- **Option A**: Upgrade to Railway Pro ($5/month)
- **Option B**: Use shorter videos and smaller files
- **Option C**: Deploy to VPS with Coolify (see full guide)

---

## 🐛 Troubleshooting

### Problem: "Failed to fetch" error
**Solution**: Check CORS_ORIGIN in Railway matches your Vercel URL exactly

### Problem: "yt-dlp: command not found"
**Solution**: Railway should auto-install via `nixpacks.toml`. Check deployment logs.

### Problem: Conversions timeout
**Solution**: Free tier has 60-second limit. Test with shorter videos or upgrade.

### Problem: Video downloads but shows "YouTube Video" instead of title
**Solution**: This is normal on first load. Refresh the page or wait a moment for the API to fetch the title.

---

## 🔄 Making Updates

After deployment, any push to your GitHub repository will:
- ✅ Auto-deploy to Railway (backend)
- ✅ Auto-deploy to Vercel (frontend)

Just commit and push - deployments happen automatically!

---

## 📚 Need More Help?

- **Full Deployment Guide**: See `DEPLOYMENT_GUIDE.md` for detailed instructions
- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs

---

## 🎯 Next Steps

1. Share your app with friends
2. Monitor usage in Railway/Vercel dashboards
3. If you hit limits, consider:
   - Upgrading to paid tiers
   - Optimizing video processing
   - Adding file size limits in the UI

Enjoy your deployed app! 🚀

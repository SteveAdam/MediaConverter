# 🚀 Deploy to Render + Netlify

This guide shows you how to deploy MediaConverter with:
- **Backend on Render** (Docker-based deployment)
- **Frontend on Netlify** (Static site hosting)

Both platforms offer free tiers perfect for getting started!

## 📋 Table of Contents

1. [Why Render + Netlify?](#why-render--netlify)
2. [Prerequisites](#prerequisites)
3. [Part 1: Deploy Backend to Render](#part-1-deploy-backend-to-render-15-minutes)
4. [Part 2: Deploy Frontend to Netlify](#part-2-deploy-frontend-to-netlify-10-minutes)
5. [Part 3: Connect Frontend to Backend](#part-3-connect-them-together-5-minutes)
6. [Testing Your Deployment](#testing-your-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Why Render + Netlify?

### Render (Backend)
- ✅ **Docker support** - Uses your Dockerfile
- ✅ **Free tier**: 750 hours/month
- ✅ **Auto-deploy** from GitHub
- ✅ **Built-in SSL** (HTTPS)
- ✅ **ffmpeg & yt-dlp** work out of the box
- ⚠️ Apps sleep after 15 min of inactivity (30s wake-up)

### Netlify (Frontend)
- ✅ **Free tier**: 100 GB bandwidth/month
- ✅ **Fast CDN** worldwide
- ✅ **Auto-deploy** from GitHub
- ✅ **Built-in SSL** (HTTPS)
- ✅ **Instant cache invalidation**
- ✅ **No sleep** - always fast

---

## Prerequisites

### What You Need

1. **GitHub account** - Your code should be on GitHub
2. **Render account** - Sign up at https://render.com (free)
3. **Netlify account** - Sign up at https://netlify.com (free)
4. **Your MediaConverter repo** pushed to GitHub

### Before You Start

Make sure your latest code is pushed to GitHub:

```bash
cd /path/to/MediaConverter
git add .
git commit -m "Ready for deployment"
git push origin main  # or your branch name
```

---

## Part 1: Deploy Backend to Render (15 minutes)

### Step 1.1: Sign Up for Render

1. Go to https://render.com
2. Click "Get Started for Free"
3. Choose "Sign up with GitHub"
4. Authorize Render to access your repositories

### Step 1.2: Create a New Web Service

1. Click "New +" button in the top right
2. Select "Web Service"
3. Connect your GitHub repository:
   - Click "Connect account" if not connected
   - Search for "MediaConverter"
   - Click "Connect"

### Step 1.3: Configure Your Service

Fill in the following settings:

**Basic Settings:**
```
Name: mediaconverter-backend
Region: Choose closest to you (e.g., Oregon, Frankfurt)
Branch: main (or your deployment branch)
Root Directory: Backend
Runtime: Docker
```

**Important:** Set Root Directory to `Backend` so Render finds your Dockerfile.

**Instance Type:**
```
Free
```

### Step 1.4: Environment Variables

Click "Advanced" and add these environment variables:

```
NODE_ENV = production
PORT = 10000
```

> **Note:** Render uses port 10000 internally, but your Dockerfile's EXPOSE doesn't matter - Render handles this.

Don't set CORS_ORIGIN yet - we'll add it after deploying the frontend.

### Step 1.5: Deploy!

1. Click "Create Web Service"
2. Render will start building your Docker image
3. This takes 5-10 minutes (first deploy is slow)
4. Watch the logs - you should see:
   ```
   Installing system dependencies...
   Installing ffmpeg, python3...
   Installing yt-dlp...
   npm install...
   Starting server...
   ```

### Step 1.6: Get Your Backend URL

Once deployed, you'll see a URL like:
```
https://mediaconverter-backend.onrender.com
```

**Save this URL!** You'll need it for the frontend.

### Step 1.7: Test Your Backend

Visit: `https://mediaconverter-backend.onrender.com`

You should see:
```json
{
  "message": "Universal Converter API - Enhanced with Image Support",
  "version": "0.0.3",
  ...
}
```

✅ **Backend is live!**

---

## Part 2: Deploy Frontend to Netlify (10 minutes)

### Step 2.1: Sign Up for Netlify

1. Go to https://netlify.com
2. Click "Sign up"
3. Choose "Sign up with GitHub"
4. Authorize Netlify

### Step 2.2: Create a New Site

1. Click "Add new site" → "Import an existing project"
2. Choose "Deploy with GitHub"
3. Authorize Netlify (if needed)
4. Select your "MediaConverter" repository

### Step 2.3: Configure Build Settings

**Site Settings:**
```
Branch to deploy: main
Base directory: Frontend
Build command: npm run build
Publish directory: Frontend/dist
```

### Step 2.4: Add Environment Variable

This is **CRITICAL** - your frontend needs to know where the backend is.

Click "Show advanced" → "New variable"

```
Key: VITE_API_URL
Value: https://mediaconverter-backend.onrender.com
```

Replace with your actual Render URL from Part 1, Step 1.6.

### Step 2.5: Deploy Site

1. Click "Deploy mediaconverter" (or similar button)
2. Netlify will build and deploy (2-3 minutes)
3. Watch the deploy logs

### Step 2.6: Get Your Frontend URL

Once deployed, you'll see a URL like:
```
https://keen-kitsune-123abc.netlify.app
```

You can customize this later.

**Save this URL!** You need it for CORS configuration.

### Step 2.7: Optional - Custom Domain

To use a custom domain like `mediaconverter.com`:

1. Go to "Domain settings"
2. Click "Add custom domain"
3. Follow the instructions to point your DNS to Netlify

---

## Part 3: Connect Them Together (5 minutes)

Now we need to tell the backend to allow requests from your frontend.

### Step 3.1: Update Backend CORS

1. Go back to Render Dashboard
2. Click on your "mediaconverter-backend" service
3. Go to "Environment" tab
4. Click "Add Environment Variable"

Add:
```
Key: CORS_ORIGIN
Value: https://your-netlify-url.netlify.app
```

Replace with your actual Netlify URL from Part 2, Step 2.6.

### Step 3.2: Redeploy Backend

1. Render should automatically redeploy after adding the env variable
2. If not, click "Manual Deploy" → "Deploy latest commit"
3. Wait 2-3 minutes for redeployment

---

## Testing Your Deployment

### Test 1: Access Your App

Open your Netlify URL: `https://your-app.netlify.app`

You should see the MediaConverter interface.

### Test 2: Download a Short YouTube Video

1. Paste this test URL: `https://www.youtube.com/watch?v=jNQXAC9IVRw`
2. Select format: MP3
3. Quality: High
4. Click "Convert Media"

**Expected:**
- Loading spinner shows
- Download starts after 10-30 seconds
- File downloads successfully

✅ **If this works, your deployment is successful!**

### Test 3: Check the Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try downloading again
4. You should see API requests to your Render backend
5. No CORS errors

---

## Post-Deployment Configuration

### Customize Your Netlify URL

1. Go to Netlify Dashboard → Your site
2. Click "Site settings" → "Change site name"
3. Choose a better name: `mediaconverter` → `mediaconverter.netlify.app`

### Enable Render Auto-Deploy

Render automatically deploys when you push to GitHub. To verify:

1. Go to Render Dashboard → Your service
2. Settings → "Auto-Deploy": Should be "Yes"

### Monitor Your Usage

**Render:**
- Free tier: 750 hours/month
- Check usage: Dashboard → Usage

**Netlify:**
- Free tier: 100 GB bandwidth/month
- Check usage: Billing → Usage

---

## Understanding Free Tier Limitations

### Render Limitations

**Sleep Behavior:**
- ✅ App sleeps after 15 minutes of inactivity
- ✅ Wakes up on first request (takes 30-60 seconds)
- ✅ After wake-up, works normally

**Solution:** Use a service like UptimeRobot (free) to ping your app every 10 minutes.

**Timeout:**
- ✅ Free tier: 60 second request timeout
- ✅ Good for: Videos under 5-7 minutes
- ⚠️ May timeout: Very long videos or large files

**Solution:** Test with shorter videos, or upgrade to paid tier ($7/month) for longer timeouts.

### Netlify Limitations

**Bandwidth:**
- ✅ 100 GB/month on free tier
- ✅ Plenty for personal use and friends

**Build Minutes:**
- ✅ 300 build minutes/month
- ✅ Each deploy takes ~2 minutes
- ✅ That's ~150 deploys/month

---

## Monitoring and Logs

### View Backend Logs (Render)

1. Go to Render Dashboard
2. Click your service
3. Click "Logs" tab
4. See real-time logs of all requests and errors

### View Frontend Deployment Logs (Netlify)

1. Go to Netlify Dashboard
2. Click your site
3. Click "Deploys"
4. Click any deploy to see build logs

### Set Up Alerts

**Render:**
- Settings → Notifications
- Get email when deploys fail

**Netlify:**
- Site settings → Build & deploy → Deploy notifications
- Email notifications for failed builds

---

## Troubleshooting

### Issue 1: "Failed to fetch" Error

**Symptom:** Frontend shows "Failed to fetch" when trying to convert

**Causes:**
1. Backend is sleeping (first request after inactivity)
2. CORS not configured correctly
3. Backend crashed

**Solutions:**

1. **Check if backend is sleeping:**
   - Visit backend URL directly: `https://your-backend.onrender.com`
   - Wait 30-60 seconds for wake-up
   - Try frontend again

2. **Verify CORS:**
   - Check Render env variables include correct `CORS_ORIGIN`
   - Make sure it matches your Netlify URL exactly
   - Include protocol: `https://` not `http://`

3. **Check backend logs:**
   - Render Dashboard → Logs
   - Look for errors or crashes

### Issue 2: Video Conversion Timeout

**Symptom:** Long videos fail with timeout error

**Cause:** Free tier has 60-second timeout

**Solutions:**
1. Use shorter videos (< 5 minutes)
2. Choose lower quality/resolution
3. Upgrade to Render Standard ($7/month) for longer timeout

### Issue 3: yt-dlp Errors

**Symptom:** "Unable to download video" errors

**Causes:**
1. YouTube changed their API
2. yt-dlp needs updating
3. Video is region-locked or private

**Solutions:**

1. **Update yt-dlp:**

   Your Dockerfile already installs latest version, but you can force update:

   ```dockerfile
   # In Backend/Dockerfile
   RUN pip3 install --break-system-packages -U yt-dlp
   ```

   Then redeploy: `git commit` and `git push`

2. **Check video URL:**
   - Try a different video
   - Make sure URL is valid
   - Check if video is publicly accessible

### Issue 4: Frontend Not Updating

**Symptom:** Changes to frontend code don't appear on deployed site

**Cause:** Browser cache or Netlify CDN cache

**Solutions:**

1. **Clear Netlify cache:**
   - Netlify Dashboard → Deploys
   - Trigger deploy → "Clear cache and deploy site"

2. **Force browser refresh:**
   - Chrome/Edge: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
   - Firefox: Ctrl + F5

3. **Check build logs:**
   - Make sure build succeeded
   - Check for build errors in Netlify logs

### Issue 5: Backend Build Fails

**Symptom:** Render deploy fails during build

**Causes:**
1. Dockerfile error
2. Missing dependencies
3. Out of memory

**Solutions:**

1. **Check build logs in Render**
2. **Verify Dockerfile works locally:**
   ```bash
   cd Backend
   docker build -t test .
   ```
3. **Check Root Directory setting:** Should be `Backend`

### Issue 6: Environment Variables Not Working

**Symptom:** App works locally but not in production

**Cause:** Environment variables not set correctly

**Solutions:**

1. **Check variables in Render:**
   - Environment tab
   - Verify `NODE_ENV`, `PORT`, `CORS_ORIGIN`

2. **Check variables in Netlify:**
   - Site settings → Environment variables
   - Verify `VITE_API_URL`

3. **Redeploy after changing variables:**
   - Both platforms should auto-redeploy
   - If not, trigger manual deploy

---

## Keeping Your App Online (Avoiding Sleep)

Free tier apps sleep after 15 minutes of inactivity. Here's how to keep them awake:

### Option 1: UptimeRobot (Free)

1. Sign up at https://uptimerobot.com (free)
2. Add new monitor:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: MediaConverter Backend
   URL: https://your-backend.onrender.com/api/health
   Monitoring Interval: 5 minutes
   ```
3. UptimeRobot will ping your backend every 5 minutes
4. Your app stays awake!

### Option 2: Cron-job.org (Free)

1. Go to https://cron-job.org
2. Create free account
3. Create new cron job:
   ```
   Title: Keep MediaConverter Awake
   URL: https://your-backend.onrender.com/api/health
   Schedule: Every 10 minutes
   ```

### Option 3: Upgrade to Paid Tier

Render Standard ($7/month):
- ✅ No sleep
- ✅ Longer timeouts
- ✅ More resources
- ✅ Better performance

---

## Next Steps

### 1. Customize Your Deployment

**Change Netlify Domain:**
- Site settings → Domain management → Options → Change site name

**Add Custom Domain:**
- Buy domain from Namecheap, Google Domains, etc.
- Point DNS to Netlify
- Free SSL certificate automatically generated

### 2. Monitor Performance

Set up monitoring:
- Backend response times (Render dashboard)
- Error rates (check logs)
- User traffic (Netlify analytics - paid feature)

### 3. Optimize for Production

**Add Rate Limiting:**
Edit `Backend/src/server.js` to add rate limiting:

```javascript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

app.use('/api/', limiter)
```

**Add Analytics:**
Use Netlify Analytics or Google Analytics to track usage.

### 4. Share Your App!

Your app is now live! Share it with:
- Friends and family
- Social media
- Your portfolio

---

## Cost Breakdown

### Staying on Free Tier

**Render Backend:**
- Cost: $0/month
- Limitations: Sleep after 15 min, 60s timeout
- Good for: Personal use, testing

**Netlify Frontend:**
- Cost: $0/month
- Limitations: 100 GB bandwidth, 300 build minutes
- Good for: Personal use, moderate traffic

**Total: $0/month** ✅

### If You Outgrow Free Tier

**Render Standard:**
- Cost: $7/month
- Benefits: No sleep, longer timeout, more resources

**Netlify Pro (usually not needed):**
- Cost: $19/month
- Benefits: More bandwidth, analytics, support

**Estimated for moderate usage: $7/month**

---

## Maintenance

### Updating Your App

Just push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main
```

Both Render and Netlify will automatically deploy! 🎉

### Keeping Dependencies Updated

Monthly maintenance:

```bash
# Update yt-dlp (already in Dockerfile)
# Update npm packages
cd Backend && npm update
cd Frontend && npm update

# Test locally with Docker
docker-compose up --build

# If everything works, commit and push
git add .
git commit -m "Update dependencies"
git push
```

---

## Success! 🎉

Your MediaConverter app is now live on the internet!

- **Frontend**: https://your-app.netlify.app
- **Backend**: https://your-backend.onrender.com

### What You Achieved:

✅ Containerized your app with Docker
✅ Deployed backend to Render with auto-deploy
✅ Deployed frontend to Netlify with CDN
✅ Configured CORS and environment variables
✅ Set up automatic deployments from GitHub
✅ Got free SSL certificates (HTTPS)

### Share Your Success!

Tweet about it, add it to your portfolio, or share with the community!

---

## Additional Resources

**Render Documentation:**
- https://render.com/docs
- https://render.com/docs/docker
- https://render.com/docs/free

**Netlify Documentation:**
- https://docs.netlify.com
- https://docs.netlify.com/configure-builds/environment-variables
- https://docs.netlify.com/domains-https/custom-domains

**Docker:**
- See `DOCKER_GUIDE.md` in your repository

**Need Help?**
- Render Community: https://community.render.com
- Netlify Community: https://answers.netlify.com

Good luck with your deployment! 🚀

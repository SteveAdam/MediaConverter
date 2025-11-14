# 🚀 Getting Started with MediaConverter

Welcome! This guide will help you get your MediaConverter app running locally with Docker and deployed to the web.

## 📋 Quick Navigation

Choose your path:

### 🐳 Run Locally with Docker (5 minutes)
Perfect for testing and development. Run the entire app with one command!

👉 **[Jump to Docker Quick Start](#docker-quick-start)**

### 🌐 Deploy to the Web (30 minutes)
Get your app online with free hosting on Render + Netlify.

👉 **[Jump to Deployment Guide](#deploy-to-render--netlify)**

---

## 🐳 Docker Quick Start

### Prerequisites

You need Docker installed on your computer.

**Check if you have Docker:**
```bash
docker --version
docker-compose --version
```

**Don't have Docker?**
- **Windows/Mac**: Download Docker Desktop from https://www.docker.com/products/docker-desktop
- **Linux**: `sudo apt-get install docker.io docker-compose`

### Run Your App (One Command!)

1. **Open terminal in the project directory:**
   ```bash
   cd /path/to/MediaConverter
   ```

2. **Start everything:**
   ```bash
   docker-compose up --build
   ```

   This command:
   - ✅ Builds Docker images for frontend and backend
   - ✅ Installs all dependencies (Node.js, ffmpeg, yt-dlp)
   - ✅ Starts both services
   - ✅ Sets up networking

3. **Access your app:**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000

4. **Stop the app:**
   Press `Ctrl+C`, then:
   ```bash
   docker-compose down
   ```

### Need More Help with Docker?

See the comprehensive guide: **[DOCKER_GUIDE.md](DOCKER_GUIDE.md)**

It covers:
- ✅ Detailed Docker installation
- ✅ Building images separately
- ✅ Docker commands reference
- ✅ Troubleshooting
- ✅ Performance tips

---

## 🌐 Deploy to Render + Netlify

Ready to put your app on the internet? Follow this path:

### Why Render + Netlify?

- ✅ **Both have FREE tiers** - No credit card required
- ✅ **Docker support** - Your Dockerfile works directly on Render
- ✅ **Auto-deploy** - Push to GitHub = automatic deployment
- ✅ **Built-in SSL** - Free HTTPS certificates
- ✅ **Easy setup** - Beginner-friendly dashboards

### Deployment Steps

**Estimated time: 30 minutes**

1. **Backend to Render** (15 min)
   - Sign up with GitHub
   - Connect repository
   - Set root directory to `Backend`
   - Render builds your Docker image automatically
   - Get your backend URL

2. **Frontend to Netlify** (10 min)
   - Sign up with GitHub
   - Import repository
   - Set base directory to `Frontend`
   - Add API URL environment variable
   - Get your frontend URL

3. **Connect them** (5 min)
   - Add CORS configuration
   - Test your app!

### Complete Deployment Guide

Follow the step-by-step guide: **[RENDER_NETLIFY_DEPLOYMENT.md](RENDER_NETLIFY_DEPLOYMENT.md)**

It includes:
- ✅ Detailed screenshots and instructions
- ✅ Environment variable configuration
- ✅ CORS setup
- ✅ Testing procedures
- ✅ Free tier limitations and solutions
- ✅ How to keep your app awake
- ✅ Troubleshooting section

---

## 📚 All Documentation

Your MediaConverter project includes comprehensive documentation:

### Docker Documentation
- **[DOCKER_GUIDE.md](DOCKER_GUIDE.md)** - Complete Docker usage guide
  - Installation and setup
  - Running containers
  - Docker commands reference
  - Troubleshooting

### Deployment Documentation
- **[RENDER_NETLIFY_DEPLOYMENT.md](RENDER_NETLIFY_DEPLOYMENT.md)** - Deploy to Render + Netlify
  - Step-by-step deployment
  - Environment configuration
  - Free tier optimization
  - Monitoring and maintenance

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Alternative deployment options
  - Railway + Vercel
  - Render
  - Self-hosting with Coolify

- **[QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)** - 10-minute Railway + Vercel guide

### Configuration Files
- **[Backend/.env.example](Backend/.env.example)** - Backend environment variables template
- **[Frontend/.env.example](Frontend/.env.example)** - Frontend environment variables template

---

## 🎯 Recommended Learning Path

### For Beginners:

1. **Start with Docker locally** (Today)
   - Install Docker Desktop
   - Run `docker-compose up --build`
   - Test the app at http://localhost
   - Try converting a few videos

2. **Deploy to the web** (This weekend)
   - Follow RENDER_NETLIFY_DEPLOYMENT.md
   - Deploy backend to Render
   - Deploy frontend to Netlify
   - Share with friends!

3. **Customize and improve** (Next week)
   - Add your own features
   - Customize the UI
   - Monitor usage
   - Optimize performance

---

## ⚡ Quick Commands Reference

### Docker Commands

```bash
# Start everything
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Rebuild and restart
docker-compose up --build --force-recreate
```

### Development Workflow

```bash
# Make code changes
# ...

# Rebuild and test
docker-compose up --build

# If it works, commit and push
git add .
git commit -m "Your changes"
git push

# Render and Netlify auto-deploy! 🎉
```

---

## 🆘 Getting Help

### Common Issues

**"Port already in use"**
- Stop other services using port 5000 or 80
- Or change ports in docker-compose.yml

**"Cannot connect to Docker daemon"**
- Make sure Docker Desktop is running
- Linux: `sudo systemctl start docker`

**"Out of disk space"**
- Clean up Docker: `docker system prune -a`

**"Frontend can't reach backend"**
- Check CORS_ORIGIN environment variable
- Make sure both containers are running: `docker ps`

### More Help

- **Docker issues**: See [DOCKER_GUIDE.md](DOCKER_GUIDE.md) → Troubleshooting
- **Deployment issues**: See [RENDER_NETLIFY_DEPLOYMENT.md](RENDER_NETLIFY_DEPLOYMENT.md) → Troubleshooting
- **Check logs**: `docker-compose logs backend` or `docker-compose logs frontend`

---

## 🎉 What's Next?

Once you have your app running:

### Local Development
- Modify the code
- Test changes with Docker
- Commit when ready

### Production Deployment
- Deploy to Render + Netlify
- Monitor free tier usage
- Keep app awake with UptimeRobot
- Add custom domain (optional)

### Improvements
- Add new features
- Improve UI/UX
- Add analytics
- Optimize performance
- Add rate limiting

---

## 📊 Your Tech Stack

**Frontend:**
- ⚛️ React with TypeScript
- ⚡ Vite (build tool)
- 🎨 Tailwind CSS
- 🌐 Deployed on Netlify

**Backend:**
- 🟢 Node.js with Express
- 🎬 ffmpeg for video processing
- 📺 yt-dlp for YouTube downloads
- 🐳 Docker containerized
- 🌐 Deployed on Render

**Infrastructure:**
- 🐳 Docker & Docker Compose
- 🔄 Git & GitHub
- 🚀 CI/CD with auto-deploy
- 🔒 Free SSL certificates
- 🌍 Global CDN (Netlify)

---

## ✅ Success Checklist

Before deploying, make sure:

- [ ] Docker runs locally: `docker-compose up`
- [ ] Can access frontend at http://localhost
- [ ] Can access backend at http://localhost:5000
- [ ] Video conversion works
- [ ] YouTube downloads work
- [ ] No errors in console
- [ ] Latest code pushed to GitHub

---

## 🎓 Learn More

### Docker
- Official docs: https://docs.docker.com
- Docker Compose: https://docs.docker.com/compose

### Render
- Docs: https://render.com/docs
- Docker on Render: https://render.com/docs/docker

### Netlify
- Docs: https://docs.netlify.com
- Environment variables: https://docs.netlify.com/configure-builds/environment-variables

---

## 💡 Pro Tips

1. **Start simple** - Run with Docker locally first
2. **Test thoroughly** - Make sure everything works before deploying
3. **Read the logs** - Most issues are obvious in the logs
4. **Use free monitoring** - UptimeRobot keeps your app awake
5. **Start with free tiers** - Only upgrade if you need more resources

---

## 🏁 Ready to Start?

Choose your adventure:

**Running locally?** → Open terminal → `docker-compose up --build`

**Deploying to web?** → Read [RENDER_NETLIFY_DEPLOYMENT.md](RENDER_NETLIFY_DEPLOYMENT.md)

**Need Docker help?** → See [DOCKER_GUIDE.md](DOCKER_GUIDE.md)

Good luck! 🚀

---

## 📞 Support

If you run into issues:
1. Check the troubleshooting sections in the guides
2. Review Docker/Render/Netlify logs
3. Search the error message online
4. Ask in Render/Netlify community forums

Remember: Everyone was a beginner once. Take it step by step! 💪

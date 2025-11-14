# 🐳 Docker Guide for MediaConverter

This guide will help you run MediaConverter using Docker. Docker allows you to run the application in isolated containers with all dependencies included.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start with Docker Compose](#quick-start-with-docker-compose)
3. [Building Individual Images](#building-individual-images)
4. [Running Containers](#running-containers)
5. [Docker Commands Reference](#docker-commands-reference)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Install Docker

**Windows/Mac:**
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Verify installation: Open terminal and run `docker --version`

**Linux (Ubuntu/Debian):**
```bash
# Update package index
sudo apt-get update

# Install Docker
sudo apt-get install docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Log out and log back in for group changes to take effect
```

**Verify Docker Installation:**
```bash
docker --version
docker-compose --version
```

You should see version numbers like:
```
Docker version 24.0.x
docker-compose version 1.29.x or v2.x.x
```

---

## Quick Start with Docker Compose

The easiest way to run both frontend and backend together.

### Step 1: Navigate to Project Directory

```bash
cd /path/to/MediaConverter
```

### Step 2: Build and Start All Services

```bash
docker-compose up --build
```

This command will:
- ✅ Build Docker images for both frontend and backend
- ✅ Start both containers
- ✅ Set up networking between them
- ✅ Show logs from both services

### Step 3: Access the Application

Open your browser and go to:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

### Step 4: Stop the Application

Press `Ctrl+C` in the terminal, then run:

```bash
docker-compose down
```

To also remove volumes (clears uploaded/downloaded files):

```bash
docker-compose down -v
```

---

## Running in Background (Detached Mode)

To run containers in the background:

```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

---

## Building Individual Images

If you want to build frontend and backend separately:

### Build Backend Image

```bash
cd Backend
docker build -t mediaconverter-backend .
```

### Build Frontend Image

```bash
cd Frontend
docker build -t mediaconverter-frontend --build-arg VITE_API_URL=http://localhost:5000 .
```

---

## Running Containers Individually

### Run Backend Container

```bash
docker run -d \
  --name mediaconverter-backend \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e CORS_ORIGIN=http://localhost \
  mediaconverter-backend
```

### Run Frontend Container

```bash
docker run -d \
  --name mediaconverter-frontend \
  -p 80:80 \
  mediaconverter-frontend
```

### Check Running Containers

```bash
docker ps
```

### View Container Logs

```bash
# Backend logs
docker logs -f mediaconverter-backend

# Frontend logs
docker logs -f mediaconverter-frontend
```

### Stop and Remove Containers

```bash
# Stop containers
docker stop mediaconverter-backend mediaconverter-frontend

# Remove containers
docker rm mediaconverter-backend mediaconverter-frontend
```

---

## Docker Commands Reference

### Essential Commands

```bash
# List all containers (running and stopped)
docker ps -a

# List all images
docker images

# Remove a container
docker rm <container-id>

# Remove an image
docker rmi <image-id>

# View container logs
docker logs <container-id>

# Execute command inside running container
docker exec -it <container-id> /bin/bash

# Stop all running containers
docker stop $(docker ps -q)

# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# View disk usage
docker system df

# Clean up everything (use with caution!)
docker system prune -a --volumes
```

### Docker Compose Commands

```bash
# Build or rebuild services
docker-compose build

# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Scale a service (run multiple instances)
docker-compose up -d --scale backend=3
```

---

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `Backend` directory:

```env
NODE_ENV=production
PORT=5000
CORS_ORIGIN=http://localhost
```

### Frontend Environment Variables

Pass during build:

```bash
docker build -t mediaconverter-frontend \
  --build-arg VITE_API_URL=http://localhost:5000 \
  ./Frontend
```

Or update `docker-compose.yml`:

```yaml
frontend:
  build:
    context: ./Frontend
    args:
      - VITE_API_URL=http://your-backend-url.com
```

---

## Troubleshooting

### Issue 1: Port Already in Use

**Error:** `Bind for 0.0.0.0:5000 failed: port is already allocated`

**Solution:**

```bash
# Find process using the port
sudo lsof -i :5000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or change the port in docker-compose.yml
ports:
  - "5001:5000"  # Use 5001 instead of 5000
```

### Issue 2: Cannot Connect to Backend from Frontend

**Problem:** Frontend can't reach backend API

**Solution:**

1. Check if backend container is running:
   ```bash
   docker ps | grep backend
   ```

2. Check backend logs:
   ```bash
   docker logs mediaconverter-backend
   ```

3. Verify CORS settings in `Backend/src/server.js`

4. If running with docker-compose, containers can communicate using service names:
   ```
   Backend URL: http://backend:5000
   ```

### Issue 3: ffmpeg or yt-dlp Not Found

**Problem:** "command not found" errors

**Solution:**

This shouldn't happen with Docker, but if it does:

1. Rebuild the image:
   ```bash
   docker-compose build --no-cache backend
   ```

2. Verify the Dockerfile includes installation steps

### Issue 4: Out of Disk Space

**Problem:** Docker is using too much disk space

**Solution:**

```bash
# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a

# Remove specific volumes
docker volume ls
docker volume rm <volume-name>
```

### Issue 5: Container Keeps Restarting

**Problem:** Container restarts repeatedly

**Solution:**

```bash
# Check container logs
docker logs <container-name>

# Check container status
docker inspect <container-name>

# Run container interactively for debugging
docker run -it mediaconverter-backend /bin/bash
```

### Issue 6: Build Fails with "ENOSPC" Error

**Problem:** Not enough disk space during build

**Solution:**

```bash
# Clean up Docker system
docker system prune -a --volumes

# Free up disk space on your machine
```

---

## Performance Tips

### 1. Use .dockerignore

We've already created `.dockerignore` files to exclude unnecessary files from builds. This speeds up builds significantly.

### 2. Multi-stage Builds

The frontend uses multi-stage builds to keep the final image small:
- Build stage: ~1GB
- Final image: ~25MB

### 3. Layer Caching

Docker caches layers. Put things that change less often (like dependencies) before things that change often (like source code).

Our Dockerfiles are already optimized for this.

### 4. Volume Mounting for Development

For development, mount your source code as a volume to see changes without rebuilding:

```yaml
services:
  backend:
    volumes:
      - ./Backend:/app
      - /app/node_modules  # Don't overwrite node_modules
```

---

## Advanced: Custom Docker Network

To use a custom network:

```bash
# Create network
docker network create mediaconverter-net

# Run backend on this network
docker run -d \
  --name backend \
  --network mediaconverter-net \
  -p 5000:5000 \
  mediaconverter-backend

# Run frontend on same network
docker run -d \
  --name frontend \
  --network mediaconverter-net \
  -p 80:80 \
  -e VITE_API_URL=http://backend:5000 \
  mediaconverter-frontend
```

---

## Production Considerations

When deploying to production:

1. **Use specific versions** in Dockerfile (not `node:20-slim` but `node:20.11.0-slim`)
2. **Set resource limits:**
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '1.0'
             memory: 512M
   ```
3. **Use secrets for sensitive data** (not environment variables)
4. **Enable HTTPS** with a reverse proxy (nginx, Traefik)
5. **Set up monitoring** and logging

---

## Next Steps

Now that you have Docker working locally:

1. ✅ Test the application thoroughly
2. ✅ Make sure conversions work as expected
3. ✅ Try different video formats and sizes
4. ✅ Check logs for any errors

Ready to deploy? Check out:
- `RENDER_NETLIFY_DEPLOYMENT.md` - Deploy to Render + Netlify
- `DEPLOYMENT_GUIDE.md` - Other deployment options

---

## Useful Resources

- **Docker Documentation**: https://docs.docker.com
- **Docker Compose Docs**: https://docs.docker.com/compose
- **Best Practices**: https://docs.docker.com/develop/dev-best-practices
- **Docker Hub** (find images): https://hub.docker.com

Happy Dockerizing! 🐳

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

// Import routes
import healthRoutes from './routes/health.js'
import mediaRoutes from './routes/media.js'
import documentRoutes from './routes/documents.js'
import imageRoutes from './routes/images.js'

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { setupDirectories } from './utils/directories.js'
import { gracefulShutdown } from './utils/shutdown.js'

// Load environment variables
dotenv.config()

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize directories
await setupDirectories()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", process.env.CORS_ORIGIN, `http://localhost:${process.env.PORT || 5000}`],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  exposedHeaders: ['Content-Disposition'], // Allow frontend to read filename from response
}))

app.use(express.json())

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Universal Converter API - Enhanced with Image Support',
    version: '0.0.3',
    features: [
      'YouTube Video/Playlist Downloads',
      'High Quality Media Conversion',
      'Document Processing',
      'Image Format Conversion'
    ],
    endpoints: {
      'GET /api/health': 'Health check and system status',
      'POST /api/media/convert': 'Convert YouTube videos/playlists or uploaded media to MP3/MP4',
      'POST /api/media/playlist-info': 'Get playlist information',
      'POST /api/documents/convert': 'Convert documents between formats (PDF, DOCX, PPTX, etc.)',
      'POST /api/images/convert': 'Convert images between formats (JPEG, PNG, WebP, AVIF, etc.)',
    }
  })
})

// Routes
app.use('/api/health', healthRoutes)
app.use('/api/media', mediaRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/images', imageRoutes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Graceful shutdown handlers
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Enhanced Universal Converter API running on http://localhost:${PORT}`)
  console.log('🎥 YouTube Video & Playlist Support')
  console.log('📁 Supported media formats: MP3, MP4 (High Quality)')
  console.log('🖼️ Supported image formats: JPEG, PNG, WebP, AVIF, TIFF, BMP, GIF, ICO')
  console.log('📄 Supported document formats: PDF, DOCX, PPTX, and more')
  console.log('✨ Features: Enhanced Quality, Playlist Downloads, Batch Processing, Image Resizing')
})

export default app
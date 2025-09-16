import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

export const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // File upload configuration
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024, // 500MB
  maxFiles: parseInt(process.env.MAX_FILES) || 20,
  
  // Directory paths
  directories: {
    uploads: path.join(projectRoot, process.env.UPLOADS_DIR || 'uploads'),
    downloads: path.join(projectRoot, process.env.DOWNLOADS_DIR || 'downloads'),
    temp: path.join(projectRoot, process.env.TEMP_DIR || 'temp'),
  },
  
  // Quality settings
  defaultVideoQuality: process.env.DEFAULT_VIDEO_QUALITY || 'high',
  defaultAudioQuality: process.env.DEFAULT_AUDIO_QUALITY || 'high',
  defaultImageQuality: parseInt(process.env.DEFAULT_IMAGE_QUALITY) || 90,
  
  // Supported formats
  supportedImageFormats: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.svg', '.ico', '.avif', '.heic', '.heif'],
  supportedDocumentFormats: ['.pdf', '.docx', '.pptx', '.xlsx', '.odt', '.txt'],
  
  // FFmpeg path
  ffmpegPath: process.env.FFMPEG_PATH || 'auto'
}
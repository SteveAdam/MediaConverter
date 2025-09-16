import sharp from 'sharp'
import ffmpegPath from 'ffmpeg-static'
import { checkYtDlp } from '../services/youtubeService.js'

export const getHealthStatus = async (req, res) => {
  try {
    const ytdlpAvailable = await checkYtDlp()

    res.json({
      status: 'OK',
      message: 'Enhanced Universal Converter Server with Image Support',
      timestamp: new Date().toISOString(),
      services: {
        ytdlp: ytdlpAvailable,
        ffmpeg: !!ffmpegPath,
        libreoffice: true,
        sharp: sharp ? sharp.versions : 'Not available',
        playlistSupport: 'Enabled',
        enhancedQuality: true,
        imageConversion: true
      }
    })
  } catch (error) {
    console.error('Health check error:', error)
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message
    })
  }
}
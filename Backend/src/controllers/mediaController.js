import path from 'path'
import { config } from '../config/index.js'
import { processFileUpload, processYouTubeUrl} from '../services/mediaService.js'
import { getPlaylistInfo as getPlaylistInfoService, isPlaylist } from '../services/youtubeService.js'
import { createZipFile } from '../services/fileService.js'
import { cleanupFiles } from '../utils/cleanup.js'

// Helper function to sanitize filenames for safe download
const sanitizeFilename = (filename) => {
  return filename.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').substring(0, 100)
}

export const convertMedia = async (req, res) => {
  console.log('=== Enhanced Media Conversion Request ===')
  console.log('Body:', req.body)
  console.log('File:', req.file ? req.file.originalname : 'None')

  const { url, format, resolution, quality = config.defaultVideoQuality, downloadPlaylist } = req.body

  // Convert string 'false'/'true' to boolean
  const shouldDownloadPlaylist = downloadPlaylist === 'true' || downloadPlaylist === true
  let inputPath = null
  let outputPaths = []

  try {
    const timestamp = Date.now()

    if (req.file) {
      // Handle file upload conversion
      console.log('Processing uploaded file with enhanced quality...')
      inputPath = req.file.path
      const outputPath = await processFileUpload(inputPath, format, resolution, quality, req.file.originalname || 'file')
      outputPaths.push(outputPath)
    } else if (url) {
      // Handle YouTube URL download
      console.log('Processing YouTube URL:', url)
      outputPaths = await processYouTubeUrl(url, format, resolution, quality, shouldDownloadPlaylist, timestamp)
    } else {
      return res.status(400).json({
        error: 'Missing input',
        message: 'Either provide a file upload or YouTube URL'
      })
    }

    // Handle response based on number of files
    if (outputPaths.length === 1) {
      // Single file download
      const outputPath = outputPaths[0]
      const basename = path.basename(outputPath)

      // Strip yt_timestamp_ prefix from download name
      let downloadName = basename
      const youtubeMatch = basename.match(/^yt_\d+_(.+)\.(mp3|mp4)$/)
      if (youtubeMatch) {
        downloadName = `${youtubeMatch[1]}.${youtubeMatch[2]}`
      }

      // For non-YouTube files, keep original name but sanitize
      if (!youtubeMatch) {
        downloadName = basename
      }

      // Set explicit Content-Type header based on file extension
      // This ensures mobile devices recognize files as shareable media
      const fileExtension = path.extname(outputPath).toLowerCase()
      let contentType = 'application/octet-stream'

      if (fileExtension === '.mp4') {
        contentType = 'video/mp4'
      } else if (fileExtension === '.mp3') {
        contentType = 'audio/mpeg'
      } else if (fileExtension === '.webm') {
        contentType = 'video/webm'
      } else if (fileExtension === '.m4a') {
        contentType = 'audio/mp4'
      }

      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`)

      res.download(outputPath, downloadName, async (err) => {
        if (err) console.error('Download error:', err)
        const filesToClean = [inputPath, ...outputPaths].filter(Boolean)
        await cleanupFiles(filesToClean)
      })
    } else {
      // Multiple files - create ZIP
      const zipPath = await createZipFile(outputPaths, `converted-media-${timestamp}`, config.directories.downloads)

      res.setHeader('Content-Type', 'application/zip')
      res.setHeader('Content-Disposition', 'attachment; filename="converted-media.zip"')

      res.download(zipPath, 'converted-media.zip', async (err) => {
        if (err) console.error('Download error:', err)
        const allFiles = [inputPath, ...outputPaths, zipPath].filter(Boolean)
        await cleanupFiles(allFiles)
      })
    }

  } catch (error) {
    console.error('Media conversion error:', error)

    // Cleanup on error
    const filesToClean = [inputPath, ...outputPaths].filter(Boolean)
    await cleanupFiles(filesToClean)

    res.status(500).json({
      error: 'Conversion failed',
      message: error.message,
      details: config.nodeEnv === 'development' ? error.stack : undefined
    })
  }
}

export const getPlaylistInfo = async (req, res) => {
  const { url } = req.body

  if (!url) {
    return res.status(400).json({
      error: 'URL required',
      message: 'Please provide a YouTube URL'
    })
  }

  try {
    const isPlaylistUrl = isPlaylist(url)

    if (!isPlaylistUrl) {
      // Get single video info
      const videoInfo = await getPlaylistInfoService(url)
      const video = Array.isArray(videoInfo) ? videoInfo[0] : videoInfo

      return res.json({
        isPlaylist: false,
        videoCount: 1,
        title: video.title || 'YouTube Video',
        duration: video.duration,
        uploader: video.uploader,
        thumbnail: video.thumbnail
      })
    }

    const playlistInfo = await getPlaylistInfoService(url)

    res.json({
      isPlaylist: true,
      videoCount: playlistInfo.length,
      title: playlistInfo[0]?.playlist_title || 'Unknown Playlist',
      videos: playlistInfo.slice(0, 5).map(video => ({
        title: video.title,
        duration: video.duration,
        uploader: video.uploader
      }))
    })
  } catch (error) {
    console.error('Playlist info error:', error)
    res.status(500).json({
      error: 'Failed to get playlist info',
      message: error.message
    })
  }
}
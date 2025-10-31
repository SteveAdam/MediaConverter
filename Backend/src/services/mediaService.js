import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import fs from 'fs/promises'
import path from 'path'
import youtubeDl from 'youtube-dl-exec'
import { config } from '../config/index.js'

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath)

export const processFileUpload = async (inputPath, format, resolution, quality, timestamp) => {
  const outputPath = path.join(config.directories.downloads, `converted-${timestamp}.${format}`)

  if (format === 'mp3') {
    await new Promise((resolve, reject) => {
      let ffmpegCommand = ffmpeg(inputPath)
        .audioBitrate(quality === 'high' ? 320 : quality === 'medium' ? 192 : 128)
        .audioCodec('mp3')
        .audioFrequency(44100)
        .format('mp3')
        .audioFilters('volume=1.0')

      ffmpegCommand
        .save(outputPath)
        .on('end', resolve)
        .on('error', reject)
    })
  } else if (format === 'mp4') {
    const resHeight = resolution.replace('p', '')
    await new Promise((resolve, reject) => {
      let ffmpegCommand = ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .audioBitrate('192k')
        .size(`?x${resHeight}`)
        .format('mp4')
        .outputOptions([
          '-preset', quality === 'high' ? 'slow' : quality === 'medium' ? 'medium' : 'fast',
          '-crf', quality === 'high' ? '18' : quality === 'medium' ? '23' : '28',
          '-profile:v', 'high',
          '-level', '4.1',
          '-pix_fmt', 'yuv420p'
        ])

      ffmpegCommand
        .save(outputPath)
        .on('end', resolve)
        .on('error', reject)
    })
  }

  console.log('File conversion completed:', outputPath)
  return outputPath
}

export const processYouTubeUrl = async (url, format, resolution, quality, downloadPlaylist, timestamp) => {
  console.log('=== YouTube Download (yt-dlp) ===')
  console.log('URL:', url)
  console.log('Format:', format, '| Resolution:', resolution, '| Quality:', quality)
  console.log('Playlist:', downloadPlaylist)

  // Ensure downloads directory exists
  try {
    await fs.access(config.directories.downloads)
  } catch (err) {
    await fs.mkdir(config.directories.downloads, { recursive: true })
  }

  try {
    if (format === 'mp3') {
      // Download audio only
      return await downloadAudioOnly(url, quality, timestamp, downloadPlaylist)
    } else if (format === 'mp4') {
      // Download video with audio
      return await downloadVideoWithAudio(url, resolution, quality, timestamp, downloadPlaylist)
    }
  } catch (error) {
    console.error('YouTube download error:', error)

    const errorMsg = error.message || error.stderr || String(error)

    if (errorMsg.includes('Sign in') || errorMsg.includes('age')) {
      throw new Error('This video requires sign-in or is age-restricted.')
    } else if (errorMsg.includes('private') || errorMsg.includes('Private')) {
      throw new Error('This is a private video and cannot be downloaded.')
    } else if (errorMsg.includes('not available') || errorMsg.includes('Video unavailable')) {
      throw new Error('This video is not available. It may be deleted, geo-restricted, or require YouTube Premium.')
    } else if (errorMsg.includes('Requested format is not available')) {
      throw new Error('Unable to download this video in the requested quality. YouTube may have changed their format.')
    } else {
      throw new Error(`YouTube download failed: ${errorMsg}`)
    }
  }
}

async function downloadAudioOnly(url, quality, timestamp, downloadPlaylist) {
  // Force mp3 extension in output template
  const outputTemplate = path.join(config.directories.downloads, `yt_${timestamp}_%(title)s.mp3`)

  // Normalize path for cross-platform compatibility
  const normalizedTemplate = outputTemplate.replace(/\\/g, '/')

  const audioBitrate = quality === 'high' ? '320' : quality === 'medium' ? '192' : '128'

  console.log('Downloading audio with yt-dlp...')

  try {
    await youtubeDl(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: 0,
      output: normalizedTemplate,
      restrictFilenames: true,
      noPlaylist: !downloadPlaylist,
      postprocessorArgs: `ffmpeg:-b:a ${audioBitrate}k`,
      // Tell yt-dlp where ffmpeg is
      ffmpegLocation: ffmpegPath
    })

    // Find the downloaded file
    const files = await fs.readdir(config.directories.downloads)
    const downloadedFiles = files.filter(f =>
      f.startsWith(`yt_${timestamp}_`) && f.endsWith('.mp3')
    )

    if (downloadedFiles.length === 0) {
      throw new Error('Download completed but file not found')
    }

    const fullPaths = downloadedFiles.map(f => path.join(config.directories.downloads, f))
    console.log(`✓ Audio downloaded: ${downloadedFiles.join(', ')}`)
    return fullPaths
  } catch (error) {
    console.error('yt-dlp audio download error:', error)
    throw new Error(`Audio download failed: ${error.message || error.stderr || String(error)}`)
  }
}

async function downloadVideoWithAudio(url, resolution, quality, timestamp, downloadPlaylist) {
  // Use yt-dlp's template syntax without forcing extension
  const outputTemplate = path.join(config.directories.downloads, `yt_${timestamp}_%(title)s.%(ext)s`)

  // Normalize path for cross-platform compatibility
  const normalizedTemplate = outputTemplate.replace(/\\/g, '/')

  const resHeight = resolution.replace('p', '')

  console.log(`Downloading video at max ${resHeight}p with yt-dlp...`)

  try {
    // Simple approach: specify the format filter and let yt-dlp handle merging
    // -S res:720 sorts by resolution, preferring 720p or lower
    await youtubeDl(url, {
      format: `bv*[height<=${resHeight}]+ba/b[height<=${resHeight}]`,
      output: normalizedTemplate,
      restrictFilenames: true,
      noPlaylist: !downloadPlaylist,
      mergeOutputFormat: 'mp4',
      // Tell yt-dlp where ffmpeg is
      ffmpegLocation: ffmpegPath
    })

    // Find the downloaded file - it should be mp4 after merging
    const files = await fs.readdir(config.directories.downloads)
    const downloadedFiles = files.filter(f =>
      f.startsWith(`yt_${timestamp}_`) && (f.endsWith('.mp4') || f.endsWith('.mkv') || f.endsWith('.webm'))
    )

    if (downloadedFiles.length === 0) {
      throw new Error('Download completed but file not found')
    }

    const fullPaths = downloadedFiles.map(f => path.join(config.directories.downloads, f))
    console.log(`✓ Video downloaded: ${downloadedFiles.join(', ')}`)
    return fullPaths
  } catch (error) {
    console.error('yt-dlp video download error:', error)
    throw new Error(`Video download failed: ${error.message || error.stderr || String(error)}`)
  }
}

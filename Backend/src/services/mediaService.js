import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import fs from 'fs/promises'
import path from 'path'
import youtubeDl from 'youtube-dl-exec'
import { config } from '../config/index.js'
import { checkYtDlp, isPlaylist } from './youtubeService.js'

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath)

export const processFileUpload = async (inputPath, format, resolution, quality, timestamp) => {
  const outputPath = path.join(config.directories.downloads, `converted-${timestamp}.${format}`)

  if (format === 'mp3') {
    // Enhanced MP3 conversion
    await new Promise((resolve, reject) => {
      let ffmpegCommand = ffmpeg(inputPath)
        .audioBitrate(quality === 'high' ? 320 : quality === 'medium' ? 192 : 128)
        .audioCodec('mp3')
        .audioFrequency(44100)
        .format('mp3')
        .audioFilters('volume=1.0') // Normalize volume

      ffmpegCommand
        .save(outputPath)
        .on('end', resolve)
        .on('error', reject)
    })
  } else if (format === 'mp4') {
    // Enhanced MP4 conversion
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

  console.log('Enhanced file conversion completed:', outputPath)
  return outputPath
}

export const processYouTubeUrl = async (url, format, resolution, quality, downloadPlaylist, timestamp) => {
  const ytdlpAvailable = await checkYtDlp()
  if (!ytdlpAvailable) {
    throw new Error('yt-dlp is not installed. Please install yt-dlp: pip install yt-dlp')
  }

  const isPlaylistUrl = isPlaylist(url)

  if (isPlaylistUrl && !downloadPlaylist) {
    throw new Error('Playlist detected. This URL contains a playlist. Please confirm if you want to download the entire playlist.')
  }

  let options = {
    noWarnings: true,
    output: path.join(config.directories.downloads, `youtube-${timestamp}-%(title)s.%(ext)s`),
    restrictFilenames: true
  }

  // Handle playlist settings correctly
  if (downloadPlaylist && isPlaylistUrl) {
    // Download entire playlist
    options.yesPlaylist = true
  } else {
    // Download only single video (even if URL contains playlist)
    options.noPlaylist = true
  }

  if (format === 'mp3') {
    options.extractAudio = true
    options.audioFormat = 'mp3'
    options.audioQuality = quality === 'high' ? '320K' : quality === 'medium' ? '192K' : '128K'
    options.embedSubs = false
  } else if (format === 'mp4') {
    const resHeight = resolution.replace('p', '')
    // Enhanced video quality options
    if (quality === 'high') {
      options.format = `best[height<=${resHeight}][ext=mp4]/bestvideo[height<=${resHeight}]+bestaudio[ext=m4a]/best[height<=${resHeight}]`
    } else if (quality === 'medium') {
      options.format = `best[height<=${resHeight}]/bestvideo[height<=${resHeight}]+bestaudio/best`
    } else {
      options.format = `worst[height<=${resHeight}]/worst`
    }
    options.mergeOutputFormat = 'mp4'
    options.embedSubs = false
  }

  console.log('Downloading with yt-dlp... Options:', options)
  await youtubeDl(url, options)

  // Find downloaded files
  const files = await fs.readdir(config.directories.downloads)
  const downloadedFiles = files.filter(file =>
    file.startsWith(`youtube-${timestamp}`) &&
    (file.endsWith('.mp3') || file.endsWith('.mp4'))
  )

  if (downloadedFiles.length === 0) {
    throw new Error('No files were downloaded')
  }

  const outputPaths = downloadedFiles.map(file => path.join(config.directories.downloads, file))
  console.log('YouTube download completed. Files:', downloadedFiles.length)

  return outputPaths
}
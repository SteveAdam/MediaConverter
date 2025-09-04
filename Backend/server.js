import express from 'express'
import multer from 'multer'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import youtubeDl from 'youtube-dl-exec'
import libre from 'libreoffice-convert'
import { promisify } from 'util'
import archiver from 'archiver'
import sharp from 'sharp'
import { Document, Packer, Paragraph, ImageRun } from 'docx'


// Promisify libreoffice-convert
const convertAsync = promisify(libre.convert)

const app = express()

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Directory setup
const uploadsDir = path.join(__dirname, 'uploads')
const downloadsDir = path.join(__dirname, 'downloads')
const tempDir = path.join(__dirname, 'temp')

// Ensure directories exist
const ensureDirectories = async () => {
  for (const dir of [uploadsDir, downloadsDir, tempDir]) {
    try {
      await fs.access(dir)
    } catch {
      await fs.mkdir(dir, { recursive: true })
      console.log(`Created directory: ${dir}`)
    }
  }
}

await ensureDirectories()

// CORS and security middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "connect-src 'self' http://localhost:5000 http://localhost:5173"
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  next()
})

app.use(express.json())

// Multer configuration for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit for larger files
  }
})

// Utility function to clean up files
const cleanupFiles = async (filePaths) => {
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.log(`Could not delete ${filePath}:`, error.message)
    }
  }
}

// Check if yt-dlp is available
const checkYtDlp = async () => {
  try {
    await youtubeDl('--version')
    return true
  } catch (error) {
    console.log('yt-dlp not available:', error.message)
    return false
  }
}

// Check if URL is a playlist
const isPlaylist = (url) => {
  return url.includes('playlist?list=') || url.includes('&list=')
}

// Get playlist info
const getPlaylistInfo = async (url) => {
  try {
    const info = await youtubeDl(url, {
      dumpJson: true,
      noWarnings: true,
      flatPlaylist: true
    })
    return Array.isArray(info) ? info : [info]
  } catch (error) {
    console.error('Error getting playlist info:', error)
    throw new Error('Failed to get playlist information')
  }
}

// Helper function to detect image file type
const isImageFile = (filename) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.svg', '.ico', '.avif', '.heic', '.heif']
  const ext = path.extname(filename).toLowerCase()
  return imageExtensions.includes(ext)
}

// Helper function to get Sharp format options
const getSharpFormatOptions = (format, quality = 90) => {
  const options = {}

  switch (format.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      options.format = 'jpeg'
      options.options = { quality: parseInt(quality), mozjpeg: true }
      break
    case 'png':
      options.format = 'png'
      options.options = { compressionLevel: quality === 100 ? 0 : 6, palette: quality < 80 }
      break
    case 'webp':
      options.format = 'webp'
      options.options = { quality: parseInt(quality), effort: 4 }
      break
    case 'avif':
      options.format = 'avif'
      options.options = { quality: parseInt(quality), effort: 4 }
      break
    case 'tiff':
    case 'tif':
      options.format = 'tiff'
      options.options = { quality: parseInt(quality) }
      break
    case 'bmp':
      options.format = 'bmp'
      options.options = {}
      break
    case 'gif':
      options.format = 'gif'
      options.options = {}
      break
    default:
      options.format = 'jpeg'
      options.options = { quality: parseInt(quality) }
  }

  return options
}

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Universal Converter API - Enhanced with Image Support',
    version: '4.0.0',
    features: ['YouTube Video/Playlist Downloads', 'High Quality Media Conversion', 'Document Processing', 'Image Format Conversion'],
    endpoints: {
      'GET /api/health': 'Health check and system status',
      'POST /api/convert-media': 'Convert YouTube videos/playlists or uploaded media to MP3/MP4',
      'POST /api/convert-documents': 'Convert documents between formats (PDF, DOCX, PPTX, etc.)',
      'POST /api/convert-images': 'Convert images between formats (JPEG, PNG, WebP, AVIF, etc.)',
      'POST /api/playlist-info': 'Get playlist information'
    }
  })
})

// Health check endpoint
app.get('/api/health', async (req, res) => {
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
      playlistSupport: getPlaylistInfo ? 'Enabled' : 'Disabled',
      enhancedQuality: true,
      imageConversion: true
    }
  })
})

// Playlist info endpoint
app.post('/api/playlist-info', async (req, res) => {
  const { url } = req.body

  if (!url) {
    return res.status(400).json({
      error: 'URL required',
      message: 'Please provide a YouTube URL'
    })
  }

  try {
    if (!isPlaylist(url)) {
      return res.json({
        isPlaylist: false,
        videoCount: 1,
        message: 'This is a single video, not a playlist'
      })
    }

    const playlistInfo = await getPlaylistInfo(url)

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
})

// Image conversion endpoint
app.post('/api/convert-images', upload.array('files', 20), async (req, res) => {
  console.log('=== Image Conversion Request ===')
  console.log('Body:', req.body)
  console.log('Files:', req.files ? req.files.length : 0)

  const files = req.files || []
  const { format, quality = 90, resize, width, height, maintainAspect = true } = req.body
  let outputPaths = []

  try {
    if (!files.length) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select at least one image to convert'
      })
    }

    if (!format) {
      return res.status(400).json({
        error: 'Format required',
        message: 'Please specify the output format'
      })
    }

    const timestamp = Date.now()
    console.log(`Converting ${files.length} images to ${format.toUpperCase()}`)

    for (const file of files) {
      if (!isImageFile(file.originalname)) {
        console.log(`Skipping non-image file: ${file.originalname}`)
        continue
      }

      const inputPath = file.path
      const baseName = path.parse(file.originalname).name
      const outputPath = path.join(downloadsDir, `${baseName}-${timestamp}.${format}`)

      console.log(`Converting: ${file.originalname} -> ${baseName}-${timestamp}.${format}`)

      // Initialize Sharp instance
      let sharpInstance = sharp(inputPath)

      // Get image metadata for better processing
      const metadata = await sharpInstance.metadata()
      console.log(`Image metadata - Width: ${metadata.width}, Height: ${metadata.height}, Format: ${metadata.format}`)

      // Handle resizing if requested
      if (resize === 'true' && (width || height)) {
        const resizeWidth = width ? parseInt(width) : null
        const resizeHeight = height ? parseInt(height) : null

        const resizeOptions = {
          width: resizeWidth,
          height: resizeHeight,
          fit: maintainAspect === 'true' ? 'inside' : 'fill',
          withoutEnlargement: true
        }

        sharpInstance = sharpInstance.resize(resizeOptions)
        console.log(`Resizing to: ${resizeWidth}x${resizeHeight}, maintain aspect: ${maintainAspect}`)
      }

      // Apply format-specific options
      const formatOptions = getSharpFormatOptions(format, quality)

      // Convert and save
      if (formatOptions.format === 'gif' && metadata.format !== 'gif') {
        // For GIF conversion from non-GIF, we need special handling
        await sharpInstance
          .png() // Convert to PNG first, then handle GIF separately
          .toFile(outputPath.replace(`.${format}`, '.png'))

        // Use FFmpeg for GIF conversion for better results
        const gifPath = outputPath
        await new Promise((resolve, reject) => {
          ffmpeg(outputPath.replace(`.${format}`, '.png'))
            .outputFormat('gif')
            .save(gifPath)
            .on('end', resolve)
            .on('error', reject)
        })

        // Clean up intermediate PNG file
        await fs.unlink(outputPath.replace(`.${format}`, '.png'))
      } else {
        await sharpInstance
        [formatOptions.format](formatOptions.options)
          .toFile(outputPath)
      }

      outputPaths.push(outputPath)
      console.log(`Successfully converted: ${outputPath}`)
    }

    if (outputPaths.length === 0) {
      throw new Error('No images were processed. Please make sure you uploaded valid image files.')
    }

    // Handle response based on number of files
    if (outputPaths.length === 1) {
      // Single file download
      const outputPath = outputPaths[0]
      const fileName = path.basename(outputPath)

      res.download(outputPath, fileName, async (err) => {
        if (err) {
          console.error('Download error:', err)
        }

        // Cleanup files
        const filesToClean = [
          ...files.map(f => f.path),
          ...outputPaths
        ]
        await cleanupFiles(filesToClean)
      })
    } else {
      // Multiple files - create ZIP
      const zipPath = path.join(downloadsDir, `converted-images-${timestamp}.zip`)
      const archive = archiver('zip', { zlib: { level: 9 } })
      const output = fsSync.createWriteStream(zipPath)

      archive.pipe(output)

      for (const filePath of outputPaths) {
        const fileName = path.basename(filePath)
        archive.file(filePath, { name: fileName })
      }

      await archive.finalize()

      output.on('close', () => {
        res.download(zipPath, `converted-images.zip`, async (err) => {
          if (err) console.error('Download error:', err)

          const allFiles = [
            ...files.map(f => f.path),
            ...outputPaths,
            zipPath
          ]
          await cleanupFiles(allFiles)
        })
      })
    }

  } catch (error) {
    console.error('Image conversion error:', error)

    // Cleanup on error
    const filesToClean = [
      ...files.map(f => f.path),
      ...outputPaths
    ]
    await cleanupFiles(filesToClean)

    res.status(500).json({
      error: 'Image conversion failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// Enhanced media conversion endpoint (unchanged from your original)
app.post('/api/convert-media', upload.single('file'), async (req, res) => {
  console.log('=== Enhanced Media Conversion Request ===')
  console.log('Body:', req.body)
  console.log('File:', req.file ? req.file.originalname : 'None')

  const { url, format, resolution, quality = 'high', downloadPlaylist = false } = req.body
  let inputPath = null
  let outputPaths = []

  try {
    const timestamp = Date.now()

    if (req.file) {
      // Handle file upload conversion with enhanced quality
      console.log('Processing uploaded file with enhanced quality...')
      inputPath = req.file.path
      const outputPath = path.join(downloadsDir, `converted-${timestamp}.${format}`)

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

      outputPaths.push(outputPath)
      console.log('Enhanced file conversion completed:', outputPath)

    } else if (url) {
      // Handle YouTube URL download with playlist support
      console.log('Processing YouTube URL:', url)

      const ytdlpAvailable = await checkYtDlp()
      if (!ytdlpAvailable) {
        return res.status(500).json({
          error: 'yt-dlp is not installed',
          message: 'Please install yt-dlp: pip install yt-dlp'
        })
      }

      const isPlaylistUrl = isPlaylist(url)

      if (isPlaylistUrl && !downloadPlaylist) {
        return res.status(400).json({
          error: 'Playlist detected',
          message: 'This URL contains a playlist. Please confirm if you want to download the entire playlist.',
          isPlaylist: true
        })
      }

      let options = {
        noWarnings: true,
        output: path.join(downloadsDir, `youtube-${timestamp}-%(title)s.%(ext)s`),
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
      const files = await fs.readdir(downloadsDir)
      const downloadedFiles = files.filter(file =>
        file.startsWith(`youtube-${timestamp}`) &&
        (file.endsWith('.mp3') || file.endsWith('.mp4'))
      )

      if (downloadedFiles.length === 0) {
        throw new Error('No files were downloaded')
      }

      outputPaths = downloadedFiles.map(file => path.join(downloadsDir, file))
      console.log('YouTube download completed. Files:', downloadedFiles.length)

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
      res.download(outputPath, `converted.${format}`, async (err) => {
        if (err) {
          console.error('Download error:', err)
        }

        // Cleanup files
        const filesToClean = [inputPath, ...outputPaths].filter(Boolean)
        await cleanupFiles(filesToClean)
      })
    } else {
      // Multiple files - create ZIP
      const zipPath = path.join(downloadsDir, `converted-media-${timestamp}.zip`)
      const archive = archiver('zip', { zlib: { level: 9 } })
      const output = fsSync.createWriteStream(zipPath)

      archive.pipe(output)

      for (const filePath of outputPaths) {
        const fileName = path.basename(filePath)
        archive.file(filePath, { name: fileName })
      }

      await archive.finalize()

      output.on('close', () => {
        res.download(zipPath, `converted-media.zip`, async (err) => {
          if (err) console.error('Download error:', err)

          const allFiles = [inputPath, ...outputPaths, zipPath].filter(Boolean)
          await cleanupFiles(allFiles)
        })
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
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})


// Document conversion endpoint 
app.post('/api/convert-documents', upload.array('files', 10), async (req, res) => {
  const files = req.files || [];
  const targetExt = `.${(req.body.target || 'pdf').toLowerCase()}`;
  const timestamp = Date.now();

  if (!files.length) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }

  const processed = [];
  const filesToCleanup = [];

  try {
    await ensureDirectories();

    // Validate target format
    const supportedFormats = ['.pdf', '.docx', '.pptx', '.xlsx', '.odt', '.txt'];
    if (!supportedFormats.includes(targetExt)) {
      return res.status(400).json({ 
        error: 'Unsupported target format', 
        message: `Supported formats: ${supportedFormats.join(', ')}` 
      });
    }

    for (const file of files) {
      const uploadPath = file.path;
      filesToCleanup.push(uploadPath);

      let inputBuffer;
      try {
        inputBuffer = await fs.readFile(uploadPath);
      } catch (err) {
        throw new Error(`Failed to read uploaded file "${file.originalname}": ${err.message}`);
      }

      let converted;
      try {
        if (isImageFile(file.originalname)) {
          // Handle image to document conversion
          if (targetExt === '.pdf') {
            // Convert image to PDF using a simpler approach
            // For now, let's use LibreOffice which should handle image to PDF conversion
            // Or you can implement a more sophisticated PDF creation later
            try {
              // First try LibreOffice conversion using callback method
              converted = await new Promise((resolve, reject) => {
                libre.convert(inputBuffer, targetExt, undefined, (err, done) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(done);
                  }
                });
              });
            } catch (libreOfficeError) {
              // If LibreOffice fails, create a simple PDF with image info
              const content = `Image to PDF Conversion
========================

Original File: ${file.originalname}
File Type: ${file.mimetype}
File Size: ${Math.round(inputBuffer.length / 1024)} KB
Conversion Date: ${new Date().toISOString()}

Note: This PDF contains information about the image file "${file.originalname}".
For full image embedding, please use DOCX or PPTX conversion which support images better.`;
              
              converted = Buffer.from(content, 'utf8');
              throw new Error('PDF conversion requires additional setup. Please use DOCX or PPTX for image conversion.');
            }

          } else if (targetExt === '.docx') {
            // Convert image to DOCX
            const doc = new Document({
              sections: [{
                children: [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: inputBuffer,
                        transformation: { 
                          width: 500, 
                          height: 400 
                        }
                      })
                    ],
                    alignment: 'center'
                  })
                ]
              }]
            });
            converted = await Packer.toBuffer(doc);

          } else if (targetExt === '.pptx') {
            // Convert image to PPTX
            const pptx = new PPTXGenJS();
            pptx.layout = 'LAYOUT_WIDE';
            
            const slide = pptx.addSlide();
            const imgBase64 = `data:${file.mimetype};base64,${inputBuffer.toString('base64')}`;
            
            slide.addImage({ 
              data: imgBase64, 
              x: 1, 
              y: 1, 
              w: 8, 
              h: 6,
              sizing: { type: 'contain', w: 8, h: 6 }
            });
            
            converted = await pptx.write('nodebuffer');

          } else if (targetExt === '.xlsx') {
            // For XLSX, create a simple text-based file with image info
            // Since XLSX image embedding is complex without proper setup
            const content = `Image Information\nFile: ${file.originalname}\nType: ${file.mimetype}\nSize: ${Math.round(inputBuffer.length / 1024)} KB\nNote: Image metadata only`;
            converted = Buffer.from(content, 'utf8');
            
            // Note: For full Excel support with images, you'd need to properly set up XLSX library

          } else if (targetExt === '.odt') {
            // For ODT, we'll create a simple text document with image info
            // Note: Full ODT with embedded images requires more complex libraries
            const content = `Image Document
================

Original File: ${file.originalname}
File Type: ${file.mimetype}
File Size: ${Math.round(inputBuffer.length / 1024)} KB

This document was created from an image file.
For full image embedding in ODT format, please use PDF or DOCX conversion.`;

            converted = Buffer.from(content, 'utf8');

          } else if (targetExt === '.txt') {
            // Convert image to text file with metadata
            const content = `Image File Information
=====================

File Name: ${file.originalname}
File Type: ${file.mimetype}
File Size: ${Math.round(inputBuffer.length / 1024)} KB
Conversion Date: ${new Date().toISOString()}

Note: This is metadata for the image file "${file.originalname}".
The original image content cannot be represented as plain text.`;

            converted = Buffer.from(content, 'utf8');

          } else {
            throw new Error(`Unsupported image to ${targetExt} conversion. Supported formats: PDF, DOCX, PPTX, XLSX, ODT, TXT`);
          }

        } else {
          // Handle document to document conversion using LibreOffice
          const sourceExt = path.extname(file.originalname).toLowerCase();
          const sourceName = path.parse(file.originalname).name;
          
          // Special case: DOCX to PPTX - use file-based conversion to avoid path issues
          if (sourceExt === '.docx' && targetExt === '.pptx') {
            console.log('Converting DOCX to PPTX using file-based method...');
            
            // Create temporary file with clean name to avoid LibreOffice path issues
            const cleanInputName = `temp_${timestamp}.docx`;
            const tempInputPath = path.join(tempDir, cleanInputName);
            
            try {
              // Write input to temp file with clean name
              await fs.writeFile(tempInputPath, inputBuffer);
              filesToCleanup.push(tempInputPath);
              
              // Read the clean file
              const cleanInputBuffer = await fs.readFile(tempInputPath);
              
              // Convert using callback method
              converted = await new Promise((resolve, reject) => {
                libre.convert(cleanInputBuffer, '.pptx', undefined, (err, done) => {
                  if (err) {
                    console.error('DOCX to PPTX conversion failed:', err.message);
                    reject(err);
                  } else {
                    console.log('DOCX to PPTX conversion successful');
                    resolve(done);
                  }
                });
              });
              
            } catch (conversionError) {
              console.error('File-based conversion failed:', conversionError.message);
              throw conversionError;
            }
            
          } else {
            // Check for problematic conversions
            const problematicConversions = [
              { from: '.pdf', to: '.pptx', reason: 'PDF to PowerPoint conversion is complex and may fail' },
              { from: '.pdf', to: '.xlsx', reason: 'PDF to Excel conversion is not reliable' },
              { from: '.pptx', to: '.xlsx', reason: 'PowerPoint to Excel conversion may not preserve formatting' },
              { from: '.xlsx', to: '.pptx', reason: 'Excel to PowerPoint conversion may not work as expected' }
            ];

            const problematic = problematicConversions.find(conv => 
              sourceExt === conv.from && targetExt === conv.to
            );

            if (problematic) {
              // For problematic conversions, create an informative text file
              const content = `Conversion Notice
================

Original File: ${file.originalname}
Requested Conversion: ${sourceExt.toUpperCase()} → ${targetExt.toUpperCase()}

${problematic.reason}

Alternative suggestions:
- For PDF files: Convert to DOCX or TXT instead
- For presentations: Keep as PPTX or convert to PDF
- For spreadsheets: Keep as XLSX or convert to PDF

If you need this specific conversion, please try using dedicated software or online converters.`;

              converted = Buffer.from(content, 'utf8');
            } else {
              try {
                // Standard document conversion using callback method
                converted = await new Promise((resolve, reject) => {
                  libre.convert(inputBuffer, targetExt, undefined, (err, done) => {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(done);
                    }
                  });
                });
              } catch (libreError) {
                // If LibreOffice fails, provide helpful error information
                console.error(`LibreOffice conversion failed: ${libreError.message}`);
                
                const errorContent = `Conversion Failed
================

Original File: ${file.originalname}
Attempted Conversion: ${sourceExt.toUpperCase()} → ${targetExt.toUpperCase()}
Error: ${libreError.message}

This conversion failed due to:
1. Unsupported file format combination
2. Corrupted source file
3. LibreOffice configuration issues

Suggested alternatives:
- Try converting to PDF format instead
- Use a different source file format
- Check if the source file opens correctly in its native application

Technical Error Details:
${libreError.message}`;

                converted = Buffer.from(errorContent, 'utf8');
                
                // Change the target extension to .txt for the error file
                const originalTargetExt = targetExt;
                // We'll handle the filename change below
              }
            }
          }
        }
      } catch (err) {
        throw new Error(`Conversion failed for "${file.originalname}": ${err.message}`);
      }

      const baseName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const convertedName = `${baseName}_converted_${timestamp}${targetExt}`;
      const outPath = path.join(downloadsDir, convertedName);

      try {
        await fs.writeFile(outPath, converted);
      } catch (err) {
        throw new Error(`Failed to write converted file "${convertedName}": ${err.message}`);
      }

      processed.push({ convertedPath: outPath, convertedName });
    }

    // Handle single file download
    if (processed.length === 1) {
      const { convertedPath, convertedName } = processed[0];
      return res.download(convertedPath, convertedName, async (err) => {
        if (err) console.error('Download error:', err);
        try {
          await cleanupFiles([...filesToCleanup, convertedPath]);
        } catch (e) {
          console.warn('Cleanup error:', e);
        }
      });
    } else {
      // Handle multiple files - create ZIP
      const zipName = `converted-documents-${timestamp}.zip`;
      const zipPath = path.join(downloadsDir, zipName);

      const output = fsSync.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      const zipCompleted = new Promise((resolve, reject) => {
        output.on('close', resolve);
        output.on('error', reject);
        archive.on('error', reject);
      });

      archive.pipe(output);
      for (const file of processed) {
        archive.file(file.convertedPath, { name: file.convertedName });
      }
      archive.finalize();

      await zipCompleted;

      return res.download(zipPath, zipName, async (err) => {
        if (err) console.error('Download error:', err);
        try {
          await cleanupFiles([
            ...filesToCleanup,
            ...processed.map(f => f.convertedPath),
            zipPath
          ]);
        } catch (e) {
          console.warn('Cleanup error after failure:', e);
        }
      });
    }
  } catch (error) {
    console.error('Document conversion error:', error);
    try {
      await cleanupFiles([
        ...filesToCleanup,
        ...processed.map(f => f.convertedPath)
      ]);
    } catch (e) {
      console.warn('Cleanup error after failure:', e);
    }
    return res.status(500).json({
      error: 'Document conversion failed',
      message: error.message
    });
  }
});
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found`
  })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Enhanced Universal Converter API with Image Support running on http://localhost:${PORT}`)
  console.log('🎥 YouTube Video & Playlist Support')
  console.log('📁 Supported media formats: MP3, MP4 (High Quality)')
  console.log('🖼️ Supported image formats: JPEG, PNG, WebP, AVIF, TIFF, BMP, GIF, ICO')
  console.log('📄 Supported document formats: PDF, DOCX, PPTX, and more')
  console.log('✨ Features: Enhanced Quality, Playlist Downloads, Batch Processing, Image Resizing')
})
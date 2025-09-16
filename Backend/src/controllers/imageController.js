import { config } from '../config/index.js'
import { processImageConversion } from '../services/imageService.js'
import { createZipFile } from '../services/fileService.js'
import { cleanupFiles } from '../utils/cleanup.js'
import { isImageFile } from '../utils/fileTypes.js'

export const convertImages = async (req, res) => {
  console.log('=== Image Conversion Request ===')
  console.log('Body:', req.body)
  console.log('Files:', req.files ? req.files.length : 0)

  const files = req.files || []
  const { format, quality = config.defaultImageQuality, resize, width, height, maintainAspect = true } = req.body
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

      const outputPath = await processImageConversion(file, {
        format,
        quality,
        resize,
        width,
        height,
        maintainAspect,
        timestamp
      })

      if (outputPath) {
        outputPaths.push(outputPath)
      }
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
        if (err) console.error('Download error:', err)

        // Cleanup files
        const filesToClean = [
          ...files.map(f => f.path),
          ...outputPaths
        ]
        await cleanupFiles(filesToClean)
      })
    } else {
      // Multiple files - create ZIP
      const zipPath = await createZipFile(outputPaths, `converted-images-${timestamp}`, config.directories.downloads)

      res.download(zipPath, 'converted-images.zip', async (err) => {
        if (err) console.error('Download error:', err)

        const allFiles = [
          ...files.map(f => f.path),
          ...outputPaths,
          zipPath
        ]
        await cleanupFiles(allFiles)
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
      details: config.nodeEnv === 'development' ? error.stack : undefined
    })
  }
}
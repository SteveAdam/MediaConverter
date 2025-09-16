import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs/promises'
import path from 'path'
import { config } from '../config/index.js'

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

export const processImageConversion = async (file, options) => {
  const { format, quality, resize, width, height, maintainAspect, timestamp } = options
  
  const inputPath = file.path
  const baseName = path.parse(file.originalname).name
  const outputPath = path.join(config.directories.downloads, `${baseName}-${timestamp}.${format}`)

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
    const pngPath = outputPath.replace(`.${format}`, '.png')
    
    await sharpInstance
      .png() // Convert to PNG first, then handle GIF separately
      .toFile(pngPath)

    // Use FFmpeg for GIF conversion for better results
    await new Promise((resolve, reject) => {
      ffmpeg(pngPath)
        .outputFormat('gif')
        .save(outputPath)
        .on('end', resolve)
        .on('error', reject)
    })

    // Clean up intermediate PNG file
    await fs.unlink(pngPath)
  } else {
    await sharpInstance
      [formatOptions.format](formatOptions.options)
      .toFile(outputPath)
  }

  console.log(`Successfully converted: ${outputPath}`)
  return outputPath
}
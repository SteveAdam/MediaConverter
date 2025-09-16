import path from 'path'
import { config } from '../config/index.js'
import { processDocumentConversion } from '../services/documentService.js'
import { createZipFile } from '../services/fileService.js'
import { cleanupFiles } from '../utils/cleanup.js'

export const convertDocuments = async (req, res) => {
  console.log('=== Document Conversion Request ===')
  console.log('Body:', req.body)
  console.log('Files:', req.files ? req.files.length : 0)

  const files = req.files || []
  const targetExt = `.${(req.body.target || 'pdf').toLowerCase()}`
  const timestamp = Date.now()

  if (!files.length) {
    return res.status(400).json({ 
      error: 'No files uploaded',
      message: 'Please select at least one document to convert'
    })
  }

  const processed = []
  const failed = []
  const filesToCleanup = []

  try {
    // Validate target format
    if (!config.supportedDocumentFormats.includes(targetExt)) {
      return res.status(400).json({ 
        error: 'Unsupported target format', 
        message: `Supported formats: ${config.supportedDocumentFormats.join(', ')}` 
      })
    }

    console.log(`Converting ${files.length} documents to ${targetExt.toUpperCase()}`)

    for (const file of files) {
      filesToCleanup.push(file.path)

      try {
        const result = await processDocumentConversion(file, targetExt, timestamp)
        if (result) {
          processed.push(result)
          console.log(`Successfully converted: ${file.originalname}`)
        }
      } catch (error) {
        console.error(`Failed to convert ${file.originalname}:`, error.message)
        failed.push({
          filename: file.originalname,
          error: error.message
        })
        // Continue with other files instead of failing entirely
        continue
      }
    }

    // If no files were processed successfully
    if (processed.length === 0) {
      const errorMessage = failed.length > 0 
        ? `All conversions failed. Errors: ${failed.map(f => `${f.filename}: ${f.error}`).join('; ')}`
        : 'No documents could be converted. Please check your files and try again.'
      
      return res.status(422).json({
        error: 'Conversion failed',
        message: errorMessage,
        failures: failed
      })
    }

    // If some files failed but others succeeded
    if (failed.length > 0) {
      console.warn(`${failed.length} files failed to convert:`, failed)
    }

    // Handle single file download
    if (processed.length === 1) {
      const { convertedPath, convertedName } = processed[0]
      
      // Send success response with warnings if applicable
      const responseData = {
        success: true,
        converted: processed.length,
        failed: failed.length,
        ...(failed.length > 0 && { failures: failed })
      }

      res.setHeader('X-Conversion-Info', JSON.stringify(responseData))
      
      return res.download(convertedPath, convertedName, async (err) => {
        if (err) console.error('Download error:', err)
        try {
          await cleanupFiles([...filesToCleanup, convertedPath])
        } catch (e) {
          console.warn('Cleanup error:', e)
        }
      })
    } else {
      // Handle multiple files - create ZIP
      const outputPaths = processed.map(p => p.convertedPath)
      const zipPath = await createZipFile(outputPaths, `converted-documents-${timestamp}`, config.directories.downloads, processed)

      const responseData = {
        success: true,
        converted: processed.length,
        failed: failed.length,
        ...(failed.length > 0 && { failures: failed })
      }

      res.setHeader('X-Conversion-Info', JSON.stringify(responseData))

      return res.download(zipPath, 'converted-documents.zip', async (err) => {
        if (err) console.error('Download error:', err)
        try {
          await cleanupFiles([
            ...filesToCleanup,
            ...outputPaths,
            zipPath
          ])
        } catch (e) {
          console.warn('Cleanup error after download:', e)
        }
      })
    }
  } catch (error) {
    console.error('Document conversion error:', error)
    try {
      await cleanupFiles([
        ...filesToCleanup,
        ...processed.map(f => f.convertedPath).filter(Boolean)
      ])
    } catch (e) {
      console.warn('Cleanup error after failure:', e)
    }
    return res.status(500).json({
      error: 'Document conversion failed',
      message: error.message,
      details: config.nodeEnv === 'development' ? error.stack : undefined
    })
  }
}
import fs from 'fs/promises'
import path from 'path'
import libre from 'libreoffice-convert'
import { Document, Packer, Paragraph, ImageRun } from 'docx'
import { promisify } from 'util'
import { config } from '../config/index.js'
import { isImageFile } from '../utils/fileTypes.js'

// Promisify libreoffice-convert
const convertAsync = promisify(libre.convert)

export const processDocumentConversion = async (file, targetExt, timestamp) => {
  const uploadPath = file.path
  
  let inputBuffer
  // Special handling for DOCX to PPTX - attempt conversion with enhanced error handling
  if (sourceExt === '.docx' && targetExt === '.pptx') {
    console.log('Attempting DOCX to PPTX conversion...')
    
    try {
      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Conversion timeout - operation took longer than 45 seconds'))
        }, 45000) // Extended timeout for PPTX conversion
        
        // Use callback-based conversion for better control
        libre.convert(inputBuffer, targetExt, undefined, (err, done) => {
          clearTimeout(timeout)
          if (err) {
            console.error(`DOCX to PPTX conversion error:`, err.message)
            reject(new Error(`LibreOffice failed to convert DOCX to PPTX: ${err.message}`))
          } else {
            console.log('DOCX to PPTX conversion completed successfully')
            resolve(done)
          }
        })
      })
      
      // If we get here, conversion was successful
      return result
      
    } catch (conversionError) {
      console.warn(`DOCX to PPTX conversion failed, creating fallback document:`, conversionError.message)
      
      // Create a more detailed fallback document
      const fallbackContent = `DOCX to PPTX Conversion Failed
===============================

Original File: ${file.originalname}
Attempted: DOCX → PPTX
Status: Conversion Failed
Error: ${conversionError.message}

Why This Conversion Failed:
• DOCX and PPTX have very different document structures
• Text formatting may not translate properly to slide format
• Images and tables require manual repositioning
• LibreOffice may not have proper PPTX export configured

Recommended Alternatives:
1. Open ${file.originalname} in Microsoft Word
2. Use "File → Export → Change File Type → PowerPoint Presentation"
3. Or copy content manually into PowerPoint

Online Conversion Services:
• CloudConvert.com (supports DOCX → PPTX)
• SmallPDF.com
• ILovePDF.com

The content of your DOCX file needs to be manually adapted for 
presentation format, as automatic conversion often produces 
poor results even when technically successful.

Conversion attempted: ${new Date().toISOString()}`

      return Buffer.from(fallbackContent, 'utf8')
    }
  }

  try {
    inputBuffer = await fs.readFile(uploadPath)
  } catch (err) {
    throw new Error(`Failed to read uploaded file "${file.originalname}": ${err.message}`)
  }

  let converted
  try {
    if (isImageFile(file.originalname)) {
      // Handle image to document conversion
      converted = await convertImageToDocument(file, inputBuffer, targetExt)
    } else {
      // Handle document to document conversion
      converted = await convertDocumentToDocument(file, inputBuffer, targetExt, timestamp)
    }
  } catch (err) {
    throw new Error(`Conversion failed for "${file.originalname}": ${err.message}`)
  }

  const baseName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_')
  const convertedName = `${baseName}_converted_${timestamp}${targetExt}`
  const outPath = path.join(config.directories.downloads, convertedName)

  try {
    await fs.writeFile(outPath, converted)
  } catch (err) {
    throw new Error(`Failed to write converted file "${convertedName}": ${err.message}`)
  }

  return { convertedPath: outPath, convertedName }
}

const convertImageToDocument = async (file, inputBuffer, targetExt) => {
  if (targetExt === '.pdf') {
    // Handle PDF conversion - try LibreOffice first
    try {
      return await new Promise((resolve, reject) => {
        libre.convert(inputBuffer, targetExt, undefined, (err, done) => {
          if (err) reject(err)
          else resolve(done)
        })
      })
    } catch (libreOfficeError) {
      // If LibreOffice fails, create a simple text file with image info
      const content = `Image to PDF Conversion
========================

Original File: ${file.originalname}
File Type: ${file.mimetype}
File Size: ${Math.round(inputBuffer.length / 1024)} KB
Conversion Date: ${new Date().toISOString()}

Note: This PDF contains information about the image file "${file.originalname}".
For full image embedding, please use DOCX conversion which supports images better.`
      
      throw new Error('PDF conversion requires additional setup. Please use DOCX for image conversion.')
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
    })
    return await Packer.toBuffer(doc)
  } else {
    // For other formats, create text-based content with image info
    const content = `Image Document Conversion
==========================

Original File: ${file.originalname}
File Type: ${file.mimetype}
File Size: ${Math.round(inputBuffer.length / 1024)} KB
Conversion Date: ${new Date().toISOString()}

Note: This document was created from an image file.
For full image embedding, please use DOCX conversion.`

    return Buffer.from(content, 'utf8')
  }
}

const convertDocumentToDocument = async (file, inputBuffer, targetExt, timestamp) => {
  const sourceExt = path.extname(file.originalname).toLowerCase()
  
  // Define truly problematic conversions that should never be attempted
  const blockedConversions = [
    { from: '.pdf', to: '.pptx', reason: 'PDF to PowerPoint conversion is not supported reliably' },
    { from: '.pdf', to: '.xlsx', reason: 'PDF to Excel conversion is not reliable' },
    { from: '.pptx', to: '.xlsx', reason: 'PowerPoint to Excel conversion may not preserve formatting' },
    { from: '.xlsx', to: '.pptx', reason: 'Excel to PowerPoint conversion may not work as expected' }
  ]

  const blocked = blockedConversions.find(conv => 
    sourceExt === conv.from && targetExt === conv.to
  )

  if (blocked) {
    console.warn(`Blocked conversion: ${sourceExt} -> ${targetExt}`)
    
    const content = `Conversion Not Supported
=======================

Original File: ${file.originalname}
Requested Conversion: ${sourceExt.toUpperCase()} → ${targetExt.toUpperCase()}

${blocked.reason}

Alternative suggestions:
- For PDF files: Convert to DOCX or TXT instead
- For DOCX files: Convert to PDF, TXT, or keep as DOCX
- For presentations: Keep as PPTX or convert to PDF
- For spreadsheets: Keep as XLSX or convert to PDF

Recommended conversion paths:
• DOCX ↔ PDF ↔ TXT (reliable)
• XLSX → PDF (reliable)
• PPTX → PDF (reliable)

If you need this specific conversion, please use:
1. Microsoft Office (File → Export)
2. Online converters like CloudConvert
3. Google Docs/Sheets/Slides`

    return Buffer.from(content, 'utf8')
  }

  try {
    // For all other conversions, use the standard method
    console.log(`Converting ${sourceExt} to ${targetExt} using LibreOffice...`)
    
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Conversion timeout - LibreOffice took too long to respond'))
      }, 30000) // 30 second timeout
      
      libre.convert(inputBuffer, targetExt, undefined, (err, done) => {
        clearTimeout(timeout)
        if (err) {
          console.error(`LibreOffice conversion error:`, err.message)
          reject(new Error(`LibreOffice conversion failed: ${err.message}`))
        } else {
          console.log(`LibreOffice conversion successful: ${sourceExt} -> ${targetExt}`)
          resolve(done)
        }
      })
    })
    
    return result
    
  } catch (libreError) {
    console.error(`LibreOffice conversion failed for ${file.originalname}:`, libreError.message)
    
    // Instead of throwing an error, create an informative document
    const errorContent = `Conversion Failed
================

Original File: ${file.originalname}
Attempted Conversion: ${sourceExt.toUpperCase()} → ${targetExt.toUpperCase()}
Error: ${libreError.message}

This conversion failed due to one of the following reasons:
1. Unsupported file format combination
2. Corrupted or password-protected source file
3. LibreOffice configuration issues
4. File complexity exceeds conversion capabilities
5. Temporary file system issues

Suggested alternatives:
1. Try converting to PDF format instead (more reliable)
2. Use Microsoft Office or Google Docs for conversion
3. Check if the source file opens correctly in its native application
4. Try splitting large documents into smaller parts
5. Remove password protection if present

Technical Error Details:
${libreError.message}

Timestamp: ${new Date().toISOString()}`

    return Buffer.from(errorContent, 'utf8')
  }
}
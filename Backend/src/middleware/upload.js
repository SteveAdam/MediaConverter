import multer from 'multer'
import { config } from '../config/index.js'

// Multer configuration for file uploads
export const upload = multer({
  dest: config.directories.uploads,
  limits: {
    fileSize: config.maxFileSize
  }
})

// Middleware for single file upload
export const uploadSingle = upload.single('file')

// Middleware for multiple file upload
export const uploadMultiple = (fieldName = 'files', maxCount = config.maxFiles) => {
  return upload.array(fieldName, maxCount)
}
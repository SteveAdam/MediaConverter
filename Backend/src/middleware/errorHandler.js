import { config } from '../config/index.js'

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found`
  })
}

// Global error handler
export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err)
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: `Maximum file size is ${config.maxFileSize / (1024 * 1024)}MB`
    })
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: 'Too many files',
      message: `Maximum ${config.maxFiles} files allowed`
    })
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    details: config.nodeEnv === 'development' ? err.stack : undefined
  })
}
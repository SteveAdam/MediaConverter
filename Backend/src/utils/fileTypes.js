import path from 'path'
import { config } from '../config/index.js'

export const isImageFile = (filename) => {
  const ext = path.extname(filename).toLowerCase()
  return config.supportedImageFormats.includes(ext)
}

export const isDocumentFile = (filename) => {
  const ext = path.extname(filename).toLowerCase()
  return config.supportedDocumentFormats.includes(ext)
}
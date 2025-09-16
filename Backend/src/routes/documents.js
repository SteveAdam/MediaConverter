import express from 'express'
import { uploadMultiple } from '../middleware/upload.js'
import { convertDocuments } from '../controllers/documentController.js'

const router = express.Router()

router.post('/convert', uploadMultiple('files', 10), convertDocuments)

export default router
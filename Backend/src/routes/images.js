import express from 'express'
import { uploadMultiple } from '../middleware/upload.js'
import { convertImages } from '../controllers/imageController.js'

const router = express.Router()

router.post('/convert', uploadMultiple('files', 20), convertImages)

export default router
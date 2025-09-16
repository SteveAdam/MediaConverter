import express from 'express'
import { uploadSingle } from '../middleware/upload.js'
import { convertMedia, getPlaylistInfo } from '../controllers/mediaController.js'

const router = express.Router()

router.post('/convert', uploadSingle, convertMedia)
router.post('/playlist-info', getPlaylistInfo)

export default router
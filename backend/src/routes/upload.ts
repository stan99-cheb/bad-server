import { Router } from 'express'
import { uploadFile } from '../controllers/upload'
import fileMiddleware from '../middlewares/file'
import { verifyCsrf } from '../middlewares/csrf'

const uploadRouter = Router()
uploadRouter.post('/', verifyCsrf, fileMiddleware.single('file'), uploadFile)

export default uploadRouter

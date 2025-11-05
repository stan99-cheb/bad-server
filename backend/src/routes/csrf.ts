import { Request, Response, Router } from 'express'
import { generateCsrf } from '../middlewares/csrf'

const csrfRouter = Router()

csrfRouter.get('/', generateCsrf, (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken && req.csrfToken() })
})

export default csrfRouter
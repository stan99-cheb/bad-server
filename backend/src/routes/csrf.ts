import { Router, Request, Response } from 'express'
import csrf from '../middlewares/csrf'

const csrfRouter = Router()

csrfRouter.get('/', csrf, (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken() })
})

export default csrfRouter
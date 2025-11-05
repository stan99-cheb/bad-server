import express, { json, urlencoded } from 'express'
import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import path from 'path'
import rateLimit from 'express-rate-limit'
import { DB_ADDRESS, ORIGIN_ALLOW } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'
import 'dotenv/config'

const { PORT = 3000 } = process.env

const app = express()
app.set('trust proxy', 1)

// Rate limiting middleware (10 запросов за 15 минут с одного IP)
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 30, // лимит на 10 запросов
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Слишком много запросов с этого IP, попробуйте позже'
}))

app.use(cookieParser())
app.use(cors({ origin: ORIGIN_ALLOW, credentials: true }));
// app.use(express.static(path.join(__dirname, 'public')));

app.use(serveStatic(path.join(__dirname, 'public')))

app.use(urlencoded({ extended: true }))
app.use(json())

app.options('*', cors())
app.use(routes)
app.use(errors())
app.use(errorHandler)

// eslint-disable-next-line no-console

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()

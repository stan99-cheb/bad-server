import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

export default function serveStatic(baseDir: string) {
    // Разрешённая (абсолютная) базовая директория
    const resolvedBase = path.resolve(baseDir)

    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Определяем полный путь к запрашиваемому файлу
            const reqPath = (req.path || '/').toString()
            const cleanReqPath = reqPath.replace(/^\/+/, '')

            const resolvedPath = path.resolve(resolvedBase, cleanReqPath)

            const relative = path.relative(resolvedBase, resolvedPath)
            if (relative.startsWith('..') || path.isAbsolute(relative)) {
                return next()
            }

            // Файл существует, отправляем его клиенту
            fs.access(resolvedPath, fs.constants.F_OK, (err) => {
                if (err) {
                    return next()
                }
                return res.sendFile(resolvedPath, (err2) => {
                    if (err2) {
                        next(err2)
                    }
                })
            })
        } catch (err) {
            return next(err as Error)
        }
    }
}

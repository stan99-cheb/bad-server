import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import { basename } from 'path'
import BadRequestError from '../errors/bad-request-error'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    const MIN_FILE_SIZE = 2 * 1024
    if (typeof req.file.size === 'number' && req.file.size < MIN_FILE_SIZE) {
        return next(new BadRequestError('Размер файла слишком мал'))
    }

    try {
        const storedName = basename(req.file.filename)
        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${storedName}`
            : `/${storedName}`

        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file?.originalname,
        })
    } catch (error) {
        return next(error)
    }
}

export default {}

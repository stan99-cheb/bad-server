import { NextFunction, Request, Response } from 'express'
import { FilterQuery } from 'mongoose'
import NotFoundError from '../errors/not-found-error'
import Order from '../models/order'
import User, { IUser } from '../models/user'
import escapeRegExp from '../utils/escapeRegExp'

// TODO: Добавить guard admin
// eslint-disable-next-line max-len
// Get GET /customers?page=2&limit=5&sort=totalAmount&order=desc&registrationDateFrom=2023-01-01&registrationDateTo=2023-12-31&lastOrderDateFrom=2023-01-01&lastOrderDateTo=2023-12-31&totalAmountFrom=100&totalAmountTo=1000&orderCountFrom=1&orderCountTo=10
export const getCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortField = 'createdAt',
            sortOrder = 'desc',
            registrationDateFrom,
            registrationDateTo,
            lastOrderDateFrom,
            lastOrderDateTo,
            totalAmountFrom,
            totalAmountTo,
            orderCountFrom,
            orderCountTo,
            search,
        } = req.query

        const unsafeQueryKeys = Object.keys(req.query).filter((k) => k.startsWith('$'))
        if (unsafeQueryKeys.length) {
            unsafeQueryKeys.forEach((k) => delete (req.query as any)[k])
        }

        const filters: FilterQuery<Partial<IUser>> = {}

        if (registrationDateFrom && typeof registrationDateFrom === 'string') {
            const d = new Date(registrationDateFrom)
            if (!Number.isNaN(d.getTime())) {
                filters.createdAt = {
                    ...filters.createdAt,
                    $gte: d,
                }
            }
        }

        if (registrationDateTo && typeof registrationDateTo === 'string') {
            const endOfDay = new Date(registrationDateTo)
            if (!Number.isNaN(endOfDay.getTime())) {
                endOfDay.setHours(23, 59, 59, 999)
                filters.createdAt = {
                    ...filters.createdAt,
                    $lte: endOfDay,
                }
            }
        }

        if (lastOrderDateFrom && typeof lastOrderDateFrom === 'string') {
            const d = new Date(lastOrderDateFrom)
            if (!Number.isNaN(d.getTime())) {
                filters.lastOrderDate = {
                    ...filters.lastOrderDate,
                    $gte: d,
                }
            }
        }

        if (lastOrderDateTo && typeof lastOrderDateTo === 'string') {
            const endOfDay = new Date(lastOrderDateTo)
            if (!Number.isNaN(endOfDay.getTime())) {
                endOfDay.setHours(23, 59, 59, 999)
                filters.lastOrderDate = {
                    ...filters.lastOrderDate,
                    $lte: endOfDay,
                }
            }
        }

        if (totalAmountFrom && typeof totalAmountFrom === 'string' && !Number.isNaN(Number(totalAmountFrom))) {
            filters.totalAmount = {
                ...filters.totalAmount,
                $gte: Number(totalAmountFrom),
            }
        }

        if (totalAmountTo && typeof totalAmountTo === 'string' && !Number.isNaN(Number(totalAmountTo))) {
            filters.totalAmount = {
                ...filters.totalAmount,
                $lte: Number(totalAmountTo),
            }
        }

        if (orderCountFrom && typeof orderCountFrom === 'string' && !Number.isNaN(Number(orderCountFrom))) {
            filters.orderCount = {
                ...filters.orderCount,
                $gte: Number(orderCountFrom),
            }
        }

        if (orderCountTo && typeof orderCountTo === 'string' && !Number.isNaN(Number(orderCountTo))) {
            filters.orderCount = {
                ...filters.orderCount,
                $lte: Number(orderCountTo),
            }
        }

        if (search && typeof search === 'string') {
            const safeSearch = escapeRegExp(search)
            const searchRegex = new RegExp(safeSearch, 'i')

            const orders = await Order.find(
                {
                    $or: [{ deliveryAddress: searchRegex }],
                },
                '_id'
            )

            const orderIds = orders.map((order) => order._id)

            filters.$or = [
                { name: searchRegex },
                { lastOrder: { $in: orderIds } },
            ]
        }

        const sort: { [key: string]: any } = {}

        if (sortField && sortOrder && typeof sortField === 'string' && typeof sortOrder === 'string') {
            if (!sortField.startsWith('$')) {
                sort[sortField as string] = sortOrder === 'desc' ? -1 : 1
            }
        }

        const options = {
            sort,
            skip: (Number(page) - 1) * Number(limit),
            limit: Number(limit),
        }

        const users = await User.find(filters, null, options).populate([
            'orders',
            {
                path: 'lastOrder',
                populate: {
                    path: 'products',
                },
            },
            {
                path: 'lastOrder',
                populate: {
                    path: 'customer',
                },
            },
        ])

        const totalUsers = await User.countDocuments(filters)
        const totalPages = Math.ceil(totalUsers / Number(limit))

        res.status(200).json({
            customers: users,
            pagination: {
                totalUsers,
                totalPages,
                currentPage: Number(page),
                pageSize: Number(limit),
            },
        })
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Get /customers/:id
export const getCustomerById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await User.findById(req.params.id).populate([
            'orders',
            'lastOrder',
        ])
        res.status(200).json(user)
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Patch /customers/:id
export const updateCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
            }
        )
            .orFail(
                () =>
                    new NotFoundError(
                        'Пользователь по заданному id отсутствует в базе'
                    )
            )
            .populate(['orders', 'lastOrder'])
        res.status(200).json(updatedUser)
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Delete /customers/:id
export const deleteCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id).orFail(
            () =>
                new NotFoundError(
                    'Пользователь по заданному id отсутствует в базе'
                )
        )
        res.status(200).json(deletedUser)
    } catch (error) {
        next(error)
    }
}

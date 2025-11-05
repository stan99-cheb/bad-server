import { Router } from 'express'
import {
    deleteCustomer,
    getCustomerById,
    getCustomers,
    updateCustomer,
} from '../controllers/customers'
import auth, { roleGuardMiddleware } from '../middlewares/auth'
import { Role } from '../models/user'
import { verifyCsrf } from '../middlewares/csrf'

const customerRouter = Router()

customerRouter.get('/', auth, roleGuardMiddleware(Role.Admin), getCustomers)
customerRouter.get('/:id', auth, roleGuardMiddleware(Role.Admin), getCustomerById)
customerRouter.patch('/:id', auth, roleGuardMiddleware(Role.Admin), verifyCsrf, updateCustomer)
customerRouter.delete('/:id', auth, roleGuardMiddleware(Role.Admin), verifyCsrf, deleteCustomer)

export default customerRouter

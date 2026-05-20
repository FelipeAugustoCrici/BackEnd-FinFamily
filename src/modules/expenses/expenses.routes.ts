import {
  FastifyInstance,
  FastifyBaseLogger,
  RawReplyDefaultExpression,
  RawServerDefault,
  RawRequestDefaultExpression,
} from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { ExpensesController } from './expenses.controller'
import { createExpenseSchema } from '@/modules/expenses/dtos/create-expense.schema'
import {
  listExpensesQuerySchema,
  patchExpenseStatusSchema,
  updateExpenseSchema,
  createPaymentSchema,
} from '@/modules/expenses/dtos'
import { paramIdSchema } from '@/shared/schemas/param-id.schema'
import z from 'zod'

type FastifyZodInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  FastifyBaseLogger,
  ZodTypeProvider
>

const paymentParamSchema = z.object({ id: z.string().uuid(), paymentId: z.string().uuid() })

export async function expensesRoutes(app: FastifyZodInstance) {
  const controller: ExpensesController = new ExpensesController()

  app.post('/', { schema: { body: createExpenseSchema } }, (req, reply) =>
    controller.createExpense(req, reply),
  )
  app.get('/', { schema: { querystring: listExpensesQuerySchema } }, (req, reply) =>
    controller.listExpenses(req, reply),
  )

  app.get('/:id', { schema: { params: paramIdSchema } }, (req, reply) =>
    controller.getExpenseById(req, reply),
  )

  app.put('/:id', { schema: { body: updateExpenseSchema, params: paramIdSchema } }, (req, reply) =>
    controller.updateExpense(req, reply),
  )

  app.patch(
    '/:id/status',
    { schema: { body: patchExpenseStatusSchema, params: paramIdSchema } },
    (req, reply) => controller.updateStatus(req, reply),
  )

  // Partial payments
  app.post(
    '/:id/payments',
    { schema: { body: createPaymentSchema, params: paramIdSchema } },
    (req, reply) => controller.addPayment(req, reply),
  )

  app.get('/:id/payments', { schema: { params: paramIdSchema } }, (req, reply) =>
    controller.getPayments(req, reply),
  )

  app.delete('/:id/payments/:paymentId', { schema: { params: paymentParamSchema } }, (req, reply) =>
    controller.deletePayment(req, reply),
  )

  app.delete('/:id', { schema: { params: paramIdSchema } }, (req, reply) => {
    controller.deleteExpense(req, reply)
  })
}

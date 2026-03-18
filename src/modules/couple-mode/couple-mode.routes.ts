import {
  FastifyInstance, FastifyBaseLogger,
  RawReplyDefaultExpression, RawServerDefault, RawRequestDefaultExpression,
} from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { CoupleModeController } from './couple-mode.controller'
import {
  saveCoupleConfigSchema,
  coupleResultQuerySchema,
  createAdjustmentSchema,
} from './dtos/couple-mode.schema'

type FastifyZodInstance = FastifyInstance<
  RawServerDefault, RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>, FastifyBaseLogger, ZodTypeProvider
>

export async function coupleModeRoutes(app: FastifyZodInstance) {
  const controller = new CoupleModeController()

  app.post('/config', { schema: { body: saveCoupleConfigSchema } }, (req, reply) =>
    controller.saveConfig(req, reply))

  app.get('/config/:familyId', (req, reply) =>
    controller.getConfig(req, reply))

  app.get('/result', { schema: { querystring: coupleResultQuerySchema } }, (req, reply) =>
    controller.getResult(req, reply))

  app.post('/adjustment', { schema: { body: createAdjustmentSchema } }, (req, reply) =>
    controller.createAdjustment(req, reply))

  app.get('/adjustments', { schema: { querystring: coupleResultQuerySchema } }, (req, reply) =>
    controller.listAdjustments(req, reply))

  app.delete('/adjustment/:id', (req, reply) =>
    controller.deleteAdjustment(req, reply))
}

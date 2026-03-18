import {
  FastifyInstance,
  FastifyBaseLogger,
  RawReplyDefaultExpression,
  RawServerDefault,
  RawRequestDefaultExpression,
} from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { CalendarController } from './calendar.controller'

type FastifyZodInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  FastifyBaseLogger,
  ZodTypeProvider
>

const calendarQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000),
  familyId: z.string().uuid(),
})

export async function calendarRoutes(app: FastifyZodInstance) {
  const controller = new CalendarController()

  app.get('/', { schema: { querystring: calendarQuerySchema } }, (req, reply) =>
    controller.getCalendarEvents(req, reply),
  )
}

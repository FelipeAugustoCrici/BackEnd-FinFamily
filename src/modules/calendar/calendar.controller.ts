import { FastifyReply, FastifyRequest } from 'fastify'
import { CalendarService } from './calendar.service'

export class CalendarController {
  private service = new CalendarService()

  async getCalendarEvents(req: FastifyRequest, reply: FastifyReply) {
    const { month, year, familyId } = req.query as { month: number; year: number; familyId: string }
    const userId = req.user.sub
    const result = await this.service.getCalendarEvents(month, year, familyId, userId)
    return reply.send(result)
  }
}

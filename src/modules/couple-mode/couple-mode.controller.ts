import { FastifyRequest, FastifyReply } from 'fastify'
import { CoupleModeService } from './couple-mode.service'
import { SaveCoupleConfigInput, CoupleResultQuery, CreateAdjustmentInput } from './dtos/couple-mode.schema'

export class CoupleModeController {
  private service = new CoupleModeService()

  async saveConfig(req: FastifyRequest, reply: FastifyReply) {
    const result = await this.service.saveConfig(req.body as SaveCoupleConfigInput)
    return reply.status(200).send(result)
  }

  async getConfig(req: FastifyRequest, reply: FastifyReply) {
    const { familyId } = req.params as { familyId: string }
    const result = await this.service.getConfig(familyId)
    return reply.send(result)
  }

  async getResult(req: FastifyRequest, reply: FastifyReply) {
    const { familyId, month, year } = req.query as CoupleResultQuery
    const result = await this.service.getResult(familyId, month, year)
    return reply.send(result)
  }

  async createAdjustment(req: FastifyRequest, reply: FastifyReply) {
    const result = await this.service.createAdjustment(req.body as CreateAdjustmentInput)
    return reply.status(201).send(result)
  }

  async listAdjustments(req: FastifyRequest, reply: FastifyReply) {
    const { familyId, month, year } = req.query as CoupleResultQuery
    const result = await this.service.listAdjustments(familyId, month, year)
    return reply.send(result)
  }

  async deleteAdjustment(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string }
    await this.service.deleteAdjustment(id)
    return reply.status(204).send()
  }
}

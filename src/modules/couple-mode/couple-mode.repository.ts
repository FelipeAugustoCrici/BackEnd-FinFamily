import { prisma } from '@/lib/prisma'
import { SaveCoupleConfigInput, CreateAdjustmentInput } from './dtos/couple-mode.schema'

export class CoupleModeRepository {
  async saveConfig(data: SaveCoupleConfigInput) {
    return prisma.coupleModeConfig.upsert({
      where: { familyId: data.familyId },
      update: {
        splitType: data.splitType,
        participants: data.participants as any,
        isActive: data.isActive ?? true,
      },
      create: {
        familyId: data.familyId,
        splitType: data.splitType,
        participants: data.participants as any,
        isActive: data.isActive ?? true,
      },
    })
  }

  async getConfig(familyId: string) {
    return prisma.coupleModeConfig.findUnique({ where: { familyId } })
  }

  async getSharedExpenses(familyId: string, month: number, year: number) {
    return prisma.expense.findMany({
      where: {
        person: { familyId },
        month,
        year,
        isShared: true,
        is_deleted: false,
      },
      include: { person: true },
    })
  }

  async createAdjustment(data: CreateAdjustmentInput) {
    return prisma.expenseAdjustment.create({ data })
  }

  async listAdjustments(familyId: string, month: number, year: number) {
    return prisma.expenseAdjustment.findMany({
      where: { familyId, month, year },
      orderBy: { date: 'desc' },
    })
  }

  async deleteAdjustment(id: string) {
    return prisma.expenseAdjustment.delete({ where: { id } })
  }
}

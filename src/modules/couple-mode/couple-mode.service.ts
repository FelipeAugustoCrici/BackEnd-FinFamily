import { CoupleModeRepository } from './couple-mode.repository'
import { SaveCoupleConfigInput, CreateAdjustmentInput } from './dtos/couple-mode.schema'

interface Participant {
  personId: string
  proportion?: number
  income?: number
}

export class CoupleModeService {
  private repo = new CoupleModeRepository()

  async saveConfig(data: SaveCoupleConfigInput) {
    const participants = this.normalizeProportions(data.participants, data.splitType)
    return this.repo.saveConfig({ ...data, participants })
  }

  async getConfig(familyId: string) {
    return this.repo.getConfig(familyId)
  }

  async getResult(familyId: string, month: number, year: number) {
    const config = await this.repo.getConfig(familyId)
    if (!config || !config.isActive) return null

    const participants = config.participants as unknown as Participant[]
    const expenses = await this.repo.getSharedExpenses(familyId, month, year)
    const adjustments = await this.repo.listAdjustments(familyId, month, year)

    const totalShared = expenses.reduce((sum, e) => sum + e.value, 0)

    const paidByPerson: Record<string, number> = {}
    for (const p of participants) paidByPerson[p.personId] = 0
    for (const e of expenses) {
      if (paidByPerson[e.personId] !== undefined) {
        paidByPerson[e.personId] += e.value
      }
    }

    if (config.splitType === 'proportional') {
      const missingIncome = participants.some((p) => !p.income || p.income <= 0)
      if (missingIncome) {
        return {
          period: { month, year },
          totalShared,
          splitType: config.splitType,
          participants: [],
          suggestions: [],
          adjustments,
          totalFamilyIncome: 0,
          incomeRequired: true,
        }
      }
    }

    const proportions = this.getProportions(participants, config.splitType)
    const totalFamilyIncome = participants.reduce((s, p) => s + (p.income ?? 0), 0)

    const adjustmentBalance: Record<string, number> = {}
    for (const p of participants) adjustmentBalance[p.personId] = 0
    for (const a of adjustments) {
      if (adjustmentBalance[a.fromPersonId] !== undefined) adjustmentBalance[a.fromPersonId] += a.amount
      if (adjustmentBalance[a.toPersonId] !== undefined) adjustmentBalance[a.toPersonId] -= a.amount
    }

    const results = participants.map((p) => {
      const paid = paidByPerson[p.personId] ?? 0
      const shouldPay = totalShared * (proportions[p.personId] / 100)
      const effectivePaid = paid + (adjustmentBalance[p.personId] ?? 0)
      const balance = effectivePaid - shouldPay

      return {
        personId: p.personId,
        amountPaid: paid,
        amountShouldPay: shouldPay,
        balance,
        proportion: proportions[p.personId],
        configuredIncome: p.income ?? 0,
        adjustmentAmount: adjustmentBalance[p.personId] ?? 0,
      }
    })

    const suggestions = this.computeSuggestions(results)

    return {
      period: { month, year },
      totalShared,
      splitType: config.splitType,
      participants: results,
      suggestions,
      adjustments,
      totalFamilyIncome,
      incomeRequired: false,
    }
  }

  async createAdjustment(data: CreateAdjustmentInput) {
    return this.repo.createAdjustment(data)
  }

  async deleteAdjustment(id: string) {
    return this.repo.deleteAdjustment(id)
  }

  private normalizeProportions(participants: Participant[], splitType: string): Participant[] {
    if (splitType === 'equal') {
      const prop = 100 / participants.length
      return participants.map((p) => ({ ...p, proportion: prop }))
    }
    return participants
  }

  private getProportions(participants: Participant[], splitType: string): Record<string, number> {
    const result: Record<string, number> = {}

    if (splitType === 'equal') {
      const prop = 100 / participants.length
      for (const p of participants) result[p.personId] = prop
      return result
    }

    if (splitType === 'proportional') {
      const totalIncome = participants.reduce((s, p) => s + (p.income ?? 0), 0)
      for (const p of participants) {
        result[p.personId] = totalIncome > 0 ? ((p.income ?? 0) / totalIncome) * 100 : 100 / participants.length
      }
      return result
    }

    const total = participants.reduce((s, p) => s + (p.proportion ?? 0), 0)
    for (const p of participants) {
      result[p.personId] = total > 0 ? ((p.proportion ?? 0) / total) * 100 : 100 / participants.length
    }
    return result
  }

  private computeSuggestions(results: { personId: string; balance: number }[]) {
    const creditors = results
      .filter((r) => r.balance > 0.01)
      .map((r) => ({ ...r }))
      .sort((a, b) => b.balance - a.balance)

    const debtors = results
      .filter((r) => r.balance < -0.01)
      .map((r) => ({ ...r }))
      .sort((a, b) => a.balance - b.balance)

    const suggestions: { fromPersonId: string; toPersonId: string; amount: number }[] = []

    for (const debtor of debtors) {
      let remaining = Math.abs(debtor.balance)
      for (const creditor of creditors) {
        if (remaining <= 0.01) break
        const transfer = Math.min(remaining, creditor.balance)
        if (transfer > 0.01) {
          suggestions.push({
            fromPersonId: debtor.personId,
            toPersonId: creditor.personId,
            amount: Math.round(transfer * 100) / 100,
          })
          remaining -= transfer
          creditor.balance -= transfer
        }
      }
    }

    return suggestions
  }
}

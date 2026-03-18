import { RecurringExpensesRepository } from '@/modules/recurring-expenses/recurring-expenses.repository'
import { ExpensesRepository } from '@/modules/expenses/expenses.repository'

export class RecurringExpensesService {
  private repository: RecurringExpensesRepository = new RecurringExpensesRepository()
  private expensesRepository: ExpensesRepository = new ExpensesRepository()

  async processRecurringExpenses(familyId: string, month: number, year: number) {
    const recurringFamily = await this.repository.getRecurringExpensesByFamily(familyId)
    // targetDate usado apenas para comparação de endDate
    const targetDate = new Date(Date.UTC(year, month - 1, 1))

    for (const recurring of recurringFamily) {
      const startDate = new Date(recurring.startDate)
      const startMonth = startDate.getUTCMonth() + 1
      const startYear = startDate.getUTCFullYear()
      // Preserva o dia original do cadastro (ex: cadastrado dia 20 → dia 20 de cada mês)
      const originalDay = startDate.getUTCDate()

      if (year < startYear || (year === startYear && month < startMonth)) continue

      if (recurring.endDate) {
        const endDate = new Date(recurring.endDate)
        if (endDate < targetDate) continue
      }

      const alreadyExists = recurring.expenses.some(
        (e: { month: number; year: number }) => e.month === month && e.year === year,
      )

      if (!alreadyExists) {
        // Garante que o dia não ultrapasse o último dia do mês (ex: dia 31 em fevereiro → dia 28)
        const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
        const day = Math.min(originalDay, daysInMonth)
        const recurringDate = new Date(Date.UTC(year, month - 1, day))

        await this.expensesRepository.createExpense({
          description: recurring.description,
          value: recurring.value,
          categoryName: recurring.categoryName,
          type: 'fixed',
          date: recurringDate,
          month,
          year,
          personId: recurring.personId,
          recurringId: recurring.id,
        })
      }
    }
  }
}

export interface BudgetAlert {
  category: {
    id: string
    createdAt: Date
    name: string
    type: string
  } | null
  alert: boolean
  limit: number
  spent: number
  percent: number
}

export interface FinanceReportData {
  totalIncomes: number
  balance: number
  prevBalance?: number
  budgetAlerts: Array<BudgetAlert>
}

export class FinanceReportService {
  generate(data: FinanceReportData): string {
    const { totalIncomes, balance, prevBalance } = data
    let report = `Análise de ${totalIncomes > 0 ? 'saúde financeira' : 'dados'}: `

    if (balance > 0) {
      report += `Você terminou o mês com saldo positivo de R$ ${balance.toFixed(2)}. Bom trabalho! `
    } else {
      report += `Atenção: seus gastos superaram suas receitas em R$ ${Math.abs(balance).toFixed(2)}. `
    }

    if (prevBalance !== undefined) {
      if (balance > prevBalance) {
        report += `Seu desempenho foi melhor que o mês anterior. `
      } else {
        report += `Você gastou mais ou ganhou menos que no mês passado. `
      }
    }

    return report
  }
}

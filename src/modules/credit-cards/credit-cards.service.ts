import { CreditCardsRepository } from './credit-cards.repository'
import { CreateCreditCardInput } from './dtos/create-credit-card.schema'
import { CreatePurchaseInput } from './dtos/create-purchase.schema'

export class CreditCardsService {
  private repo = new CreditCardsRepository()

  async createCreditCard(data: CreateCreditCardInput) {
    return this.repo.createCreditCard(data)
  }

  async listCreditCards(familyId?: string) {
    return this.repo.getCreditCards(familyId)
  }

  async getCreditCardById(id: string) {
    return this.repo.getCreditCardById(id)
  }

  async updateCreditCard(id: string, data: Partial<CreateCreditCardInput>) {
    return this.repo.updateCreditCard(id, data)
  }

  async deleteCreditCard(id: string) {
    return this.repo.deleteCreditCard(id)
  }

  // ─── Purchases ────────────────────────────────────────────────────────────

  async createPurchase(input: CreatePurchaseInput) {
    const card = await this.repo.getCreditCardById(input.creditCardId)
    if (!card) throw new Error('Cartão não encontrado')

    const purchaseDate = new Date(input.purchaseDate)
    const installmentAmount = Number((input.totalAmount / input.installments).toFixed(2))

    const purchase = await this.repo.createPurchase({
      creditCardId: input.creditCardId,
      familyId: input.familyId,
      ownerId: input.ownerId,
      categoryId: input.categoryId,
      description: input.description,
      purchaseDate,
      totalAmount: input.totalAmount,
      installments: input.installments,
      observation: input.observation,
    })

    // Gerar parcelas e vincular às faturas corretas
    for (let i = 0; i < input.installments; i++) {
      const { invoiceMonth, invoiceYear, closingDate, dueDate } = this.resolveInvoicePeriod(
        purchaseDate,
        card.closingDay,
        card.dueDay,
        i,
      )

      const invoice = await this.repo.findOrCreateInvoice(
        input.creditCardId,
        invoiceMonth,
        invoiceYear,
        closingDate,
        dueDate,
      )

      await this.repo.createInstallment({
        purchaseId: purchase.id,
        invoiceId: invoice.id,
        installmentNumber: i + 1,
        totalInstallments: input.installments,
        amount: installmentAmount,
        referenceMonth: invoiceMonth,
        referenceYear: invoiceYear,
      })

      await this.repo.addToInvoiceTotal(invoice.id, installmentAmount)
    }

    // Reduzir limite disponível
    await this.repo.updateAvailableLimit(input.creditCardId, -input.totalAmount)

    return purchase
  }

  async getPurchasesByCard(creditCardId: string) {
    return this.repo.getPurchasesByCard(creditCardId)
  }

  // ─── Invoices ─────────────────────────────────────────────────────────────

  async getInvoices(creditCardId: string) {
    return this.repo.getInvoices(creditCardId)
  }

  async getInvoiceById(id: string) {
    return this.repo.getInvoiceById(id)
  }

  async payInvoice(invoiceId: string, paidAmount: number) {
    const invoice = await this.repo.getInvoiceById(invoiceId)
    if (!invoice) throw new Error('Fatura não encontrada')

    await this.repo.updateInvoiceStatus(invoiceId, 'paid', paidAmount)

    // Recompor limite disponível
    await this.repo.updateAvailableLimit(invoice.creditCardId, paidAmount)

    return { success: true }
  }

  async getAllInvoicesByFamily(familyId: string) {
    return this.repo.getAllInvoicesByFamily(familyId)
  }

  async getCreditCardSummaryByFamily(familyId: string, month: number, year: number) {
    return this.repo.getCreditCardSummaryByFamily(familyId, month, year)
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Determina em qual fatura uma parcela deve cair.
   * Se a compra for feita antes ou no dia de fechamento → fatura do próximo ciclo.
   * Se for após o fechamento → fatura do ciclo seguinte.
   * O parâmetro `offset` desloca para parcelas futuras.
   */
  private resolveInvoicePeriod(
    purchaseDate: Date,
    closingDay: number,
    dueDay: number,
    offset: number,
  ) {
    const day = purchaseDate.getDate()
    const month = purchaseDate.getMonth() + 1 // 1-12
    const year = purchaseDate.getFullYear()

    // Se compra foi após o fechamento, entra na fatura do mês seguinte ao próximo
    const baseOffset = day > closingDay ? 2 : 1

    const totalOffset = baseOffset + offset
    let invoiceMonth = month + totalOffset
    let invoiceYear = year

    while (invoiceMonth > 12) {
      invoiceMonth -= 12
      invoiceYear += 1
    }

    // Calcular datas de fechamento e vencimento da fatura
    const closingDate = new Date(invoiceYear, invoiceMonth - 2, closingDay)
    const dueDate = new Date(invoiceYear, invoiceMonth - 1, dueDay)

    return { invoiceMonth, invoiceYear, closingDate, dueDate }
  }
}

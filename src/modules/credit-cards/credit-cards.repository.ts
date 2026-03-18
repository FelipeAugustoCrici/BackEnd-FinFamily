import { prisma } from '@/lib/prisma'
import { CreateCreditCardInput } from './dtos/create-credit-card.schema'

export class CreditCardsRepository {
  async createCreditCard(data: CreateCreditCardInput) {
    return prisma.creditCard.create({
      data: {
        ...data,
        availableLimit: data.limitAmount,
      },
      include: { owner: true },
    })
  }

  async getCreditCards(familyId?: string) {
    return prisma.creditCard.findMany({
      where: familyId ? { familyId, isActive: true } : { isActive: true },
      include: { owner: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getCreditCardById(id: string) {
    return prisma.creditCard.findUnique({
      where: { id },
      include: { owner: true, invoices: { orderBy: { dueDate: 'desc' }, take: 6 } },
    })
  }

  async updateCreditCard(id: string, data: Partial<CreateCreditCardInput>) {
    return prisma.creditCard.update({ where: { id }, data })
  }

  async updateAvailableLimit(id: string, delta: number) {
    return prisma.creditCard.update({
      where: { id },
      data: { availableLimit: { increment: delta } },
    })
  }

  async deleteCreditCard(id: string) {
    return prisma.creditCard.update({ where: { id }, data: { isActive: false } })
  }

  // Invoices
  async findOrCreateInvoice(creditCardId: string, referenceMonth: number, referenceYear: number, closingDate: Date, dueDate: Date) {
    const existing = await prisma.creditCardInvoice.findUnique({
      where: { creditCardId_referenceMonth_referenceYear: { creditCardId, referenceMonth, referenceYear } },
    })
    if (existing) return existing
    return prisma.creditCardInvoice.create({
      data: { creditCardId, referenceMonth, referenceYear, closingDate, dueDate, totalAmount: 0, paidAmount: 0, status: 'open' },
    })
  }

  async addToInvoiceTotal(invoiceId: string, amount: number) {
    return prisma.creditCardInvoice.update({
      where: { id: invoiceId },
      data: { totalAmount: { increment: amount } },
    })
  }

  async getInvoices(creditCardId: string) {
    return prisma.creditCardInvoice.findMany({
      where: { creditCardId },
      include: {
        installments: {
          include: { purchase: { include: { category: true, owner: true } } },
        },
      },
      orderBy: { dueDate: 'desc' },
    })
  }

  async getInvoiceById(id: string) {
    return prisma.creditCardInvoice.findUnique({
      where: { id },
      include: {
        creditCard: true,
        installments: {
          include: { purchase: { include: { category: true, owner: true } } },
        },
      },
    })
  }

  async updateInvoiceStatus(id: string, status: string, paidAmount?: number) {
    return prisma.creditCardInvoice.update({
      where: { id },
      data: { status, ...(paidAmount !== undefined ? { paidAmount } : {}) },
    })
  }

  // Purchases
  async createPurchase(data: {
    creditCardId: string
    familyId?: string
    ownerId?: string
    categoryId?: string
    description: string
    purchaseDate: Date
    totalAmount: number
    installments: number
    observation?: string
  }) {
    return prisma.creditCardPurchase.create({ data })
  }

  async createInstallment(data: {
    purchaseId: string
    invoiceId: string
    installmentNumber: number
    totalInstallments: number
    amount: number
    referenceMonth: number
    referenceYear: number
  }) {
    return prisma.creditCardInstallment.create({ data })
  }

  async getPurchasesByCard(creditCardId: string) {
    return prisma.creditCardPurchase.findMany({
      where: { creditCardId },
      include: { category: true, owner: true, parcels: { include: { invoice: true } } },
      orderBy: { purchaseDate: 'desc' },
    })
  }

  async getAllInvoicesByFamily(familyId: string) {
    return prisma.creditCardInvoice.findMany({
      where: { creditCard: { familyId } },
      include: { creditCard: true },
      orderBy: { dueDate: 'asc' },
    })
  }

  async getCreditCardSummaryByFamily(familyId: string, month: number, year: number) {
    const cards = await prisma.creditCard.findMany({
      where: { familyId, isActive: true },
      include: {
        invoices: {
          where: { referenceMonth: month, referenceYear: year },
        },
      },
    })
    return cards
  }
}

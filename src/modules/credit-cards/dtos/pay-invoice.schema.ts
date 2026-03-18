import z from 'zod'

export const payInvoiceSchema = z.object({
  paidAmount: z.number().positive(),
})

export type PayInvoiceInput = z.infer<typeof payInvoiceSchema>

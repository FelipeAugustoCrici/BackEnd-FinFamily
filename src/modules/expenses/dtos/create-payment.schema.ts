import z from 'zod'

export const createPaymentSchema = z.object({
  amount: z.number().positive('O valor do pagamento deve ser maior que zero'),
  paidAt: z.string().optional(),
  note: z.string().optional(),
  transferToNextMonth: z.boolean().optional().default(false),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>

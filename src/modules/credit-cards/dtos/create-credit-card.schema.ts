import z from 'zod'

export const createCreditCardSchema = z.object({
  familyId: z.string().optional(),
  ownerId: z.string().optional(),
  name: z.string().min(1),
  bank: z.string().optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  limitAmount: z.number().positive(),
  closingDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
})

export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>

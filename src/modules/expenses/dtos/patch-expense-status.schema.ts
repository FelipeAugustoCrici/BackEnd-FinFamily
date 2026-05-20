import z from 'zod'

export const patchExpenseStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'PARTIALLY_PAID']),
})

export type PatchExpenseStatusInput = z.infer<typeof patchExpenseStatusSchema>

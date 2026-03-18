import { z } from 'zod'

export const participantSchema = z.object({
  personId: z.string(),
  proportion: z.number().min(0).max(100).optional(),
  income: z.number().min(0).optional(),
})

export const saveCoupleConfigSchema = z.object({
  familyId: z.string(),
  splitType: z.enum(['equal', 'proportional', 'custom']),
  participants: z.array(participantSchema).min(2),
  isActive: z.boolean().optional().default(true),
})

export const coupleResultQuerySchema = z.object({
  familyId: z.string(),
  month: z.coerce.number(),
  year: z.coerce.number(),
})

export const createAdjustmentSchema = z.object({
  familyId: z.string(),
  fromPersonId: z.string(),
  toPersonId: z.string(),
  amount: z.number().positive(),
  description: z.string().optional(),
  month: z.number(),
  year: z.number(),
})

export type SaveCoupleConfigInput = z.infer<typeof saveCoupleConfigSchema>
export type CoupleResultQuery = z.infer<typeof coupleResultQuerySchema>
export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>

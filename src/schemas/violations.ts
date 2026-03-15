import { z } from 'zod'
import { violationStatusSchema } from '@/db/schema/zod/violations'
import { requiredAmountSchema } from './shared'

export const createViolationSchema = z.object({
  ownerId: z.uuid('ID de propietario inválido').min(1, 'El propietario es requerido'),
  concept: z.string().min(1, 'El concepto es requerido').max(200, 'El concepto es muy largo'),
  amount: requiredAmountSchema,
  violationDate: z.date('La fecha de infracción es requerida'),
  status: z.enum(violationStatusSchema.options, 'Estado de infracción inválido'),
})

export type CreateViolationFormData = z.infer<typeof createViolationSchema>

export const updateViolationSchema = z.object({
  violationId: z.uuid('ID de infracción inválido'),
  ownerId: z.uuid('ID de propietario inválido').min(1, 'El propietario es requerido'),
  concept: z.string().min(1, 'El concepto es requerido').max(200, 'El concepto es muy largo'),
  amount: requiredAmountSchema,
  violationDate: z.date('La fecha de infracción es requerida'),
  status: z.enum(violationStatusSchema.options, 'Estado de infracción inválido'),
})

export type UpdateViolationFormData = z.infer<typeof updateViolationSchema>

export const deleteViolationSchema = z.object({
  violationId: z.uuid('ID de infracción inválido'),
})

export type DeleteViolationData = z.infer<typeof deleteViolationSchema>

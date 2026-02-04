import { z } from 'zod'

// HOA Board Period schemas
export const createHoaBoardPeriodSchema = z
  .object({
    startDate: z.date('La fecha inicial es requerida'),
    endDate: z.date('La fecha final es requerida'),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'La fecha final debe ser posterior a la fecha inicial',
    path: ['endDate'],
  })

export type CreateHoaBoardPeriodFormData = z.infer<typeof createHoaBoardPeriodSchema>

export const updateHoaBoardPeriodSchema = z
  .object({
    periodId: z.uuid('ID de periodo inválido'),
    startDate: z.date('La fecha inicial es requerida'),
    endDate: z.date('La fecha final es requerida'),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'La fecha final debe ser posterior a la fecha inicial',
    path: ['endDate'],
  })

export type UpdateHoaBoardPeriodFormData = z.infer<typeof updateHoaBoardPeriodSchema>

export const deleteHoaBoardPeriodSchema = z.object({
  periodId: z.uuid('ID de periodo inválido'),
})

export type DeleteHoaBoardPeriodData = z.infer<typeof deleteHoaBoardPeriodSchema>

// HOA Board Member schemas
export const createHoaBoardMemberSchema = z.object({
  periodId: z.uuid('ID de periodo inválido'),
  profileId: z.uuid('ID de perfil inválido'),
})

export type CreateHoaBoardMemberFormData = z.infer<typeof createHoaBoardMemberSchema>

export const updateHoaBoardMemberSchema = z.object({
  memberId: z.uuid('ID de miembro inválido'),
  periodId: z.uuid('ID de periodo inválido'),
  profileId: z.uuid('ID de perfil inválido'),
})

export type UpdateHoaBoardMemberFormData = z.infer<typeof updateHoaBoardMemberSchema>

export const deleteHoaBoardMemberSchema = z.object({
  memberId: z.uuid('ID de miembro inválido'),
})

export type DeleteHoaBoardMemberData = z.infer<typeof deleteHoaBoardMemberSchema>

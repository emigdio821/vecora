import { z } from 'zod'

export const createHouseSchema = z.object({
  houseNumber: z.string().min(1, 'El número de casa es requerido'),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  residentId: z.uuid('ID de propietario inválido').nullable(),
})

export type CreateHouseFormData = z.infer<typeof createHouseSchema>

export const updateHouseSchema = z.object({
  houseId: z.uuid('ID de casa inválido'),
  houseNumber: z.string().min(1, 'El número de casa es requerido'),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  residentId: z.uuid('ID de propietario inválido').nullable(),
})

export type UpdateHouseFormData = z.infer<typeof updateHouseSchema>

export const deleteHouseSchema = z.object({
  houseId: z.uuid('ID de casa inválido'),
})

export type DeleteHouseData = z.infer<typeof deleteHouseSchema>

import { z } from 'zod'

export const createHouseSchema = z.object({
  // Unique in the DB (case-insensitive, live rows only).
  number: z.string().trim().min(1, 'Número es requerido'),
  notes: z.string().trim(),
})

export type CreateHouseInput = z.infer<typeof createHouseSchema>

// Same fields for now; kept separate so they can diverge later.
export const updateHouseSchema = createHouseSchema

export type UpdateHouseInput = z.infer<typeof updateHouseSchema>

// Mirrors the `residency_relationship` enum in the database.
export const RELATIONSHIPS = ['owner', 'tenant', 'family'] as const

export type Relationship = (typeof RELATIONSHIPS)[number]

export const assignResidentsSchema = z.object({
  residentIds: z.array(z.uuid()).min(1, 'Selecciona al menos un residente'),
  relationship: z.enum(RELATIONSHIPS, 'Selecciona el tipo de relación'),
})

export type AssignResidentsInput = z.infer<typeof assignResidentsSchema>

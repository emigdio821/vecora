import { z } from 'zod'
import { m } from '@/paraglide/messages'

export const createHouseSchema = z.object({
  // Unique in the DB (case-insensitive, live rows only).
  number: z
    .string()
    .trim()
    .min(1, { error: () => m.residential_house_number_required() }),
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
  residentIds: z.array(z.uuid()).min(1, { error: () => m.residential_select_resident_required() }),
  relationship: z.enum(RELATIONSHIPS, { error: () => m.residential_relationship_required() }),
})

export type AssignResidentsInput = z.infer<typeof assignResidentsSchema>

/** The same link from the resident's side: one house for the resident being edited. */
export const assignHouseSchema = z.object({
  houseId: z.uuid({ error: () => m.common_select_house() }),
  relationship: z.enum(RELATIONSHIPS, { error: () => m.residential_relationship_required() }),
})

export type AssignHouseInput = z.infer<typeof assignHouseSchema>

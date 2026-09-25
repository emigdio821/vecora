import { z } from 'zod'

/** One booking of the terraza (event terrace): a house, a day, optional notes. */
export const hallReservationSchema = z.object({
  property_id: z.uuid('Selecciona una casa'),
  // Unique in the DB: one booking per day.
  reserved_on: z.iso.date('Fecha inválida'),
  notes: z.string().trim(),
})

export type HallReservationInput = z.infer<typeof hallReservationSchema>

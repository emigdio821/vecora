import { z } from 'zod'
import { requiredText } from './requests'

/** A job done (or a purchase made) that the treasurer should pay for. */
export const maintenanceRequestSchema = z.object({
  title: requiredText('Concepto'),
  details: z.string().trim(),
  amount: z.number('Monto es requerido').positive('El monto debe ser mayor a cero'),
  requested_on: z.iso.date('Fecha inválida'),
})

export type MaintenanceRequestInput = z.infer<typeof maintenanceRequestSchema>

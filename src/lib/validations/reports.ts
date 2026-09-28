import { z } from 'zod'

/** Days the PDF report covers, both inclusive. Read from the URL by the route handler. */
export const reportRangeSchema = z
  .object({
    from: z.iso.date('Fecha inválida'),
    to: z.iso.date('Fecha inválida'),
  })
  .refine((data) => data.from <= data.to, {
    path: ['to'],
    message: 'La fecha final debe ser igual o posterior a la inicial',
  })

export type ReportRange = z.infer<typeof reportRangeSchema>

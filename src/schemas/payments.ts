import { z } from 'zod'
import { paymentStatusSchema, paymentTypeSchema } from '@/db/schemas/zod/payments'
import { MAX_YEAR_OFFSET, STARTING_YEAR } from '@/lib/constants'
import { requiredAmountSchema } from './shared'

export const createPaymentSchema = z
  .object({
    ownerId: z.uuid('ID de propietario inválido'),
    concept: z.string().min(1, 'El concepto es requerido').max(200, 'El concepto es muy largo'),
    amount: requiredAmountSchema,
    paymentType: z.enum(paymentTypeSchema.options, 'Tipo de pago inválido'),
    year: z
      .number()
      .min(2000)
      .max(new Date().getFullYear() + 2, 'Año inválido'),
    months: z.array(z.number().min(1).max(12)).optional(),
    status: z.enum(paymentStatusSchema.options, 'Estado de pago inválido'),
    paidAt: z.date('Fecha de pago inválida').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentType === 'monthly_fee' && (!data.months || data.months.length === 0)) {
      ctx.addIssue({
        path: ['months'],
        message: 'Al menos un mes es requerido para pagos de cuota mensual',
        code: 'custom',
      })
    }
  })

export type CreatePaymentFormData = z.infer<typeof createPaymentSchema>

export const updatePaymentSchema = z
  .object({
    paymentId: z.uuid('ID de pago inválido'),
    ownerId: z.uuid('ID de propietario inválido'),
    concept: z.string().min(1, 'El concepto es requerido').max(200, 'El concepto es muy largo'),
    amount: requiredAmountSchema,
    paymentType: z.enum(paymentTypeSchema.options, 'Tipo de pago inválido'),
    year: z
      .number()
      .min(2000)
      .max(new Date().getFullYear() + 2, 'Año inválido'),
    months: z.array(z.number().min(1).max(12)).optional(),
    status: z.enum(paymentStatusSchema.options, 'Estado de pago inválido'),
    paidAt: z.date('Fecha de pago inválida').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentType === 'monthly_fee' && (!data.months || data.months.length === 0)) {
      ctx.addIssue({
        path: ['months'],
        message: 'Al menos un mes es requerido para pagos de cuota mensual',
        code: 'custom',
      })
    }
  })

export type UpdatePaymentFormData = z.infer<typeof updatePaymentSchema>

export const deletePaymentSchema = z.object({
  paymentId: z.uuid('ID de pago inválido'),
})

export type DeletePaymentData = z.infer<typeof deletePaymentSchema>

export const paymentsByYearSchema = z.object({
  year: z
    .number()
    .min(STARTING_YEAR, `El año no puede ser anterior a ${STARTING_YEAR}`)
    .max(new Date().getFullYear() + MAX_YEAR_OFFSET, 'Año inválido'),
})

export type PaymentsByYearData = z.infer<typeof paymentsByYearSchema>

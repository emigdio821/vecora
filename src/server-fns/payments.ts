import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { paymentMonths, payments } from '@/db/schemas/main'
import { type PaymentWithOwnerAndMonths, paymentStatusSchema, paymentTypeSchema } from '@/db/schemas/zod'
import { authMiddleware } from '@/middleware/auth'

const requiredAmountSchema = z
  .string()
  .min(1, 'El monto es requerido')
  .refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
    message: 'El monto debe ser un número válido mayor a 0',
  })

export const createPaymentSchema = z
  .object({
    ownerId: z.uuid('ID de propietario inválido'),
    concept: z.string().min(1, 'El concepto es requerido'),
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
    concept: z.string().min(1, 'El concepto es requerido'),
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

export const createPayment = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createPaymentSchema)
  .handler(async ({ data }) => {
    const { ownerId, concept, amount, paymentType, year, months, status, paidAt } = data
    const [newPayment] = await db
      .insert(payments)
      .values({
        ownerId,
        concept,
        amount,
        paymentType,
        year,
        status,
        paidAt: paidAt ? new Date(paidAt) : null,
      })
      .returning()

    if (months && months.length > 0) {
      months.sort((a, b) => a - b)
      await db.insert(paymentMonths).values(
        months.map((month) => ({
          paymentId: newPayment.id,
          month,
        })),
      )
    }

    return newPayment
  })

export const updatePayment = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updatePaymentSchema)
  .handler(async ({ data }) => {
    const { paymentId, ownerId, concept, amount, paymentType, year, months, status, paidAt } = data

    const [updatedPayment] = await db
      .update(payments)
      .set({
        ownerId,
        concept,
        amount,
        paymentType,
        year,
        status,
        paidAt: paidAt ? new Date(paidAt) : null,
      })
      .where(eq(payments.id, paymentId))
      .returning()

    await db.delete(paymentMonths).where(eq(paymentMonths.paymentId, paymentId))

    if (months && months.length > 0) {
      months.sort((a, b) => a - b)
      await db.insert(paymentMonths).values(
        months.map((month) => ({
          paymentId: updatedPayment.id,
          month,
        })),
      )
    }

    return updatedPayment
  })

export const deletePayment = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(deletePaymentSchema)
  .handler(async ({ data }) => {
    const { paymentId } = data
    const [deletedPayment] = await db.delete(payments).where(eq(payments.id, paymentId)).returning()
    return deletedPayment
  })

export const getPaymentsList = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const allPayments = await db.query.payments.findMany({
      with: {
        owner: true,
        paymentMonths: {
          orderBy: (paymentMonths, { asc }) => [asc(paymentMonths.month)],
        },
      },
      orderBy: (payments, { desc }) => [desc(payments.createdAt)],
    })

    return allPayments satisfies PaymentWithOwnerAndMonths[]
  })

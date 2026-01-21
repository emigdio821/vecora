import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { paymentMonths, payments } from '@/db/schemas/main'
import type { InsertPayment, PaymentWithOwnerAndMonths } from '@/db/schemas/zod'
import { authMiddleware } from '@/middleware/auth'
import { createPaymentSchema, deletePaymentSchema, updatePaymentSchema } from '@/schemas/payments'

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

    return newPayment satisfies InsertPayment
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

    return updatedPayment satisfies InsertPayment
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

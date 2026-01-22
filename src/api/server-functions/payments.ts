import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { createAuditLog } from '@/api/server-functions/audit'
import { db } from '@/db'
import { paymentMonths, payments } from '@/db/schemas/main'
import type { InsertPayment, PaymentWithOwnerAndMonths } from '@/db/schemas/zod/payments'
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

    createAuditLog({
      data: {
        action: 'create',
        entityType: 'payment',
        entityId: newPayment.id,
        newData: { ...newPayment, months },
      },
    }).catch(console.error)

    return newPayment satisfies InsertPayment
  })

export const updatePayment = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updatePaymentSchema)
  .handler(async ({ data }) => {
    const { paymentId, ownerId, concept, amount, paymentType, year, months, status, paidAt } = data

    const [oldPayment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1)
    const oldMonths = await db.select().from(paymentMonths).where(eq(paymentMonths.paymentId, paymentId))

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

    createAuditLog({
      data: {
        action: 'update',
        entityType: 'payment',
        entityId: updatedPayment.id,
        oldData: { ...oldPayment, months: oldMonths.map((m) => m.month) },
        newData: { ...updatedPayment, months },
      },
    }).catch(console.error)

    return updatedPayment satisfies InsertPayment
  })

export const deletePayment = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(deletePaymentSchema)
  .handler(async ({ data }) => {
    const { paymentId } = data

    const [paymentToDelete] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1)
    const paymentMonthsToDelete = await db
      .select()
      .from(paymentMonths)
      .where(eq(paymentMonths.paymentId, paymentId))

    const [deletedPayment] = await db.delete(payments).where(eq(payments.id, paymentId)).returning()

    createAuditLog({
      data: {
        action: 'delete',
        entityType: 'payment',
        entityId: deletedPayment.id,
        oldData: { ...paymentToDelete, months: paymentMonthsToDelete.map((m) => m.month) },
      },
    }).catch(console.error)

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
      orderBy: (payments, { desc }) => [desc(payments.updatedAt)],
    })

    return allPayments satisfies PaymentWithOwnerAndMonths[]
  })

import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { paymentMonths, paymentStatusEnum, payments, paymentTypeEnum } from '../main'
import type { SelectOwner } from './owners'

export const insertPaymentSchema = createInsertSchema(payments)
export const selectPaymentSchema = createSelectSchema(payments)

export const insertPaymentMonthSchema = createInsertSchema(paymentMonths)
export const selectPaymentMonthSchema = createSelectSchema(paymentMonths)

export const paymentStatusSchema = z.enum(paymentStatusEnum.enumValues)
export const paymentTypeSchema = z.enum(paymentTypeEnum.enumValues)

export type InsertPayment = z.infer<typeof insertPaymentSchema>
export type SelectPayment = z.infer<typeof selectPaymentSchema>
export type InsertPaymentMonth = z.infer<typeof insertPaymentMonthSchema>
export type SelectPaymentMonth = z.infer<typeof selectPaymentMonthSchema>
export type PaymentStatus = z.infer<typeof paymentStatusSchema>
export type PaymentType = z.infer<typeof paymentTypeSchema>

// Type for payments with owner and months relations included
export type PaymentWithOwnerAndMonths = SelectPayment & {
  owner: SelectOwner | null
  paymentMonths: SelectPaymentMonth[]
}

// Payment requests of Maintenance and Security: what the section spent or
// needs, for the treasurer to pay. Both sections share the lifecycle.
//
//   * A request starts pending; its section (maintenanceRequest.write /
//     securityRequest.write) edits and deletes it while it is.
//   * Only the treasurer resolves it (…Request.resolve): paying records the
//     expense, in the request's currency, and links it; rejecting keeps the
//     row with the reason.
//   * The one way back is reopening a rejection (a mistake, or it was
//     cleared up in person), instead of filing a duplicate. A paid request
//     stays closed: undoing it means reversing its expense.
import { eq, sql } from 'drizzle-orm'
import type { Transaction } from '@/lib/db/client'
import { type maintenanceRequests, type securityRequests, transactions } from '@/lib/db/schema'
import type { Actor } from './actor'
import { ServiceError } from './errors'
import { hoaCurrency } from './settings'
import { periodCovering, requireReference } from './treasury'

type RequestTable = typeof maintenanceRequests | typeof securityRequests
type PaymentMethod = (typeof transactions.$inferSelect)['paymentMethod']

/** A request's status, locked for the rest of the transaction. */
async function lockRequest(tx: Transaction, table: RequestTable, id: string) {
  const [request] = await tx
    .select({
      status: table.status,
      title: table.title,
      amount: table.amount,
      currency: table.currency,
    })
    .from(table)
    .where(eq(table.id, id))
    .for('update')
  if (!request) {
    throw new ServiceError('not_found', `request ${id}`)
  }
  return request
}

async function requirePending(tx: Transaction, table: RequestTable, id: string) {
  const request = await lockRequest(tx, table, id)
  if (request.status !== 'pending') {
    throw new ServiceError('already_resolved', request.status)
  }
  return request
}

export interface RequestFields {
  title: string
  details: string | null
  amount: number
  requestedOn: string
}

/** Files a request, pending, in the HOA's currency. */
export async function createRequest(
  tx: Transaction,
  table: typeof maintenanceRequests,
  actor: Actor,
  input: RequestFields,
): Promise<{ id: string }>
export async function createRequest(
  tx: Transaction,
  table: typeof securityRequests,
  actor: Actor,
  input: RequestFields & { kind: (typeof securityRequests.$inferInsert)['kind'] },
): Promise<{ id: string }>
export async function createRequest(
  tx: Transaction,
  table: RequestTable,
  actor: Actor,
  input: RequestFields,
): Promise<{ id: string }> {
  const [created] = await tx
    .insert(table)
    .values({ ...input, currency: await hoaCurrency(tx), createdBy: actor.id })
    .returning({ id: table.id })
  return created
}

/** Edits a pending request. */
export async function updateRequest(
  tx: Transaction,
  table: RequestTable,
  id: string,
  input: RequestFields & { kind?: (typeof securityRequests.$inferInsert)['kind'] },
): Promise<void> {
  await requirePending(tx, table, id)
  await tx.update(table).set(input).where(eq(table.id, id))
}

/** Deletes a pending request. */
export async function deleteRequest(tx: Transaction, table: RequestTable, id: string): Promise<void> {
  await requirePending(tx, table, id)
  await tx.delete(table).where(eq(table.id, id))
}

export interface RequestPaymentInput {
  /** An expense category; the ledger refuses one of the other kind. */
  categoryId: string
  occurredOn: string
  paymentMethod: PaymentMethod
  reference: string | null
  notes: string | null
}

/** Pays a pending request: its expense, named after it, in the period of the payment's day. */
export async function payRequest(
  tx: Transaction,
  table: RequestTable,
  actor: Actor,
  id: string,
  input: RequestPaymentInput,
): Promise<{ transactionId: string }> {
  requireReference(input.paymentMethod, input.reference)
  const request = await requirePending(tx, table, id)

  const category = await tx.query.transactionCategories.findFirst({
    columns: { kind: true },
    where: { id: input.categoryId },
  })
  if (!category || category.kind !== 'expense') {
    throw new ServiceError('category_kind')
  }

  const period = await periodCovering(tx, input.occurredOn)
  const [expense] = await tx
    .insert(transactions)
    .values({
      kind: 'expense',
      categoryId: input.categoryId,
      periodId: period.id,
      amount: request.amount,
      currency: request.currency,
      occurredOn: input.occurredOn,
      paymentMethod: input.paymentMethod,
      reference: input.reference,
      description: request.title,
      notes: input.notes,
      createdBy: actor.id,
    })
    .returning({ id: transactions.id })

  await tx
    .update(table)
    .set({ status: 'paid', resolvedBy: actor.id, resolvedAt: sql`now()`, transactionId: expense.id })
    .where(eq(table.id, id))

  return { transactionId: expense.id }
}

/** Rejects a pending request, with the reason its section reads. */
export async function rejectRequest(
  tx: Transaction,
  table: RequestTable,
  actor: Actor,
  id: string,
  reason: string,
): Promise<void> {
  const trimmed = reason.trim()
  if (trimmed === '') {
    throw new ServiceError('rejection_needs_reason')
  }
  await requirePending(tx, table, id)

  await tx
    .update(table)
    .set({ status: 'rejected', resolvedBy: actor.id, resolvedAt: sql`now()`, rejectionReason: trimmed })
    .where(eq(table.id, id))
}

/** Takes a rejection back: the request is pending again, editable and payable. */
export async function reopenRequest(tx: Transaction, table: RequestTable, id: string): Promise<void> {
  const request = await lockRequest(tx, table, id)
  if (request.status !== 'rejected') {
    throw new ServiceError('not_rejected', request.status)
  }

  await tx
    .update(table)
    .set({ status: 'pending', resolvedBy: null, resolvedAt: null, rejectionReason: null })
    .where(eq(table.id, id))
}

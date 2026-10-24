import { createServerFn } from '@tanstack/react-start'
import { eq, sql } from 'drizzle-orm'
import {
  type ActionResult,
  databaseError,
  FK_VIOLATION,
  postgrestErrorMessage,
  requestResolutionErrorMessage,
} from '@/lib/action-result'
import { authMiddleware } from '@/lib/auth/middleware'
import { withCurrentUser } from '@/lib/db/current-user'
import { securityRequests } from '@/lib/db/schema'
import {
  type PayRequestInput,
  payRequestSchema,
  type RejectRequestInput,
  rejectRequestSchema,
} from '@/lib/validations/requests'
import { type SecurityRequestInput, securityRequestSchema } from '@/lib/validations/security'
import { m } from '@/paraglide/messages'

function toMessage(error: unknown, fallback: string) {
  return postgrestErrorMessage(databaseError(error), { fallback })
}

/**
 * Every request the board can see, newest date first. The rows keep the
 * database's column names and ISO timestamps, the shape the screens were built on.
 */
const fetchSecurityRequestsFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const requests = await withCurrentUser((tx) =>
      tx.query.securityRequests.findMany({
        columns: {
          id: true,
          kind: true,
          title: true,
          details: true,
          amount: true,
          currency: true,
          requestedOn: true,
          status: true,
          rejectionReason: true,
          resolvedAt: true,
          createdAt: true,
        },
        with: {
          profileCreatedBy: { columns: { fullName: true } },
          profileResolvedBy: { columns: { fullName: true } },
          transaction: { columns: { id: true, occurredOn: true, paymentMethod: true, reference: true } },
        },
        orderBy: { requestedOn: 'desc', createdAt: 'desc' },
      }),
    )

    return requests.map((request) => {
      const { profileResolvedBy: resolver, transaction } = request
      return {
        id: request.id,
        kind: request.kind,
        title: request.title,
        details: request.details,
        amount: request.amount,
        currency: request.currency,
        requested_on: request.requestedOn,
        status: request.status,
        rejection_reason: request.rejectionReason,
        resolved_at: request.resolvedAt ? request.resolvedAt.toISOString() : null,
        created_at: request.createdAt.toISOString(),
        // created_by is required, so there's always a requester; Drizzle types the join as optional anyway.
        requester: { full_name: request.profileCreatedBy?.fullName ?? '' },
        resolver: resolver ? { full_name: resolver.fullName } : null,
        transaction: transaction
          ? {
              id: transaction.id,
              occurred_on: transaction.occurredOn,
              payment_method: transaction.paymentMethod,
              reference: transaction.reference,
            }
          : null,
      }
    })
  })

export const fetchSecurityRequests = () => fetchSecurityRequestsFn()

const createSecurityRequestFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: SecurityRequestInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = securityRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { kind, title, details, amount, requested_on } = parsed.data

    let created: Array<{ id: string }>
    try {
      created = await withCurrentUser((tx) =>
        tx
          .insert(securityRequests)
          .values({ kind, title, details: details || null, amount, requestedOn: requested_on })
          .returning({ id: securityRequests.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.requests_create_failed()) }
    }

    return { data: created[0] }
  })

export const createSecurityRequest = (input: SecurityRequestInput) => createSecurityRequestFn({ data: input })

/** Only while pending: RLS filters out resolved rows, which surfaces as "no permission". */
const updateSecurityRequestFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; input: SecurityRequestInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = securityRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { kind, title, details, amount, requested_on } = parsed.data

    let updated: Array<{ id: string }>
    try {
      updated = await withCurrentUser((tx) =>
        tx
          .update(securityRequests)
          .set({ kind, title, details: details || null, amount, requestedOn: requested_on })
          .where(eq(securityRequests.id, id))
          .returning({ id: securityRequests.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.requests_update_failed()) }
    }
    if (updated.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const updateSecurityRequest = (id: string, input: SecurityRequestInput) =>
  updateSecurityRequestFn({ data: { id, input } })

const deleteSecurityRequestFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ActionResult> => {
    let deleted: Array<{ id: string }>
    try {
      deleted = await withCurrentUser((tx) =>
        tx.delete(securityRequests).where(eq(securityRequests.id, id)).returning({ id: securityRequests.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.requests_delete_failed()) }
    }
    if (deleted.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const deleteSecurityRequest = (id: string) => deleteSecurityRequestFn({ data: id })

/** Records the expense in the ledger and marks the request paid, atomically. */
const paySecurityRequestFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; input: PayRequestInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult<{ transaction_id: string }>> => {
    const parsed = payRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { category_id, occurred_on, payment_method, reference, notes } = parsed.data

    let transactionId: string
    try {
      const result = await withCurrentUser((tx) =>
        tx.execute<{ transaction_id: string }>(sql`
          select public.pay_security_request(
            p_request_id => ${id},
            p_category_id => ${category_id},
            p_occurred_on => ${occurred_on},
            p_payment_method => ${payment_method},
            p_reference => ${reference || null},
            p_notes => ${notes || null}
          ) as transaction_id
        `),
      )
      transactionId = result.rows[0].transaction_id
    } catch (error) {
      const failure = databaseError(error)
      if (failure.code === FK_VIOLATION) return { error: m.requests_category_must_be_expense() }
      return {
        error: requestResolutionErrorMessage(failure, m.requests_pay_failed()),
      }
    }

    return { data: { transaction_id: transactionId } }
  })

export const paySecurityRequest = (id: string, input: PayRequestInput) =>
  paySecurityRequestFn({ data: { id, input } })

const rejectSecurityRequestFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; input: RejectRequestInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = rejectRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    try {
      await withCurrentUser((tx) =>
        tx.execute(sql`
          select public.reject_security_request(p_request_id => ${id}, p_reason => ${parsed.data.reason})
        `),
      )
    } catch (error) {
      return {
        error: requestResolutionErrorMessage(databaseError(error), m.requests_reject_failed()),
      }
    }

    return { data: undefined }
  })

export const rejectSecurityRequest = (id: string, input: RejectRequestInput) =>
  rejectSecurityRequestFn({ data: { id, input } })

/** Rejected → pending again, so the same request can be fixed and paid. */
const reopenSecurityRequestFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ActionResult> => {
    try {
      await withCurrentUser((tx) =>
        tx.execute(sql`select public.reopen_security_request(p_request_id => ${id})`),
      )
    } catch (error) {
      return {
        error: requestResolutionErrorMessage(databaseError(error), m.requests_reopen_failed_retry()),
      }
    }

    return { data: undefined }
  })

export const reopenSecurityRequest = (id: string) => reopenSecurityRequestFn({ data: id })

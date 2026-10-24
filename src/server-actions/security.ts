import { createServerFn } from '@tanstack/react-start'
import { type ActionResult, errorMessage } from '@/lib/action-result'
import { boardMiddleware, requirePermission } from '@/lib/auth/middleware'
import { db, transactionAs } from '@/lib/db'
import { securityRequests } from '@/lib/db/schema'
import * as requests from '@/lib/services/requests'
import {
  type PayRequestInput,
  payRequestSchema,
  type RejectRequestInput,
  rejectRequestSchema,
} from '@/lib/validations/requests'
import { type SecurityRequestInput, securityRequestSchema } from '@/lib/validations/security'
import { m } from '@/paraglide/messages'

const requestWrite = requirePermission({ securityRequest: ['write'] })
const requestResolve = requirePermission({ securityRequest: ['resolve'] })

function toMessage(error: unknown, fallback: string) {
  return errorMessage(error, {
    fallback,
    service: {
      not_found: m.common_request_not_found(),
      category_kind: m.requests_category_must_be_expense(),
      transfer_needs_reference: m.requests_reference_required(),
      rejection_needs_reason: m.requests_reason_required(),
    },
  })
}

/** Every request the board can see, newest date first. */
const fetchSecurityRequestsFn = createServerFn()
  .middleware([boardMiddleware])
  .handler(async () => {
    const list = await db.query.securityRequests.findMany({
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
        createdByUser: { columns: { name: true } },
        resolvedByUser: { columns: { name: true } },
        transaction: { columns: { id: true, occurredOn: true, paymentMethod: true, reference: true } },
      },
      orderBy: { requestedOn: 'desc', createdAt: 'desc' },
    })

    return list.map(({ createdByUser, resolvedByUser, ...request }) => ({
      ...request,
      requester: createdByUser,
      resolver: resolvedByUser,
    }))
  })

export const fetchSecurityRequests = () => fetchSecurityRequestsFn()

const createSecurityRequestFn = createServerFn({ method: 'POST' })
  .middleware([requestWrite])
  .validator((input: SecurityRequestInput) => input)
  .handler(async ({ data: input, context }): Promise<ActionResult<{ id: string }>> => {
    const parsed = securityRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { kind, title, details, amount, requestedOn } = parsed.data

    try {
      const created = await transactionAs(context.user.id, (tx) =>
        requests.createRequest(tx, securityRequests, context.user, {
          kind,
          title,
          details: details || null,
          amount,
          requestedOn,
        }),
      )
      return { data: created }
    } catch (error) {
      return { error: toMessage(error, m.requests_create_failed()) }
    }
  })

export const createSecurityRequest = (input: SecurityRequestInput) => createSecurityRequestFn({ data: input })

/** Only while pending. */
const updateSecurityRequestFn = createServerFn({ method: 'POST' })
  .middleware([requestWrite])
  .validator((data: { id: string; input: SecurityRequestInput }) => data)
  .handler(async ({ data: { id, input }, context }): Promise<ActionResult> => {
    const parsed = securityRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { kind, title, details, amount, requestedOn } = parsed.data

    try {
      await transactionAs(context.user.id, (tx) =>
        requests.updateRequest(tx, securityRequests, id, {
          kind,
          title,
          details: details || null,
          amount,
          requestedOn,
        }),
      )
    } catch (error) {
      return { error: toMessage(error, m.requests_update_failed()) }
    }

    return { data: undefined }
  })

export const updateSecurityRequest = (id: string, input: SecurityRequestInput) =>
  updateSecurityRequestFn({ data: { id, input } })

/** Only while pending. */
const deleteSecurityRequestFn = createServerFn({ method: 'POST' })
  .middleware([requestWrite])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }): Promise<ActionResult> => {
    try {
      await transactionAs(context.user.id, (tx) => requests.deleteRequest(tx, securityRequests, id))
    } catch (error) {
      return { error: toMessage(error, m.requests_delete_failed()) }
    }

    return { data: undefined }
  })

export const deleteSecurityRequest = (id: string) => deleteSecurityRequestFn({ data: id })

/** Records the expense in the ledger and marks the request paid, atomically. */
const paySecurityRequestFn = createServerFn({ method: 'POST' })
  .middleware([requestResolve])
  .validator((data: { id: string; input: PayRequestInput }) => data)
  .handler(async ({ data: { id, input }, context }): Promise<ActionResult<{ transactionId: string }>> => {
    const parsed = payRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { categoryId, occurredOn, paymentMethod, reference, notes } = parsed.data

    try {
      const paid = await transactionAs(context.user.id, (tx) =>
        requests.payRequest(tx, securityRequests, context.user, id, {
          categoryId,
          occurredOn,
          paymentMethod,
          reference: reference || null,
          notes: notes || null,
        }),
      )
      return { data: paid }
    } catch (error) {
      return { error: toMessage(error, m.requests_pay_failed()) }
    }
  })

export const paySecurityRequest = (id: string, input: PayRequestInput) =>
  paySecurityRequestFn({ data: { id, input } })

const rejectSecurityRequestFn = createServerFn({ method: 'POST' })
  .middleware([requestResolve])
  .validator((data: { id: string; input: RejectRequestInput }) => data)
  .handler(async ({ data: { id, input }, context }): Promise<ActionResult> => {
    const parsed = rejectRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    try {
      await transactionAs(context.user.id, (tx) =>
        requests.rejectRequest(tx, securityRequests, context.user, id, parsed.data.reason),
      )
    } catch (error) {
      return { error: toMessage(error, m.requests_reject_failed()) }
    }

    return { data: undefined }
  })

export const rejectSecurityRequest = (id: string, input: RejectRequestInput) =>
  rejectSecurityRequestFn({ data: { id, input } })

/** Rejected → pending again, so the same request can be fixed and paid. */
const reopenSecurityRequestFn = createServerFn({ method: 'POST' })
  .middleware([requestResolve])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }): Promise<ActionResult> => {
    try {
      await transactionAs(context.user.id, (tx) => requests.reopenRequest(tx, securityRequests, id))
    } catch (error) {
      return { error: toMessage(error, m.requests_reopen_failed_retry()) }
    }

    return { data: undefined }
  })

export const reopenSecurityRequest = (id: string) => reopenSecurityRequestFn({ data: id })

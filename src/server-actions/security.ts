import type { PostgrestError } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'
import {
  type ActionResult,
  FK_VIOLATION,
  postgrestErrorMessage,
  requestResolutionErrorMessage,
} from '@/lib/action-result'
import { createClient } from '@/lib/supabase/server'
import {
  type PayRequestInput,
  payRequestSchema,
  type RejectRequestInput,
  rejectRequestSchema,
} from '@/lib/validations/requests'
import { type SecurityRequestInput, securityRequestSchema } from '@/lib/validations/security'
import { m } from '@/paraglide/messages'

function toMessage(error: PostgrestError, fallback: string) {
  return postgrestErrorMessage(error, { fallback })
}

const createSecurityRequestFn = createServerFn({ method: 'POST' })
  .validator((input: SecurityRequestInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = securityRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { kind, title, details, amount, requested_on } = parsed.data
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('security_requests')
      .insert({ kind, title, details: details || null, amount, requested_on })
      .select('id')
      .single()

    if (error) {
      return { error: toMessage(error, m.requests_create_failed()) }
    }

    return { data }
  })

export const createSecurityRequest = (input: SecurityRequestInput) => createSecurityRequestFn({ data: input })

/** Only while pending: RLS filters out resolved rows, which surfaces as "no permission". */
const updateSecurityRequestFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: SecurityRequestInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = securityRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { kind, title, details, amount, requested_on } = parsed.data
    const supabase = await createClient()

    const { error } = await supabase
      .from('security_requests')
      .update({ kind, title, details: details || null, amount, requested_on })
      .eq('id', id)
      .select('id')
      .single()

    if (error) {
      return { error: toMessage(error, m.requests_update_failed()) }
    }

    return { data: undefined }
  })

export const updateSecurityRequest = (id: string, input: SecurityRequestInput) =>
  updateSecurityRequestFn({ data: { id, input } })

const deleteSecurityRequestFn = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ActionResult> => {
    const supabase = await createClient()

    const { error } = await supabase.from('security_requests').delete().eq('id', id).select('id').single()

    if (error) {
      return { error: toMessage(error, m.requests_delete_failed()) }
    }

    return { data: undefined }
  })

export const deleteSecurityRequest = (id: string) => deleteSecurityRequestFn({ data: id })

/** Records the expense in the ledger and marks the request paid, atomically. */
const paySecurityRequestFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: PayRequestInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult<{ transaction_id: string }>> => {
    const parsed = payRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { category_id, occurred_on, payment_method, reference, notes } = parsed.data
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('pay_security_request', {
      p_request_id: id,
      p_category_id: category_id,
      p_occurred_on: occurred_on,
      p_payment_method: payment_method,
      p_reference: reference || undefined,
      p_notes: notes || undefined,
    })

    if (error) {
      if (error.code === FK_VIOLATION) return { error: m.requests_category_must_be_expense() }
      return {
        error: requestResolutionErrorMessage(error, m.requests_pay_failed()),
      }
    }

    return { data: { transaction_id: data } }
  })

export const paySecurityRequest = (id: string, input: PayRequestInput) =>
  paySecurityRequestFn({ data: { id, input } })

const rejectSecurityRequestFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: RejectRequestInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = rejectRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const supabase = await createClient()

    const { error } = await supabase.rpc('reject_security_request', {
      p_request_id: id,
      p_reason: parsed.data.reason,
    })

    if (error) {
      return {
        error: requestResolutionErrorMessage(error, m.requests_reject_failed()),
      }
    }

    return { data: undefined }
  })

export const rejectSecurityRequest = (id: string, input: RejectRequestInput) =>
  rejectSecurityRequestFn({ data: { id, input } })

/** Rejected → pending again, so the same request can be fixed and paid. */
const reopenSecurityRequestFn = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ActionResult> => {
    const supabase = await createClient()

    const { error } = await supabase.rpc('reopen_security_request', { p_request_id: id })

    if (error) {
      return {
        error: requestResolutionErrorMessage(error, m.requests_reopen_failed_retry()),
      }
    }

    return { data: undefined }
  })

export const reopenSecurityRequest = (id: string) => reopenSecurityRequestFn({ data: id })

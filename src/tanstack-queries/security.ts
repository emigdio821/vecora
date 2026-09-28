import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const SECURITY_QUERY_KEY = 'security'

function requestsQuery() {
  return createClient()
    .from('security_requests')
    .select(
      `
      id, kind, title, details, amount, requested_on, status, rejection_reason, resolved_at, created_at,
      requester:profiles!created_by ( full_name ),
      resolver:profiles!resolved_by ( full_name ),
      transaction:transactions!transaction_id ( id, occurred_on, payment_method, reference )
      `,
    )
    .order('requested_on', { ascending: false })
    .order('created_at', { ascending: false })
}

export type SecurityRequestQueryData = QueryData<ReturnType<typeof requestsQuery>>[number]

export function securityRequestsQueryOptions() {
  return queryOptions({
    queryKey: [SECURITY_QUERY_KEY, 'requests'],
    queryFn: async () => {
      const { data, error } = await requestsQuery()
      if (error) throw error
      return data
    },
  })
}

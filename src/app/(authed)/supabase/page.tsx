import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Temporary smoke test for the Supabase connection.
 * Lives under (authed), so the layout has already verified the session.
 */
export default async function Page() {
  const supabase = await createClient()

  const { data: claims } = await supabase.auth.getClaims()
  if (!claims) redirect('/login')

  const [{ data: roles, error: rolesError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', claims.claims.sub),
    supabase.from('profiles').select('id, full_name, unit_number'),
  ])

  const error = rolesError ?? profilesError

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Supabase smoke test</h1>
      <p>Signed in as: {claims.claims.email}</p>
      <p>Roles: {roles?.length ? roles.map((r) => r.role).join(', ') : 'none (regular member)'}</p>
      {error && <p className="text-red-600">Error: {error.message}</p>}
      <ul>
        {profiles?.map((profile) => (
          <li key={profile.id}>
            {profile.full_name || '(no name)'} {profile.unit_number && `— unit ${profile.unit_number}`}
          </li>
        ))}
      </ul>
    </main>
  )
}

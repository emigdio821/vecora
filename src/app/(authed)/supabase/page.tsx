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
    supabase
      .from('profiles')
      .select(
        'id, full_name, residents(first_name, last_name, property_residents(relationship, properties(number)))',
      ),
  ])

  const error = rolesError ?? profilesError

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Supabase smoke test</h1>
      <p>Signed in as: {claims.claims.email}</p>
      <p>Roles: {roles?.length ? roles.map((r) => r.role).join(', ') : 'none (regular member)'}</p>
      {error && <p className="text-red-600">Error: {error.message}</p>}
      <ul>
        {profiles?.map((profile) => {
          const resident = profile.residents
          return (
            <li key={profile.id}>
              {profile.full_name || '(no name)'}
              {resident && ` — ${resident.first_name} ${resident.last_name}`}
              {resident?.property_residents.length
                ? ` (${resident.property_residents.map((pr) => `${pr.relationship} of ${pr.properties.number}`).join(', ')})`
                : null}
            </li>
          )
        })}
      </ul>
    </main>
  )
}

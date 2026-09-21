import { createClient } from '@/lib/supabase/server'

/**
 * Temporary smoke test for the Supabase connection.
 * The anon role has no table grants, so we only query when signed in.
 */
export default async function Page() {
  const supabase = await createClient()

  const { data: claims } = await supabase.auth.getClaims()

  if (!claims) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Supabase smoke test</h1>
        <p>Connected. Sign in to see the member directory.</p>
      </main>
    )
  }

  const { data: profiles, error } = await supabase.from('profiles').select('id, full_name, unit_number')

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Supabase smoke test</h1>
      <p>Signed in as: {claims.claims.email}</p>
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

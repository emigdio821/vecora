// Neon's connection strings ask for sslmode=require. node-postgres reads that
// as verify-full (the certificate is checked against the host), but warns on
// every connection that its next major version will follow libpq, where
// require skips that check. Asking for verify-full outright keeps today's
// behaviour and the warning goes away. Neon's certificates are publicly
// trusted, so nothing else is needed.
//
// No imports on purpose: drizzle.config.ts loads it too.
export function withVerifiedSsl(connectionString: string): string {
  const url = new URL(connectionString)
  const mode = url.searchParams.get('sslmode')
  if (mode === 'prefer' || mode === 'require' || mode === 'verify-ca') {
    url.searchParams.set('sslmode', 'verify-full')
  }
  return url.toString()
}

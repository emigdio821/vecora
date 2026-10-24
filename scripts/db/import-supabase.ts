/**
 * Copies the HOA's data from the Supabase database (the app on `main`) into
 * the Neon branch in .env.local, keeping every id and timestamp: the
 * movements, who recorded them and the activity log read as they did there.
 *
 *   npm run db:import              copy, check, commit
 *   npm run db:import -- --dry-run   copy and check, then roll everything back
 *
 * The branch must hold the schema and nothing else: `npm run db:reset:schema`
 * on a development branch, `npm run db:migrate` on a new production one.
 * Supabase is only read, from one read-only snapshot, so the import is
 * consistent even if someone is using the old app meanwhile.
 *
 * Accounts keep their id, email, name and roles, but not their password
 * (Supabase's hashes don't carry over to Better Auth): board members get in
 * with a new access link from HOA board. The main admin gets a one-time
 * password, printed at the end, that it must replace at its first sign-in.
 *
 * Not copied: the logo (upload it again in Settings) and Supabase's own
 * schemas (auth, storage).
 */
import { randomBytes, randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { hashPassword } from 'better-auth/crypto'
import pg from 'pg'
import { type AppRole, formatRoles, parseRoles } from '../../src/lib/auth/roles'
import { withVerifiedSsl } from '../../src/lib/db/connection-string'

const ROOT = join(import.meta.dirname, '..', '..')

if (existsSync(join(ROOT, '.env.local'))) {
  process.loadEnvFile(join(ROOT, '.env.local'))
}

const branch = process.env.NEON_BRANCH
const targetUrl = process.env.DATABASE_URL_UNPOOLED
const sourceUrl = process.env.SUPABASE_DB_URL
if (!branch || !targetUrl) {
  throw new Error(
    'NEON_BRANCH and DATABASE_URL_UNPOOLED must be set (.env.local, from `neon checkout <branch>`)',
  )
}
if (!sourceUrl) {
  throw new Error('SUPABASE_DB_URL is missing (see .env.example)')
}

const dryRun = process.argv.includes('--dry-run')

type Row = Array<string | null>
type Snapshot = Record<string, unknown>

interface CopiedTable {
  name: string
  /** Neon's columns, in insert order. */
  columns: string[]
  /** Supabase's name for a column Neon renamed. */
  renamed?: Record<string, string>
}

// In foreign key order. Same tables and columns on both sides, but for the
// accounts (copied by importUsers) and residents' link to them.
const TABLES: CopiedTable[] = [
  {
    name: 'transaction_categories',
    columns: ['id', 'kind', 'name', 'key', 'is_active', 'created_at', 'updated_at'],
  },
  {
    name: 'properties',
    columns: ['id', 'number', 'notes', 'created_at', 'updated_at', 'deleted_at', 'deleted_by'],
  },
  {
    name: 'residents',
    columns: [
      'id',
      'user_id',
      'first_name',
      'last_name',
      'phone',
      'email',
      'notes',
      'created_at',
      'updated_at',
      'deleted_at',
      'deleted_by',
    ],
    renamed: { user_id: 'profile_id' },
  },
  {
    name: 'property_residents',
    columns: ['property_id', 'resident_id', 'relationship', 'created_at'],
  },
  {
    name: 'periods',
    columns: [
      'id',
      'name',
      'starts_on',
      'ends_on',
      'monthly_fee',
      'late_fee',
      'due_day',
      'currency',
      'created_at',
      'updated_at',
    ],
  },
  {
    name: 'amenities',
    columns: ['id', 'name', 'default_fee', 'is_active', 'created_at', 'updated_at'],
  },
  {
    name: 'amenity_reservations',
    columns: [
      'id',
      'amenity_id',
      'property_id',
      'reserved_on',
      'amount',
      'currency',
      'notes',
      'cancelled_at',
      'cancelled_by',
      'created_by',
      'created_at',
      'updated_at',
    ],
  },
  {
    name: 'transactions',
    columns: [
      'id',
      'kind',
      'category_id',
      'period_id',
      'property_id',
      'amenity_reservation_id',
      'amount',
      'currency',
      'occurred_on',
      'fee_month',
      'payment_method',
      'folio',
      'reference',
      'description',
      'notes',
      'created_by',
      'created_at',
      'updated_at',
      'deleted_at',
      'deleted_by',
    ],
  },
  {
    name: 'maintenance_requests',
    columns: [
      'id',
      'title',
      'details',
      'amount',
      'currency',
      'requested_on',
      'status',
      'rejection_reason',
      'resolved_by',
      'resolved_at',
      'transaction_id',
      'created_by',
      'created_at',
      'updated_at',
    ],
  },
  {
    name: 'security_requests',
    columns: [
      'id',
      'kind',
      'title',
      'details',
      'amount',
      'currency',
      'requested_on',
      'status',
      'rejection_reason',
      'resolved_by',
      'resolved_at',
      'transaction_id',
      'created_by',
      'created_at',
      'updated_at',
    ],
  },
  {
    name: 'document_templates',
    columns: [
      'id',
      'name',
      'description',
      'header_title',
      'title',
      'content',
      'created_by',
      'created_at',
      'updated_at',
    ],
  },
]

/**
 * Supabase signs its database certificates with its own CA, not a public
 * one: SUPABASE_DB_CA is the file its dashboard downloads (see .env.example).
 * Without it, the system's CAs.
 */
function sourceClient(connectionString: string): pg.Client {
  const url = new URL(connectionString)
  // The ssl option below decides; an sslmode in the URL would override it.
  url.searchParams.delete('sslmode')

  let ssl: pg.ClientConfig['ssl'] = true
  let caPath = process.env.SUPABASE_DB_CA
  if (caPath) {
    // Written like a shell path; Node doesn't expand ~ on its own.
    if (caPath.startsWith('~/')) {
      caPath = join(homedir(), caPath.slice(2))
    }
    ssl = { ca: readFileSync(caPath, 'utf8') }
  }
  return new pg.Client({ connectionString: url.toString(), ssl })
}

/**
 * Every value as text, written back as text: Postgres casts it to the
 * column's type, so dates, amounts and json come through exactly as stored.
 */
async function readRows(source: pg.Client, table: CopiedTable): Promise<Row[]> {
  const select = table.columns
    .map((column) => {
      const sourceColumn = table.renamed?.[column] ?? column
      return `${pg.escapeIdentifier(sourceColumn)}::text`
    })
    .join(', ')
  const result = await source.query<Row>({
    text: `select ${select} from public.${pg.escapeIdentifier(table.name)} order by 1`,
    rowMode: 'array',
  })
  return result.rows
}

async function insertRows(target: pg.Client, table: string, columns: string[], rows: unknown[][]) {
  const columnList = columns.map((column) => pg.escapeIdentifier(column)).join(', ')
  // Well under Postgres's 65,535 parameters per statement.
  for (let start = 0; start < rows.length; start = start + 500) {
    const chunk = rows.slice(start, start + 500)
    const values = chunk.map((row, rowIndex) => {
      const params = row.map((_, columnIndex) => `$${rowIndex * columns.length + columnIndex + 1}`)
      return `(${params.join(', ')})`
    })
    await target.query(
      `insert into ${pg.escapeIdentifier(table)} (${columnList}) values ${values.join(', ')}`,
      chunk.flat(),
    )
  }
}

interface ImportedUser {
  id: string
  name: string
  email: string
  roles: Set<AppRole>
  createdAt: string
  updatedAt: string
  welcomedAt: string | null
  isMainAdmin: boolean
}

/** profiles + auth.users + user_roles, as Better Auth's users. */
async function importUsers(source: pg.Client, target: pg.Client): Promise<Map<string, ImportedUser>> {
  const { rows } = await source.query<{
    id: string
    name: string
    email: string
    roles: string
    createdAt: string
    updatedAt: string
    welcomedAt: string | null
    isMainAdmin: boolean
  }>(`
    select
      p.id::text, p.full_name as name, lower(u.email) as email,
      coalesce((select string_agg(r.role::text, ',') from public.user_roles r where r.user_id = p.id), '') as roles,
      p.created_at::text as "createdAt", p.updated_at::text as "updatedAt",
      p.welcomed_at::text as "welcomedAt", p.is_main_admin as "isMainAdmin"
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at
  `)

  const users = new Map<string, ImportedUser>()
  for (const row of rows) {
    users.set(row.id, { ...row, roles: new Set(parseRoles(row.roles)) })
  }

  await insertRows(
    target,
    'users',
    [
      'id',
      'name',
      'email',
      'email_verified',
      'role',
      'is_main_admin',
      'must_change_password',
      'welcomed_at',
      'created_at',
      'updated_at',
    ],
    [...users.values()].map((user) => [
      user.id,
      user.name,
      user.email,
      true,
      formatRoles([...user.roles]) || null,
      user.isMainAdmin,
      // Its one-time password (below) has to be replaced; everyone else
      // chooses theirs from an access link.
      user.isMainAdmin,
      user.welcomedAt,
      user.createdAt,
      user.updatedAt,
    ]),
  )
  return users
}

/** The main admin's one-time password, which the app makes it replace first. */
async function giveMainAdminPassword(target: pg.Client, users: Map<string, ImportedUser>) {
  const mainAdmin = [...users.values()].find((user) => user.isMainAdmin)
  if (!mainAdmin) {
    return null
  }

  const password = randomBytes(12).toString('base64url')
  await target.query(
    `insert into accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
     values ($1, $2, 'credential', $3, $4, now(), now())`,
    [randomUUID(), mainAdmin.id, mainAdmin.id, await hashPassword(password)],
  )
  return { email: mainAdmin.email, password }
}

interface SourceEntry {
  occurredAt: string
  identityId: string | null
  tableName: string
  operation: 'insert' | 'update' | 'delete'
  rowId: string | null
  label: string
  oldData: Snapshot | null
  newData: Snapshot | null
  changedFields: string[] | null
  refs: Record<string, string>
  txid: string
}

type TargetEntry = Omit<SourceEntry, 'identityId'> & { actorId: string | null }

function renameKey(snapshot: Snapshot | null, from: string, to: string): Snapshot | null {
  if (!snapshot || !(from in snapshot)) {
    return snapshot
  }
  const { [from]: value, ...rest } = snapshot
  return { ...rest, [to]: value }
}

/** A users row as Neon's trigger would have logged it. */
function userSnapshot(user: ImportedUser, roles: Set<AppRole>, profile: Snapshot | null): Snapshot {
  let name = user.name
  if (profile && typeof profile.full_name === 'string') {
    name = profile.full_name
  }
  return {
    id: user.id,
    name,
    email: user.email,
    email_verified: true,
    image: null,
    created_at: profile?.created_at ?? user.createdAt,
    updated_at: profile?.updated_at ?? user.updatedAt,
    role: formatRoles([...roles]) || null,
    banned: false,
    ban_reason: null,
    ban_expires: null,
    is_main_admin: user.isMainAdmin,
    must_change_password: profile?.must_change_password ?? false,
    welcomed_at: profile?.welcomed_at ?? user.welcomedAt,
  }
}

function applyRoleRow(roles: Set<AppRole>, entry: SourceEntry, direction: 'forward' | 'back') {
  const removed = direction === 'forward' ? entry.oldData : entry.newData
  const added = direction === 'forward' ? entry.newData : entry.oldData
  if (removed) {
    roles.delete(removed.role as AppRole)
  }
  if (added) {
    roles.add(added.role as AppRole)
  }
}

function roleRowUserId(entry: SourceEntry): string {
  const row = entry.newData ?? entry.oldData
  return String(row?.user_id)
}

/**
 * Supabase's log, in Neon's shape. Most entries copy as they are; the
 * accounts' change: Supabase kept them in profiles and user_roles (a row per
 * role), Neon in users (the roles comma-separated). So a profile's entry
 * becomes the account's, and the role rows one action wrote for a person
 * become one change of their roles, with the roles they held then.
 */
function convertLog(entries: SourceEntry[], users: Map<string, ImportedUser>): TargetEntry[] {
  // The roles each account held before the log's first entry: today's, with
  // every logged change undone from the newest back.
  const roles = new Map<string, Set<AppRole>>()
  for (const user of users.values()) {
    roles.set(user.id, new Set(user.roles))
  }
  for (const entry of [...entries].reverse()) {
    if (entry.tableName === 'user_roles') {
      const held = roles.get(roleRowUserId(entry))
      if (held) {
        applyRoleRow(held, entry, 'back')
      }
    }
  }

  // The role rows of one action for one person, and the accounts created in
  // that same action (their roles go into the account's entry).
  const groups = new Map<string, SourceEntry[]>()
  for (const entry of entries) {
    if (entry.tableName === 'user_roles') {
      const key = `${entry.txid}:${roleRowUserId(entry)}`
      groups.set(key, [...(groups.get(key) ?? []), entry])
    }
  }

  const converted: TargetEntry[] = []
  for (const entry of entries) {
    let actorId: string | null = null
    if (entry.identityId && users.has(entry.identityId)) {
      actorId = entry.identityId
    }
    const base = {
      occurredAt: entry.occurredAt,
      actorId,
      operation: entry.operation,
      rowId: entry.rowId,
      label: entry.label,
      refs: entry.refs,
      txid: entry.txid,
    }

    if (entry.tableName === 'user_roles') {
      const userId = roleRowUserId(entry)
      const key = `${entry.txid}:${userId}`
      const group = groups.get(key) ?? []
      const user = users.get(userId)
      const held = roles.get(userId)
      // The whole group is handled at its first row.
      if (group[0] !== entry || !user || !held) {
        continue
      }

      const before = new Set(held)
      for (const row of group) {
        applyRoleRow(held, row, 'forward')
      }
      const createdNow = entries.some(
        (other) =>
          other.tableName === 'profiles' &&
          other.operation === 'insert' &&
          other.txid === entry.txid &&
          other.rowId === userId,
      )
      if (createdNow || formatRoles([...before]) === formatRoles([...held])) {
        continue
      }

      // As they were named then: the role row's label.
      const name = entry.label || user.name
      converted.push({
        ...base,
        tableName: 'users',
        operation: 'update',
        rowId: userId,
        label: name,
        oldData: { ...userSnapshot(user, before, null), name },
        newData: { ...userSnapshot(user, new Set(held), null), name },
        changedFields: ['role'],
        refs: {},
      })
      continue
    }

    if (entry.tableName === 'profiles') {
      const user = entry.rowId ? users.get(entry.rowId) : undefined
      if (!user) {
        continue
      }
      const held = new Set(roles.get(user.id) ?? [])
      // Created with its roles in one action: the account's entry carries them.
      if (entry.operation === 'insert') {
        for (const row of groups.get(`${entry.txid}:${user.id}`) ?? []) {
          applyRoleRow(held, row, 'forward')
        }
      }
      converted.push({
        ...base,
        tableName: 'users',
        oldData: entry.oldData ? userSnapshot(user, held, entry.oldData) : null,
        newData: entry.newData ? userSnapshot(user, held, entry.newData) : null,
        changedFields: entry.changedFields?.map((field) => (field === 'full_name' ? 'name' : field)) ?? null,
      })
      continue
    }

    if (entry.tableName === 'residents') {
      converted.push({
        ...base,
        tableName: entry.tableName,
        oldData: renameKey(entry.oldData, 'profile_id', 'user_id'),
        newData: renameKey(entry.newData, 'profile_id', 'user_id'),
        changedFields:
          entry.changedFields?.map((field) => (field === 'profile_id' ? 'user_id' : field)) ?? null,
      })
      continue
    }

    converted.push({
      ...base,
      tableName: entry.tableName,
      oldData: entry.oldData,
      newData: entry.newData,
      changedFields: entry.changedFields,
    })
  }
  return converted
}

async function importLog(source: pg.Client, target: pg.Client, users: Map<string, ImportedUser>) {
  const { rows } = await source.query<SourceEntry>(`
    select
      occurred_at::text as "occurredAt", identity_id::text as "identityId", table_name as "tableName",
      operation::text as operation, row_id::text as "rowId", label,
      old_data as "oldData", new_data as "newData", to_jsonb(changed_fields) as "changedFields",
      refs, txid::text as txid
    from public.audit_log
    order by id
  `)
  const entries = convertLog(rows, users)

  // In order, so the new ids keep it.
  await insertRows(
    target,
    'audit_log',
    [
      'occurred_at',
      'actor_id',
      'table_name',
      'operation',
      'row_id',
      'label',
      'old_data',
      'new_data',
      'changed_fields',
      'refs',
      'txid',
    ],
    entries.map((entry) => [
      entry.occurredAt,
      entry.actorId,
      entry.tableName,
      entry.operation,
      entry.rowId,
      entry.label,
      entry.oldData ? JSON.stringify(entry.oldData) : null,
      entry.newData ? JSON.stringify(entry.newData) : null,
      entry.changedFields,
      JSON.stringify(entry.refs),
      entry.txid,
    ]),
  )
  return { read: rows.length, written: entries.length }
}

interface Check {
  name: string
  source: string
  target: string
}

const LEDGER = `
  select period_id::text, kind::text, count(*)::text, sum(amount)::text
  from public.transactions where deleted_at is null
  group by 1, 2 order by 1, 2
`

const CHECKS: Check[] = [
  {
    name: 'accounts',
    source: 'select count(*)::text from public.profiles',
    target: 'select count(*)::text from public.users',
  },
  {
    name: 'board members',
    source: 'select count(distinct user_id)::text from public.user_roles',
    target: `select count(*)::text from public.users where coalesce(role, '') <> ''`,
  },
  ...TABLES.map((table) => {
    const count = `select count(*)::text from public.${pg.escapeIdentifier(table.name)}`
    return { name: table.name, source: count, target: count }
  }),
  { name: 'ledger per period (rows, totals)', source: LEDGER, target: LEDGER },
  {
    name: 'settings',
    source: 'select residential_name, default_language::text, currency::text from public.settings',
    target: 'select residential_name, default_language::text, currency::text from public.settings',
  },
]

/** Both sides, check by check. Any difference throws, and the import rolls back. */
async function verify(source: pg.Client, target: pg.Client) {
  let failed = false
  for (const check of CHECKS) {
    const expected = await source.query({ text: check.source, rowMode: 'array' })
    const actual = await target.query({ text: check.target, rowMode: 'array' })
    const same = JSON.stringify(expected.rows) === JSON.stringify(actual.rows)
    if (!same) {
      failed = true
    }
    let summary = `${expected.rows.length} rows`
    if (expected.rows.length === 1) {
      summary = expected.rows[0].join(', ')
    }
    console.log(`  ${same ? 'ok  ' : 'DIFF'} ${check.name}: ${summary}`)
  }
  if (failed) {
    throw new Error('Neon differs from Supabase (DIFF above); nothing was imported')
  }
}

const source = sourceClient(sourceUrl)
const target = new pg.Client({ connectionString: withVerifiedSsl(targetUrl) })
await source.connect()
await target.connect()

try {
  // One snapshot of Supabase for every read, checks included.
  await source.query('begin isolation level repeatable read read only')
  await target.query('begin')

  const { rows } = await target.query<{ count: number }>('select count(*)::int as count from users')
  if (rows[0].count > 0) {
    throw new Error(
      `The ${branch} branch already has accounts. Import into the bare schema: \`npm run db:reset:schema\` on a development branch, \`npm run db:migrate\` on a new production one`,
    )
  }
  console.log(`Importing from Supabase into the ${branch} branch${dryRun ? ' (dry run)' : ''}`)

  const users = await importUsers(source, target)
  const mainAdmin = await giveMainAdminPassword(target, users)

  const { rows: settingsRows } = await source.query<Row>({
    text: 'select residential_name, default_language::text, currency::text, updated_at::text from public.settings',
    rowMode: 'array',
  })
  await target.query(
    'update settings set residential_name = $1, default_language = $2, currency = $3, updated_at = $4',
    settingsRows[0],
  )

  // The migration's categories make way for Supabase's: their ids are the
  // ones the movements point at, and the board may have renamed or added some.
  await target.query('delete from transaction_categories')
  for (const table of TABLES) {
    const tableRows = await readRows(source, table)
    await insertRows(target, table.name, table.columns, tableRows)
  }

  // The trigger logged every row above as a new one, today: those entries go,
  // and Supabase's history takes their place.
  await target.query('delete from audit_log where txid = pg_current_xact_id()::text::bigint')
  const log = await importLog(source, target, users)
  console.log(`  ${log.read} activity log entries, ${log.written} in Neon's shape`)

  console.log('Checking against Supabase:')
  await verify(source, target)

  if (dryRun) {
    await target.query('rollback')
    console.log('Dry run: everything checked out, nothing was kept')
  } else {
    await target.query('commit')
    console.log(`Imported into the ${branch} branch`)
    if (mainAdmin) {
      console.log(
        `Main admin: ${mainAdmin.email}, one-time password ${mainAdmin.password} (it must replace it)`,
      )
    }
    console.log('Upload the logo again in Settings, and send the board their access links from HOA board')
  }
} catch (error) {
  await target.query('rollback')
  throw error
} finally {
  await source.query('rollback')
  await source.end()
  await target.end()
}

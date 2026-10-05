import type { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatDay, formatMonth, getRoleLabel } from '@/lib/utils'
import type { LogEntryQueryData } from '@/tanstack-queries/logs'

/*
 * Turns raw audit rows (table names, column names, enum values, jsonb) into
 * the Spanish the admin reads in the activity log table and drawer.
 */

export type RowData = Record<string, unknown>

/** Same order as the sidebar so the filter feels familiar. */
export const SECTION_LABEL: Record<string, string> = {
  transactions: 'Movimientos',
  transaction_categories: 'Categorías de movimientos',
  periods: 'Periodos',
  amenity_reservations: 'Reservaciones',
  amenities: 'Áreas comunes',
  maintenance_requests: 'Mantenimiento',
  security_requests: 'Seguridad',
  user_roles: 'Mesa directiva',
  profiles: 'Cuentas de acceso',
  properties: 'Casas',
  residents: 'Residentes',
  property_residents: 'Casas y residentes',
  settings: 'Ajustes',
}

export const SECTIONS = Object.keys(SECTION_LABEL)

export function sectionLabel(tableName: string) {
  return SECTION_LABEL[tableName] ?? tableName
}

/** Derived from the operation and, for updates, from what changed. */
export type LogAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'restored'
  | 'paid'
  | 'rejected'
  | 'reopened'
  | 'cancelled'

export const ACTIONS: LogAction[] = [
  'created',
  'updated',
  'deleted',
  'restored',
  'paid',
  'rejected',
  'reopened',
  'cancelled',
]

export const ACTION_LABEL: Record<LogAction, string> = {
  created: 'Creó',
  updated: 'Editó',
  deleted: 'Eliminó',
  restored: 'Restauró',
  paid: 'Pagó',
  rejected: 'Rechazó',
  reopened: 'Reabrió',
  cancelled: 'Canceló',
}

export const ACTION_BADGE_VARIANT: Record<LogAction, React.ComponentProps<typeof Badge>['variant']> = {
  created: 'success',
  updated: 'info',
  deleted: 'error',
  restored: 'secondary',
  paid: 'success',
  rejected: 'warning',
  reopened: 'secondary',
  cancelled: 'warning',
}

export function entryAction(entry: LogEntryQueryData): LogAction {
  if (entry.operation === 'insert') return 'created'
  if (entry.operation === 'delete') return 'deleted'

  const changed = entry.changed_fields ?? []
  const after = (entry.new_data ?? {}) as RowData

  // Houses, residents and transactions are soft-deleted: an update to deleted_at.
  if (changed.includes('deleted_at')) return after.deleted_at ? 'deleted' : 'restored'
  // Request status changes only through the treasurer's RPCs; back to pending is a reopen.
  if (changed.includes('status')) {
    if (after.status === 'paid') return 'paid'
    if (after.status === 'rejected') return 'rejected'
    if (after.status === 'pending') return 'reopened'
  }
  // Paid bookings are cancelled, not deleted, by the treasurer's RPC.
  if (changed.includes('cancelled_at')) return 'cancelled'
  return 'updated'
}

export const SYSTEM_IDENTITY = 'Sistema'

/** Who made the change; "Sistema" when no user was signed in (triggers, jobs, seeds). */
export function identityName(entry: LogEntryQueryData) {
  return entry.identity?.full_name || SYSTEM_IDENTITY
}

/** The row's own data: what it looked like after the change, or before if it was deleted. */
export function entryRow(entry: LogEntryQueryData): RowData {
  return (entry.new_data ?? entry.old_data ?? {}) as RowData
}

function refName(entry: LogEntryQueryData, id: unknown) {
  const refs = (entry.refs ?? {}) as Record<string, string>
  return typeof id === 'string' ? refs[id] : undefined
}

/** jsonb values are `unknown`; only scalars have a sensible text form. */
function asText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

/** One line for the "what" column: the label plus whatever makes it unambiguous. */
export function entrySummary(entry: LogEntryQueryData): string {
  const row = entryRow(entry)
  const { label } = entry

  switch (entry.table_name) {
    case 'transactions': {
      // Descriptions don't name the house; the movement's property does.
      const house = refName(entry, row.property_id)
      const summary = house ? `${label} - Casa ${house}` : label
      return row.amount == null ? summary : `${summary} - ${formatCurrency(asText(row.amount))}`
    }
    case 'maintenance_requests':
    case 'security_requests':
      return row.amount == null ? label : `${label} - ${formatCurrency(asText(row.amount))}`
    case 'amenity_reservations': {
      const amenity = refName(entry, row.amenity_id)
      const summary = `${amenity ? `${amenity} - ` : ''}Casa ${label} - ${formatDay(asText(row.reserved_on))}`
      return row.amount == null ? summary : `${summary} - ${formatCurrency(asText(row.amount))}`
    }
    case 'property_residents': {
      const resident = refName(entry, row.resident_id) ?? 'Residente'
      const relationship = enumLabel(row.relationship)
      return `Casa ${label} - ${resident}${relationship ? ` (${relationship.toLowerCase()})` : ''}`
    }
    case 'properties':
      return `Casa ${label}`
    case 'user_roles':
      return `${enumLabel(row.role) ?? asText(row.role)} - ${label}`
    default:
      return label
  }
}

/* ----------------------------------------------------------------------------
 * Field-level details for the drawer
 * ------------------------------------------------------------------------- */

/** Column names are shared across tables, so one map covers them all. */
const FIELD_LABEL: Record<string, string> = {
  number: 'Número',
  notes: 'Notas',
  first_name: 'Nombre',
  last_name: 'Apellidos',
  full_name: 'Nombre',
  phone: 'Teléfono',
  email: 'Correo',
  name: 'Nombre',
  key: 'Clave',
  is_active: 'Activa',
  starts_on: 'Inicio',
  ends_on: 'Fin',
  monthly_fee: 'Cuota mensual',
  late_fee: 'Recargo',
  due_day: 'Día límite de pago',
  kind: 'Tipo',
  category_id: 'Categoría',
  period_id: 'Periodo',
  property_id: 'Casa',
  resident_id: 'Residente',
  profile_id: 'Cuenta',
  user_id: 'Cuenta',
  role: 'Rol',
  relationship: 'Relación',
  residential_name: 'Nombre del residencial',
  logo_path: 'Logo',
  amount: 'Monto',
  occurred_on: 'Fecha',
  requested_on: 'Fecha',
  reserved_on: 'Fecha de reserva',
  fee_month: 'Mes de la cuota',
  payment_method: 'Método de pago',
  folio: 'Folio',
  reference: 'Referencia',
  description: 'Concepto',
  title: 'Concepto',
  details: 'Detalles',
  status: 'Estado',
  rejection_reason: 'Motivo del rechazo',
  transaction_id: 'Movimiento',
  amenity_id: 'Área',
  amenity_reservation_id: 'Reservación',
  default_fee: 'Tarifa sugerida',
  created_by: 'Registrado por',
  granted_by: 'Otorgado por',
  resolved_by: 'Resuelto por',
  resolved_at: 'Fecha de resolución',
  cancelled_at: 'Fecha de cancelación',
  cancelled_by: 'Cancelado por',
  deleted_at: 'Fecha de eliminación',
  deleted_by: 'Eliminado por',
  created_at: 'Fecha de registro',
  is_main_admin: 'Administrador principal',
  welcomed_at: 'Vio la introducción',
}

export function fieldLabel(field: string) {
  return FIELD_LABEL[field] ?? field
}

/** Bookkeeping columns nobody needs to see; `key` is a category's internal code. */
const HIDDEN_FIELDS = new Set(['id', 'updated_at', 'singleton', 'key'])

const CURRENCY_FIELDS = new Set(['amount', 'monthly_fee', 'late_fee', 'default_fee'])
const DAY_FIELDS = new Set(['occurred_on', 'requested_on', 'reserved_on', 'starts_on', 'ends_on'])
const TIMESTAMP_FIELDS = new Set(['created_at', 'resolved_at', 'cancelled_at', 'deleted_at', 'welcomed_at'])

/** Enum values don't collide across tables, so one flat map is enough. */
const ENUM_LABEL: Record<string, string> = {
  income: 'Ingreso',
  expense: 'Egreso',
  cash: 'Efectivo',
  transfer: 'Transferencia',
  pending: 'Pendiente',
  paid: 'Pagada',
  rejected: 'Rechazada',
  owner: 'Propietario',
  tenant: 'Inquilino',
  family: 'Familiar',
  cameras: 'Cámaras',
  guards: 'Guardias',
  access: 'Accesos',
  equipment: 'Equipo',
  other: 'Otro',
}

function enumLabel(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  return ENUM_LABEL[value] ?? (getRoleLabel(value) !== value ? getRoleLabel(value) : undefined)
}

/** Human version of one column value; empty string when there's nothing to show. */
export function formatFieldValue(entry: LogEntryQueryData, field: string, value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  const text = asText(value)
  if (CURRENCY_FIELDS.has(field)) return formatCurrency(text)
  if (field === 'fee_month') return formatMonth(text)
  if (DAY_FIELDS.has(field)) return formatDay(text)
  if (TIMESTAMP_FIELDS.has(field)) return formatDate(text)
  return refName(entry, value) ?? enumLabel(value) ?? text
}

export interface FieldChange {
  field: string
  before: string
  after: string
}

/**
 * What to list in the drawer: every column on create/delete, only the changed
 * ones on update. Empty values are dropped on create/delete since they say nothing.
 */
export function entryChanges(entry: LogEntryQueryData): FieldChange[] {
  const before = (entry.old_data ?? {}) as RowData
  const after = (entry.new_data ?? {}) as RowData

  const fields =
    entry.operation === 'update'
      ? (entry.changed_fields ?? [])
      : Object.keys(entry.operation === 'insert' ? after : before)

  return fields
    .filter((field) => !HIDDEN_FIELDS.has(field))
    .map((field) => ({
      field,
      before: formatFieldValue(entry, field, before[field]),
      after: formatFieldValue(entry, field, after[field]),
    }))
    .filter((change) => change.before || change.after)
}

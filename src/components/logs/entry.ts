import type { Badge } from '@/components/ui/badge'
import {
  CURRENCIES,
  formatCurrency,
  formatDate,
  formatDay,
  formatMonth,
  getRoleLabel,
  intlLocale,
  MONEY_FORMAT,
} from '@/lib/utils'
import { LANGUAGE_LABEL } from '@/lib/validations/settings'
import { m } from '@/paraglide/messages'
import type { LogEntryQueryData } from '@/tanstack-queries/logs'

/*
 * Turns raw audit rows (table names, column names, enum values, jsonb) into
 * the Spanish the admin reads in the activity log table and drawer.
 */

export type RowData = Record<string, unknown>

/** Same order as the sidebar so the filter feels familiar. */
export const SECTION_LABEL: Record<string, string> = {
  get transactions() {
    return m.common_section_transactions()
  },
  get transaction_categories() {
    return m.logs_section_transaction_categories()
  },
  get periods() {
    return m.common_section_periods()
  },
  get amenity_reservations() {
    return m.common_section_reservations()
  },
  get amenities() {
    return m.common_section_amenities()
  },
  get maintenance_requests() {
    return m.common_section_maintenance()
  },
  get security_requests() {
    return m.common_section_security()
  },
  get user_roles() {
    return m.common_section_hoa_board()
  },
  get profiles() {
    return m.logs_section_profiles()
  },
  get properties() {
    return m.common_section_houses()
  },
  get residents() {
    return m.common_section_residents()
  },
  get property_residents() {
    return m.logs_section_property_residents()
  },
  get settings() {
    return m.common_section_settings()
  },
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
  get created() {
    return m.logs_action_created()
  },
  get updated() {
    return m.logs_action_updated()
  },
  get deleted() {
    return m.logs_action_deleted()
  },
  get restored() {
    return m.logs_action_restored()
  },
  get paid() {
    return m.logs_action_paid()
  },
  get rejected() {
    return m.logs_action_rejected()
  },
  get reopened() {
    return m.logs_action_reopened()
  },
  get cancelled() {
    return m.logs_action_cancelled()
  },
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

/** Who made the change; "Sistema" when no user was signed in (triggers, jobs, seeds). */
export function identityName(entry: LogEntryQueryData) {
  return entry.identity?.full_name || m.common_system()
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

/**
 * The log mixes rows from any point in time, so amounts always carry their
 * code. Amenity fees have no currency of their own: just the number.
 */
function formatAmount(row: RowData, value: unknown): string {
  const currency = CURRENCIES.find((c) => c === row.currency)
  const text = asText(value)
  return currency
    ? `${formatCurrency(text, currency)} ${currency}`
    : new Intl.NumberFormat(intlLocale(), MONEY_FORMAT).format(Number(text))
}

/** One line for the "what" column: the label plus whatever makes it unambiguous. */
export function entrySummary(entry: LogEntryQueryData): string {
  const row = entryRow(entry)
  const { label } = entry

  switch (entry.table_name) {
    case 'transactions': {
      // Descriptions don't name the house; the movement's property does.
      const house = refName(entry, row.property_id)
      const summary = house ? `${label} - ${m.common_house_label({ number: house })}` : label
      return row.amount == null ? summary : `${summary} - ${formatAmount(row, row.amount)}`
    }
    case 'maintenance_requests':
    case 'security_requests':
      return row.amount == null ? label : `${label} - ${formatAmount(row, row.amount)}`
    case 'amenity_reservations': {
      const amenity = refName(entry, row.amenity_id)
      const summary = `${amenity ? `${amenity} - ` : ''}${m.common_house_label({ number: label })} - ${formatDay(asText(row.reserved_on))}`
      return row.amount == null ? summary : `${summary} - ${formatAmount(row, row.amount)}`
    }
    case 'property_residents': {
      const resident = refName(entry, row.resident_id) ?? m.logs_resident()
      const relationship = enumLabel(row.relationship)
      return `${m.common_house_label({ number: label })} - ${resident}${relationship ? ` (${relationship.toLowerCase()})` : ''}`
    }
    case 'properties':
      return m.common_house_label({ number: label })
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
  get number() {
    return m.logs_field_number()
  },
  get notes() {
    return m.common_field_notes()
  },
  get first_name() {
    return m.logs_field_first_name()
  },
  get last_name() {
    return m.logs_field_last_name()
  },
  get full_name() {
    return m.common_field_name()
  },
  get phone() {
    return m.common_field_phone()
  },
  get email() {
    return m.common_field_email()
  },
  get name() {
    return m.common_field_name()
  },
  get key() {
    return m.logs_field_key()
  },
  get is_active() {
    return m.logs_field_is_active()
  },
  get starts_on() {
    return m.logs_field_starts_on()
  },
  get ends_on() {
    return m.logs_field_ends_on()
  },
  get monthly_fee() {
    return m.logs_field_monthly_fee()
  },
  get late_fee() {
    return m.logs_field_late_fee()
  },
  get due_day() {
    return m.logs_field_due_day()
  },
  get kind() {
    return m.common_field_type()
  },
  get category_id() {
    return m.common_field_category()
  },
  get period_id() {
    return m.logs_field_period()
  },
  get property_id() {
    return m.common_field_house()
  },
  get resident_id() {
    return m.logs_resident()
  },
  get profile_id() {
    return m.logs_field_account()
  },
  get user_id() {
    return m.logs_field_account()
  },
  get role() {
    return m.logs_field_role()
  },
  get relationship() {
    return m.logs_field_relationship()
  },
  get residential_name() {
    return m.logs_field_residential_name()
  },
  get logo_path() {
    return m.logs_field_logo()
  },
  get default_language() {
    return m.logs_field_default_language()
  },
  get configured_at() {
    return m.logs_field_configured_at()
  },
  get currency() {
    return m.logs_field_currency()
  },
  get amount() {
    return m.common_field_amount()
  },
  get occurred_on() {
    return m.common_field_date()
  },
  get requested_on() {
    return m.common_field_date()
  },
  get reserved_on() {
    return m.logs_field_reserved_on()
  },
  get fee_month() {
    return m.logs_field_fee_month()
  },
  get payment_method() {
    return m.common_field_payment_method()
  },
  get folio() {
    return m.common_field_folio()
  },
  get reference() {
    return m.common_field_reference()
  },
  get description() {
    return m.common_field_description()
  },
  get title() {
    return m.common_field_description()
  },
  get details() {
    return m.common_field_details()
  },
  get status() {
    return m.common_field_status()
  },
  get rejection_reason() {
    return m.logs_field_rejection_reason()
  },
  get transaction_id() {
    return m.logs_field_transaction()
  },
  get amenity_id() {
    return m.logs_field_amenity()
  },
  get amenity_reservation_id() {
    return m.logs_field_reservation()
  },
  get default_fee() {
    return m.logs_field_default_fee()
  },
  get created_by() {
    return m.logs_field_created_by()
  },
  get granted_by() {
    return m.logs_field_granted_by()
  },
  get resolved_by() {
    return m.logs_field_resolved_by()
  },
  get resolved_at() {
    return m.logs_field_resolved_at()
  },
  get cancelled_at() {
    return m.logs_field_cancelled_at()
  },
  get cancelled_by() {
    return m.logs_field_cancelled_by()
  },
  get deleted_at() {
    return m.logs_field_deleted_at()
  },
  get deleted_by() {
    return m.logs_field_deleted_by()
  },
  get created_at() {
    return m.logs_field_created_at()
  },
  get is_main_admin() {
    return m.logs_field_is_main_admin()
  },
  get welcomed_at() {
    return m.logs_field_welcomed_at()
  },
}

export function fieldLabel(field: string) {
  return FIELD_LABEL[field] ?? field
}

/** Bookkeeping columns nobody needs to see; `key` is a category's internal code. */
const HIDDEN_FIELDS = new Set(['id', 'updated_at', 'singleton', 'key'])

const CURRENCY_FIELDS = new Set(['amount', 'monthly_fee', 'late_fee', 'default_fee'])
const DAY_FIELDS = new Set(['occurred_on', 'requested_on', 'reserved_on', 'starts_on', 'ends_on'])
const TIMESTAMP_FIELDS = new Set([
  'created_at',
  'resolved_at',
  'cancelled_at',
  'deleted_at',
  'welcomed_at',
  'configured_at',
])

/** Enum values don't collide across tables, so one flat map is enough. */
const ENUM_LABEL: Record<string, string> = {
  get income() {
    return m.logs_enum_income()
  },
  get expense() {
    return m.logs_enum_expense()
  },
  get cash() {
    return m.common_payment_method_cash()
  },
  get transfer() {
    return m.common_payment_method_transfer()
  },
  get pending() {
    return m.logs_enum_pending()
  },
  get paid() {
    return m.logs_enum_paid()
  },
  get rejected() {
    return m.logs_enum_rejected()
  },
  get owner() {
    return m.common_relationship_owner()
  },
  get tenant() {
    return m.common_relationship_tenant()
  },
  get family() {
    return m.common_relationship_family()
  },
  get cameras() {
    return m.logs_enum_cameras()
  },
  get guards() {
    return m.logs_enum_guards()
  },
  get access() {
    return m.logs_enum_access()
  },
  get equipment() {
    return m.logs_enum_equipment()
  },
  get other() {
    return m.logs_enum_other()
  },
  ...LANGUAGE_LABEL,
}

function enumLabel(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  return ENUM_LABEL[value] ?? (getRoleLabel(value) !== value ? getRoleLabel(value) : undefined)
}

/** Human version of one column value; empty string when there's nothing to show. */
export function formatFieldValue(entry: LogEntryQueryData, field: string, value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'boolean') return value ? m.common_yes() : m.common_no()
  const text = asText(value)
  if (CURRENCY_FIELDS.has(field)) return formatAmount(entryRow(entry), value)
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

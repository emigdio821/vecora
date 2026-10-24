// The values of the database's enums, for the screens and the forms too: the
// schema builds its enums from these (src/lib/db/schema), so there's one list
// to edit. A new value then needs a migration (`npm run db:generate`).

export const CURRENCIES = ['MXN', 'USD'] as const
export type CurrencyCode = (typeof CURRENCIES)[number]

export const LANGUAGES = ['es', 'en'] as const
export type AppLanguage = (typeof LANGUAGES)[number]

export const PAYMENT_METHODS = ['cash', 'transfer'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const TRANSACTION_KINDS = ['income', 'expense'] as const
export type TransactionKind = (typeof TRANSACTION_KINDS)[number]

export const RELATIONSHIPS = ['owner', 'tenant', 'family', 'unconfirmed'] as const
export type Relationship = (typeof RELATIONSHIPS)[number]

export const REQUEST_STATUSES = ['pending', 'paid', 'rejected'] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export const SECURITY_REQUEST_KINDS = [
  'cameras',
  'guards',
  'access',
  'equipment',
  'supplies',
  'other',
] as const
export type SecurityRequestKind = (typeof SECURITY_REQUEST_KINDS)[number]

export const AUDIT_OPERATIONS = ['insert', 'update', 'delete'] as const
export type AuditOperation = (typeof AUDIT_OPERATIONS)[number]

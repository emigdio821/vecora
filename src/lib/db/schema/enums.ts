// Enums more than one area uses. The values are in src/lib/enums.ts, which
// the screens share: add one there and generate a migration.
import { pgEnum } from 'drizzle-orm/pg-core'
import { CURRENCIES, LANGUAGES, PAYMENT_METHODS, TRANSACTION_KINDS } from '../../enums'

export const currencyCode = pgEnum('currency_code', CURRENCIES)

export const paymentMethod = pgEnum('payment_method', PAYMENT_METHODS)

export const transactionKind = pgEnum('transaction_kind', TRANSACTION_KINDS)

export const appLanguage = pgEnum('app_language', LANGUAGES)

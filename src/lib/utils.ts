import { type ClassValue, clsx } from 'clsx'
import { format, isValid, type Locale as DateLocale, parseISO } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import { twMerge } from 'tailwind-merge'
import { Constants, type Database } from '@/lib/supabase/database.types'
import { m } from '@/paraglide/messages'
import { getLocale, type Locale } from '@/paraglide/runtime'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Spanish, but with capitalized months and days ("Septiembre 2026",
 * "12 Sep 2026", "Lunes", "Lu"), the way English already writes them.
 */
const esCapitalized: DateLocale = {
  ...es,
  localize: {
    ...es.localize,
    month: (month, options) => capitalize(es.localize.month(month, options)),
    day: (day, options) => capitalize(es.localize.day(day, options)),
  },
}

const DATE_LOCALES: Record<Locale, DateLocale> = { es: esCapitalized, en: enUS }

const INTL_LOCALES: Record<Locale, string> = { es: 'es-MX', en: 'en-US' }

/** English puts the month first and writes "PM", not "p.m.". */
const DATE_PATTERNS: Record<Locale, { day: string; dateTime: string }> = {
  es: { day: 'd MMM yyyy', dateTime: 'd MMM yyyy, h:mm aaaa' },
  en: { day: 'MMM d, yyyy', dateTime: 'MMM d, yyyy, h:mm a' },
}

/**
 * date-fns locale for every `format()`: the screen language by default, or a
 * given one (the PDF uses the HOA's). Read it at format time, never at module
 * level, since the language is per request.
 */
export function dateLocale(locale: Locale = getLocale()): DateLocale {
  return DATE_LOCALES[locale]
}

/** BCP 47 tag for Intl and the NumberField `locale` prop: "es-MX" or "en-US". */
export function intlLocale(locale: Locale = getLocale()): string {
  return INTL_LOCALES[locale]
}

export function getRoleLabel(roleName: string): string {
  switch (roleName) {
    case 'admin':
      return m.common_role_admin()
    case 'president':
      return m.common_role_president()
    case 'treasurer':
      return m.common_role_treasurer()
    case 'maintenance':
      return m.common_role_maintenance()
    case 'security':
      return m.common_role_security()
    default:
      return roleName
  }
}

/** Lowercase and strip accents so "López" matches "lopez". */
export function normalizeString(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** "22 Sep 2026, 10:15 a.m." from an ISO timestamp or Date. Empty when missing or invalid. */
export function formatDate(
  value: string | number | Date | null | undefined,
  locale: Locale = getLocale(),
): string {
  if (value == null) return ''
  const date = value instanceof Date ? value : new Date(value)
  return isValid(date) ? format(date, DATE_PATTERNS[locale].dateTime, { locale: dateLocale(locale) }) : ''
}

export function getAvatarFallback(name: string) {
  if (!name) return null

  const fallabck = name.split(' ')[0].charAt(0) ?? ''

  return fallabck
}

export type CurrencyCode = Database['public']['Enums']['currency_code']

export const CURRENCIES = Constants.public.Enums.currency_code

const currencyFormatters = new Map<string, Intl.NumberFormat>()

function currencyFormatter(currency: CurrencyCode, locale: Locale = getLocale()): Intl.NumberFormat {
  const key = `${locale}:${currency}`
  let formatter = currencyFormatters.get(key)
  if (!formatter) {
    // narrowSymbol: "$1,250.00" for MXN and USD alike, not "USD 1,250.00".
    formatter = new Intl.NumberFormat(intlLocale(locale), {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    })
    currencyFormatters.set(key, formatter)
  }
  return formatter
}

/**
 * NumberField `format` for money inputs: "1,250.00" without the currency
 * symbol, which the surrounding InputGroup shows as "$" / "MXN" addons.
 */
export const MONEY_FORMAT: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 }

/**
 * "$1,250.00" from a number or the numeric string PostgREST returns. With
 * `home` (the HOA's current currency), an amount in any other currency gets
 * its code, "$1,250.00 MXN", so records from before a switch stand out.
 * Components use useFormatCurrency(), which passes it. `locale` defaults to
 * the screen language.
 */
export function formatCurrency(
  value: number | string,
  currency: CurrencyCode,
  { home, locale }: { home?: CurrencyCode; locale?: Locale } = {},
): string {
  const text = currencyFormatter(currency, locale).format(typeof value === 'string' ? Number(value) : value)
  return home && currency !== home ? `${text} ${currency}` : text
}

/** "$": the addon in front of a money input. */
export function currencySymbol(currency: CurrencyCode): string {
  return (
    currencyFormatter(currency)
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? ''
  )
}

// `date` columns arrive as "YYYY-MM-DD"; parseISO reads them as *local* midnight
// (new Date() would use UTC, which is still the previous day in Mexico).

/** date-fns pattern for a "YYYY-MM-DD" date column. */
export const ISO_DAY = 'yyyy-MM-dd'

/** "12 Sep 2026" from a "YYYY-MM-DD" date column. Empty when missing. */
export function formatDay(value: string | null | undefined, locale: Locale = getLocale()): string {
  return value ? format(parseISO(value), DATE_PATTERNS[locale].day, { locale: dateLocale(locale) }) : ''
}

/** "Septiembre 2026" from a "YYYY-MM-DD" date column (day ignored). Empty when missing. */
export function formatMonth(value: string | null | undefined, locale?: Locale): string {
  return value ? format(parseISO(value), 'MMMM yyyy', { locale: dateLocale(locale) }) : ''
}

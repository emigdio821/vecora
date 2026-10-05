import { type ClassValue, clsx } from 'clsx'
import { format, isValid, type Locale, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { twMerge } from 'tailwind-merge'
import { Constants, type Database } from '@/lib/supabase/database.types'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Spanish, but with capitalized months and days ("Septiembre 2026",
 * "12 Sep 2026", "Lunes", "Lu") across the app. Use it instead of date-fns's
 * `es` for every format.
 */
export const esLocale: Locale = {
  ...es,
  localize: {
    ...es.localize,
    month: (month, options) => capitalize(es.localize.month(month, options)),
    day: (day, options) => capitalize(es.localize.day(day, options)),
  },
}

export function getRoleLabel(roleName: string): string {
  switch (roleName) {
    case 'admin':
      return 'Administrador'
    case 'president':
      return 'Presidente'
    case 'treasurer':
      return 'Tesorero'
    case 'maintenance':
      return 'Mantenimiento'
    case 'security':
      return 'Seguridad'
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
export function formatDate(value: string | number | Date | null | undefined): string {
  if (value == null) return ''
  const date = value instanceof Date ? value : new Date(value)
  return isValid(date) ? format(date, 'd MMM yyyy, h:mm aaaa', { locale: esLocale }) : ''
}

export function getAvatarFallback(name: string) {
  if (!name) return null

  const fallabck = name.split(' ')[0].charAt(0) ?? ''

  return fallabck
}

export type CurrencyCode = Database['public']['Enums']['currency_code']

export const CURRENCIES = Constants.public.Enums.currency_code

const currencyFormatters = new Map<CurrencyCode, Intl.NumberFormat>()

function currencyFormatter(currency: CurrencyCode): Intl.NumberFormat {
  let formatter = currencyFormatters.get(currency)
  if (!formatter) {
    // narrowSymbol: "$1,250.00" for MXN and USD alike, not "USD 1,250.00".
    formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    })
    currencyFormatters.set(currency, formatter)
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
 * Components use useFormatCurrency(), which passes it.
 */
export function formatCurrency(value: number | string, currency: CurrencyCode, home?: CurrencyCode): string {
  const text = currencyFormatter(currency).format(typeof value === 'string' ? Number(value) : value)
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
export function formatDay(value: string | null | undefined): string {
  return value ? format(parseISO(value), 'd MMM yyyy', { locale: esLocale }) : ''
}

/** "Septiembre 2026" from a "YYYY-MM-DD" date column (day ignored). Empty when missing. */
export function formatMonth(value: string | null | undefined): string {
  return value ? format(parseISO(value), 'MMMM yyyy', { locale: esLocale }) : ''
}

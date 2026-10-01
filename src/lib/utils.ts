import { type ClassValue, clsx } from 'clsx'
import { format, isValid, type Locale, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Spanish, but with capitalized months ("Septiembre 2026", "12 Sep 2026")
 * across the app. Use it instead of date-fns's `es` for every format.
 */
export const esLocale: Locale = {
  ...es,
  localize: {
    ...es.localize,
    month: (month, options) => capitalize(es.localize.month(month, options)),
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

const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

/**
 * NumberField `format` for money inputs: "1,250.00" without the currency
 * symbol, which the surrounding InputGroup shows as "$" / "MXN" addons.
 */
export const MONEY_FORMAT: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 }

/** "$1,250.00" from a number or the numeric string PostgREST returns. */
export function formatCurrency(value: number | string): string {
  return currencyFormatter.format(typeof value === 'string' ? Number(value) : value)
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

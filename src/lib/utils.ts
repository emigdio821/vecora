import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { PaymentType } from '@/db/schemas/zod'

const DEFAULT_LOCALE: Intl.LocalesArgument = 'es-MX'
const DEFAULT_MONTHS_LOCALE: Intl.LocalesArgument = 'es-PE'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function normalizeString(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function formatDate(
  date: ConstructorParameters<typeof Date>[0],
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Date(date).toLocaleDateString(DEFAULT_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    ...options,
  })
}

export function getAllMonthsMap(): Record<number, string> {
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(0, i)
    return date.toLocaleString(DEFAULT_MONTHS_LOCALE, { month: 'long' })
  })

  return Object.fromEntries(months.map((month, i) => [i + 1, month]))
}

export function getPaymentTypeLabel(type: PaymentType): string {
  const typeLabels: Record<PaymentType, string> = {
    monthly_fee: 'Cuota mensual',
    extra: 'Extra',
    other: 'Otro',
  }

  return typeLabels[type] || type
}

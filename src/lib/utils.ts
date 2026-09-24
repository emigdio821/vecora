import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
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

const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

/** "22 sept 2026, 10:15 a.m." from an ISO string, timestamp or Date. */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (value == null) return '—'
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

export function getAvatarFallback(name: string) {
  if (!name) return null

  const fallabck = `${name.split(' ')[0].charAt(0)}${name.split(' ')[1]?.charAt(0) ?? ''}`

  return fallabck
}

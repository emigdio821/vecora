import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeString(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function formatDate(date: ConstructorParameters<typeof Date>[0]) {
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  })
}

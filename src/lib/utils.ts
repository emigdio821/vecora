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

export function getAvatarFallback(name: string) {
  if (!name) return null

  const fallabck = `${name.split(' ')[0].charAt(0)}${name.split(' ')[1]?.charAt(0) ?? ''}`

  return fallabck
}

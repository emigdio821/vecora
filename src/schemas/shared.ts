import { z } from 'zod'

export const requiredAmountSchema = z
  .string()
  .min(1, 'El monto es requerido')
  .refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
    message: 'El monto debe ser un número válido mayor a 0',
  })

export const uuidSchema = z.uuid('ID inválido')

export const emailSchema = z
  .email('Correo inválido')
  .min(1, 'El correo es requerido')
  .max(255, 'El correo es muy largo')

export const passwordSchema = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')

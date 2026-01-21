import { z } from 'zod'

export const requiredAmountSchema = z
  .string()
  .min(1, 'El monto es requerido')
  .refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
    message: 'El monto debe ser un número válido mayor a 0',
  })

export const uuidSchema = z.uuid('ID inválido')

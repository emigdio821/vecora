import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { violations } from '@/db/schemas/main'
import { authMiddleware } from '@/middleware/auth'

const requiredAmountSchema = z
  .string()
  .min(1, 'El monto es requerido')
  .refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
    message: 'El monto debe ser un número válido mayor a 0',
  })

export const createViolationSchema = z.object({
  ownerId: z.uuid('ID de propietario inválido').min(1, 'El propietario es requerido'),
  concept: z.string().min(1, 'El concepto es requerido'),
  amount: requiredAmountSchema,
  violationDate: z.date({ message: 'La fecha de infracción es requerida' }),
  status: z.enum(['pending', 'paid']),
})

export type CreateViolationFormData = z.infer<typeof createViolationSchema>

export const updateViolationSchema = z.object({
  violationId: z.uuid('ID de infracción inválido'),
  ownerId: z.uuid('ID de propietario inválido').min(1, 'El propietario es requerido'),
  concept: z.string().min(1, 'El concepto es requerido'),
  amount: requiredAmountSchema,
  violationDate: z.date({ message: 'La fecha de infracción es requerida' }),
  status: z.enum(['pending', 'paid']),
})

export type UpdateViolationFormData = z.infer<typeof updateViolationSchema>

export const deleteViolationSchema = z.object({
  violationId: z.uuid('ID de infracción inválido'),
})

export type DeleteViolationData = z.infer<typeof deleteViolationSchema>

export const createViolation = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createViolationSchema)
  .handler(async ({ data }) => {
    const [newViolation] = await db.insert(violations).values(data).returning()
    return newViolation
  })

export const updateViolation = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateViolationSchema)
  .handler(async ({ data }) => {
    const { violationId, ...updateData } = data
    const [updatedViolation] = await db
      .update(violations)
      .set(updateData)
      .where(eq(violations.id, violationId))
      .returning()
    return updatedViolation
  })

export const deleteViolation = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(deleteViolationSchema)
  .handler(async ({ data }) => {
    const { violationId } = data
    const [deletedViolation] = await db.delete(violations).where(eq(violations.id, violationId)).returning()
    return deletedViolation
  })

export const getViolationsList = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const allViolations = await db.query.violations.findMany({
      with: {
        owner: true,
      },
      orderBy: (violations, { desc }) => [desc(violations.violationDate)],
    })

    return allViolations
  })

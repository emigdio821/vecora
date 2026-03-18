import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { residentialAddress } from '@/db/schema'
import type { SelectResidentialAddress } from '@/db/schema/zod/residential-address'
import { logger } from '@/lib/logger'
import { authMiddleware } from '@/middleware/auth'
import { updateResidentialAddressSchema } from '@/schemas/residential-address'
import { createAuditLog } from './audit-logs'

export const getResidentialAddress = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const residentialAddress = await db.query.residentialAddress.findFirst()

    return residentialAddress || null
  })

export const updateResidentialAddress = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateResidentialAddressSchema)
  .handler(async ({ data }) => {
    const { addressId, ...updateData } = data

    let updatedResidentialAddress: SelectResidentialAddress
    let oldResidentialAddress: SelectResidentialAddress | null = null

    if (addressId) {
      const [selectedResidentialAddress] = await db
        .select()
        .from(residentialAddress)
        .where(eq(residentialAddress.id, addressId))
        .limit(1)

      oldResidentialAddress = selectedResidentialAddress

      const [updatedAddress] = await db
        .update(residentialAddress)
        .set(updateData)
        .where(eq(residentialAddress.id, addressId))
        .returning()

      updatedResidentialAddress = updatedAddress
    } else {
      const [createdAddress] = await db.insert(residentialAddress).values(data).returning()

      updatedResidentialAddress = createdAddress
    }

    createAuditLog({
      data: {
        action: addressId ? 'update' : 'create',
        entityType: 'residential_address',
        entityId: updatedResidentialAddress.id,
        oldData: oldResidentialAddress,
        newData: updatedResidentialAddress,
      },
    }).catch(logger.error)

    return updatedResidentialAddress
  })

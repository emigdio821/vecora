import { z } from 'zod'

export const updateResidentialAddressSchema = z.object({
  addressId: z.uuid().optional(),
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  street: z.string().min(1, 'La calle es requerida'),
  city: z.string().min(1, 'La ciudad es requerida'),
  state: z.string().min(1, 'El estado es requerido'),
  zipCode: z.string().min(1, 'El código postal es requerido'),
  country: z.string().min(1, 'El país es requerido'),
})

export type UpdateResidentialAddressFormData = z.infer<typeof updateResidentialAddressSchema>

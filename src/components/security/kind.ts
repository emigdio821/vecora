import { SECURITY_REQUEST_KINDS, type SecurityRequestKind } from '@/lib/validations/security'

export const KIND_LABEL: Record<SecurityRequestKind, string> = {
  cameras: 'Cámaras',
  guards: 'Guardias',
  access: 'Accesos',
  equipment: 'Equipo',
  other: 'Otro',
}

/** Shown under the kind Select so the picker doesn't have to guess. */
export const KIND_DESCRIPTION: Record<SecurityRequestKind, string> = {
  cameras: 'Compra, instalación o reparación de cámaras y grabadoras.',
  guards: 'Pago de guardias, turnos extra o empresa de vigilancia.',
  access: 'Plumas, portones, controles, tarjetas o cerraduras.',
  equipment: 'Radios, lámparas, uniformes, candados y similares.',
  other: 'Cualquier otro gasto de seguridad.',
}

/** Options for kind Selects, in display order. */
export const KIND_ITEMS: { value: SecurityRequestKind; label: string }[] = SECURITY_REQUEST_KINDS.map(
  (kind) => ({
    value: kind,
    label: KIND_LABEL[kind],
  }),
)

import { SECURITY_REQUEST_KINDS, type SecurityRequestKind } from '@/lib/validations/security'
import { m } from '@/paraglide/messages'

export const KIND_LABEL: Record<SecurityRequestKind, string> = {
  get cameras() {
    return m.requests_security_kind_cameras()
  },
  get guards() {
    return m.requests_security_kind_guards()
  },
  get access() {
    return m.requests_security_kind_access()
  },
  get equipment() {
    return m.requests_security_kind_equipment()
  },
  get other() {
    return m.requests_security_kind_other()
  },
}

/** Shown under the kind Select so the picker doesn't have to guess. */
export const KIND_DESCRIPTION: Record<SecurityRequestKind, string> = {
  get cameras() {
    return m.requests_security_kind_cameras_description()
  },
  get guards() {
    return m.requests_security_kind_guards_description()
  },
  get access() {
    return m.requests_security_kind_access_description()
  },
  get equipment() {
    return m.requests_security_kind_equipment_description()
  },
  get other() {
    return m.requests_security_kind_other_description()
  },
}

/** Options for kind Selects, in display order. */
export const KIND_ITEMS: { value: SecurityRequestKind; label: string }[] = SECURITY_REQUEST_KINDS.map(
  (kind) => ({
    value: kind,
    get label() {
      return KIND_LABEL[kind]
    },
  }),
)

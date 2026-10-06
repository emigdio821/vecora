import type { Relationship } from '@/lib/validations/houses'
import { m } from '@/paraglide/messages'

export const RELATIONSHIP_LABEL: Record<Relationship, string> = {
  get owner() {
    return m.common_relationship_owner()
  },
  get tenant() {
    return m.common_relationship_tenant()
  },
  get family() {
    return m.common_relationship_family()
  },
}

/** Options for relationship Selects, in display order. */
export const RELATIONSHIP_ITEMS: { value: Relationship; label: string }[] = [
  {
    value: 'owner',
    get label() {
      return RELATIONSHIP_LABEL.owner
    },
  },
  {
    value: 'tenant',
    get label() {
      return RELATIONSHIP_LABEL.tenant
    },
  },
  {
    value: 'family',
    get label() {
      return RELATIONSHIP_LABEL.family
    },
  },
]

// Owners first, then tenants, then family.
export const RELATIONSHIP_ORDER: Record<Relationship, number> = { owner: 0, tenant: 1, family: 2 }

export function sortByRelationship<T extends { relationship: Relationship }>(links: readonly T[]): T[] {
  return [...links].sort((a, b) => RELATIONSHIP_ORDER[a.relationship] - RELATIONSHIP_ORDER[b.relationship])
}

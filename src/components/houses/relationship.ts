import type { Relationship } from '@/lib/validations/houses'

export const RELATIONSHIP_LABEL: Record<Relationship, string> = {
  owner: 'Propietario',
  tenant: 'Inquilino',
  family: 'Familiar',
}

/** Options for relationship Selects, in display order. */
export const RELATIONSHIP_ITEMS: { value: Relationship; label: string }[] = [
  { value: 'owner', label: RELATIONSHIP_LABEL.owner },
  { value: 'tenant', label: RELATIONSHIP_LABEL.tenant },
  { value: 'family', label: RELATIONSHIP_LABEL.family },
]

// Owners first, then tenants, then family.
export const RELATIONSHIP_ORDER: Record<Relationship, number> = { owner: 0, tenant: 1, family: 2 }

export function sortByRelationship<T extends { relationship: Relationship }>(links: readonly T[]): T[] {
  return [...links].sort((a, b) => RELATIONSHIP_ORDER[a.relationship] - RELATIONSHIP_ORDER[b.relationship])
}

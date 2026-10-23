import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toastManager } from '@/components/ui/toast'
import type { Relationship } from '@/lib/validations/houses'
import { m } from '@/paraglide/messages'
import { updateRelationship } from '@/server-actions/houses'
import { HOUSES_QUERY_KEY } from '@/tanstack-queries/houses'
import { RESIDENTS_QUERY_KEY } from '@/tanstack-queries/residents'
import { RELATIONSHIP_ITEMS, RELATIONSHIP_LABEL } from './relationship'

interface RelationshipSelectProps {
  house: { id: string; number: string }
  resident: { id: string; first_name: string; last_name: string }
  value: Relationship
  'aria-label': string
  disabled?: boolean
}

/**
 * The relationship of one house-resident link, editable in place: picking another
 * one saves it right away, like the remove button next to it.
 */
export function RelationshipSelect({
  house,
  resident,
  value,
  'aria-label': ariaLabel,
  disabled,
}: RelationshipSelectProps) {
  const queryClient = useQueryClient()
  const name = `${resident.first_name} ${resident.last_name}`

  const mutation = useMutation({
    mutationFn: async (relationship: Relationship) => {
      const result = await updateRelationship(house.id, resident.id, { relationship })
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: async (_data, relationship) => {
      // Waits for the refetch, so the Select doesn't flash the old value in between.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [RESIDENTS_QUERY_KEY] }),
      ])
      toastManager.add({
        type: 'success',
        title: m.residential_relationship_updated(),
        description: m.residential_relationship_updated_description({
          name,
          number: house.number,
          relationship: RELATIONSHIP_LABEL[relationship],
        }),
      })
    },
    onError: (error) => {
      toastManager.add({
        type: 'error',
        title: m.residential_relationship_update_failed(),
        description: error.message,
      })
    },
  })

  let shownValue = value
  if (mutation.isPending) {
    shownValue = mutation.variables
  }

  return (
    <Select
      items={RELATIONSHIP_ITEMS}
      value={shownValue}
      onValueChange={(next) => {
        if (next !== null && next !== value) {
          mutation.mutate(next)
        }
      }}
      disabled={disabled || mutation.isPending}
    >
      <SelectTrigger size="sm" className="w-36" aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {RELATIONSHIP_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

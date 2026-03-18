import { IconSelector } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { profilesListQueryOptions } from '@/api/tanstack-queries/profiles'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface ProfilesSelectorProps {
  id?: string
  value?: string | null
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
  noneOptionLabel?: string
  includeNoneOption?: boolean
  excludeWithPeriod?: boolean
  excludeMemberId?: string
  onValueChange?: (value: string | null) => void
}

export function ProfilesSelector({
  id,
  value,
  onValueChange,
  invalid = false,
  disabled = false,
  includeNoneOption = true,
  excludeWithPeriod = false,
  excludeMemberId,
  noneOptionLabel = 'Sin selección',
  placeholder = 'Selecciona una opción',
}: ProfilesSelectorProps) {
  const [open, setOpen] = useState(false)
  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery(profilesListQueryOptions())

  const items = useMemo(() => {
    let filteredProfiles = profiles

    if (excludeWithPeriod) {
      filteredProfiles = profiles.filter((profile) => {
        const activeMemberships = profile.hoaBoardMemberships?.filter((m) => !m.deletedAt) || []

        if (!activeMemberships.length) return true

        if (excludeMemberId) {
          return activeMemberships.every((membership) => membership.id === excludeMemberId)
        }

        return false
      })
    }

    const profilesItems = filteredProfiles.map((profile) => {
      let displayName = 'Sin nombre'

      // Get name from resident relation
      if (profile.resident) {
        displayName = `${profile.resident.firstName} ${profile.resident.lastName}`
      }

      return {
        value: profile.id,
        label: displayName,
      }
    })

    return profilesItems
  }, [profiles, excludeWithPeriod, excludeMemberId])

  function renderProfileValue(value?: string | null) {
    if (isLoadingProfiles) return <span className="animate-pulse">Cargando datos...</span>

    if (items.length === 0) {
      return <span className="text-muted-foreground">No hay perfiles disponibles</span>
    }

    const item = items.find((item) => item.value === value)
    return item ? item.label : <span className="text-muted-foreground">{placeholder}</span>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            role="combobox"
            variant="outline"
            aria-invalid={invalid}
            aria-label="Combobox de perfiles"
            disabled={items.length === 0 || disabled}
            className="w-full justify-between font-normal disabled:*:opacity-70"
          >
            {renderProfileValue(value)}
            <IconSelector className="-me-1 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent
        className="w-(--anchor-width) gap-0 rounded-lg p-0"
        render={
          <Command>
            {items.length > 10 && <CommandInput placeholder="Buscar" />}
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              <CommandGroup heading="Perfiles">
                {includeNoneOption && (
                  <CommandItem
                    value={undefined}
                    data-checked={!value}
                    onSelect={() => {
                      setOpen(false)
                      onValueChange?.(null)
                    }}
                  >
                    {noneOptionLabel}
                  </CommandItem>
                )}

                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    data-checked={value === item.value}
                    keywords={[item.label]}
                    onSelect={(currentValue) => {
                      setOpen(false)
                      onValueChange?.(currentValue)
                    }}
                  >
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        }
      />
    </Popover>
  )
}

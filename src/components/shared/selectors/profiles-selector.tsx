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
  noneOptionLabel = 'Sin selección',
  placeholder = 'Selecciona una opción',
}: ProfilesSelectorProps) {
  const [open, setOpen] = useState(false)
  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery(profilesListQueryOptions())

  const items = useMemo(() => {
    let filteredProfiles = profiles

    if (excludeWithPeriod) {
      filteredProfiles = profiles.filter((profile) => !profile.hoaBoardMemberships?.length)
    }

    const profilesItems = filteredProfiles.map((profile) => {
      let displayName = 'Sin nombre'

      if (profile.profileType === 'owner' && profile.owner) {
        displayName = `${profile.owner.firstName} ${profile.owner.lastName}`
      } else if (profile.profileType === 'external' && profile.externalUser) {
        displayName = `${profile.externalUser.firstName} ${profile.externalUser.lastName}`
      }

      return {
        value: profile.id,
        label: displayName,
      }
    })

    return profilesItems
  }, [profiles, excludeWithPeriod])

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
            className="w-full justify-between font-normal disabled:bg-input/50 disabled:*:opacity-50 disabled:dark:bg-input/80"
          >
            {renderProfileValue(value)}
            <IconSelector className="-me-1 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent className="w-(--anchor-width) p-0">
        <Command>
          {items.length > 10 && <CommandInput placeholder="Buscar" />}
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
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
      </PopoverContent>
    </Popover>
  )
}

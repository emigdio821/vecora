import { IconSelector } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { ownersListQueryOptions } from '@/api/tanstack-queries/owners'
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

interface OwnersSelectorProps {
  id?: string
  value?: string | null
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
  noneOptionLabel?: string
  includeNoneOption?: boolean
  excludeWithProfiles?: boolean
  onValueChange?: (value: string | null) => void
}

export function OwnersSelector({
  id,
  value,
  onValueChange,
  invalid = false,
  disabled = false,
  includeNoneOption = true,
  excludeWithProfiles = false,
  noneOptionLabel = 'Sin selección',
  placeholder = 'Selecciona una opción',
}: OwnersSelectorProps) {
  const [open, setOpen] = useState(false)
  const { data: owners = [], isLoading: isLoadingOwners } = useQuery(ownersListQueryOptions())

  const items = useMemo(() => {
    let filteredOwners = owners

    if (excludeWithProfiles) {
      filteredOwners = owners.filter((owner) => !owner.profile)
    }

    const ownersItems = filteredOwners.map((owner) => ({
      value: owner.id,
      label: `${owner.firstName} ${owner.lastName}`,
    }))

    return ownersItems
  }, [owners, excludeWithProfiles])

  function renderOwnerValue(value?: string | null) {
    if (isLoadingOwners) return <span className="animate-pulse">Cargando datos...</span>

    if (items.length === 0) {
      return <span className="text-muted-foreground">No hay propietarios disponibles</span>
    }

    const owner = owners.find((owner) => owner.id === value)
    return owner ? (
      `${owner.firstName} ${owner.lastName}`
    ) : (
      <span className="text-muted-foreground">{placeholder}</span>
    )
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
            aria-label="Combobox de propietarios"
            disabled={items.length === 0 || disabled}
            className="w-full justify-between font-normal disabled:bg-input/50 disabled:*:opacity-50 disabled:dark:bg-input/80"
          >
            {renderOwnerValue(value)}
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

              {items.map((owner) => (
                <CommandItem
                  key={owner.value}
                  value={owner.value}
                  data-checked={value === owner.value}
                  keywords={[owner.label]}
                  onSelect={(currentValue) => {
                    setOpen(false)
                    onValueChange?.(currentValue)
                  }}
                >
                  {owner.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

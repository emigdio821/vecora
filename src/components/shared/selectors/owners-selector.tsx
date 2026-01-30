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
import { Skeleton } from '../../ui/skeleton'

interface OwnersSelectorProps {
  id?: string
  value?: string | null
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
  noneOptionLabel?: string
  includeNoneOption?: boolean
  onValueChange?: (value: string | null) => void
}

export function OwnersSelector({
  id,
  value,
  onValueChange,
  invalid = false,
  disabled = false,
  placeholder = 'Selecciona una opción',
  includeNoneOption = true,
  noneOptionLabel = 'Sin selección',
}: OwnersSelectorProps) {
  const [open, setOpen] = useState(false)
  const { data: owners = [], isLoading: isLoadingOwners } = useQuery(ownersListQueryOptions())

  const items = useMemo(() => {
    const ownersItems = owners.map((owner) => ({
      value: owner.id,
      label: `${owner.firstName} ${owner.lastName}`,
    }))

    return ownersItems
  }, [owners])

  function renderOwnerValue(value?: string | null) {
    if (isLoadingOwners) return <Skeleton className="h-2 w-1/3" />
    if (owners.length === 0) {
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
            disabled={owners.length === 0 || disabled}
            className="w-full justify-between font-normal"
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

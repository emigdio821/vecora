import { IconSelector } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { residentsListQueryOptions } from '@/api/tanstack-queries/residents'
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

interface ResidentsSelectorProps {
  id?: string
  value?: string | null
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
  noneOptionLabel?: string
  includeNoneOption?: boolean
  excludeWithProfiles?: boolean
  ownersOnly?: boolean
  onValueChange?: (value: string | null) => void
}

export function ResidentsSelector({
  id,
  value,
  onValueChange,
  invalid = false,
  disabled = false,
  includeNoneOption = true,
  excludeWithProfiles = false,
  ownersOnly = false,
  noneOptionLabel = 'Sin selección',
  placeholder = 'Selecciona una opción',
}: ResidentsSelectorProps) {
  const [open, setOpen] = useState(false)
  const { data: residents = [], isLoading: isLoadingResidents } = useQuery(residentsListQueryOptions())

  const items = useMemo(() => {
    let filteredResidents = residents

    if (excludeWithProfiles) {
      filteredResidents = residents.filter((resident) => !resident.profile)
    }

    if (ownersOnly) {
      filteredResidents = filteredResidents.filter((resident) => resident.isOwner)
    }

    const residentsItems = filteredResidents.map((resident) => ({
      value: resident.id,
      label: `${resident.firstName} ${resident.lastName}`,
    }))

    return residentsItems
  }, [residents, excludeWithProfiles, ownersOnly])

  function renderResidentValue(value?: string | null) {
    if (isLoadingResidents) return <span className="animate-pulse">Cargando datos...</span>

    if (items.length === 0) {
      return <span className="text-muted-foreground">No hay residentes disponibles</span>
    }

    const resident = residents.find((resident) => resident.id === value)
    return resident ? (
      `${resident.firstName} ${resident.lastName}`
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
            aria-label="Combobox de residentes"
            disabled={items.length === 0 || disabled}
            className="w-full justify-between font-normal disabled:*:opacity-70"
          >
            {renderResidentValue(value)}
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

                {items.map((resident) => (
                  <CommandItem
                    key={resident.value}
                    value={resident.value}
                    data-checked={value === resident.value}
                    keywords={[resident.label]}
                    onSelect={(currentValue) => {
                      setOpen(false)
                      onValueChange?.(currentValue)
                    }}
                  >
                    {resident.label}
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

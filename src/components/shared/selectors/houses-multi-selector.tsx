import { IconSelector } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { housesListQueryOptions } from '@/api/tanstack-queries/houses'
import { HouseNumberBadge } from '@/components/shared/houses/house-number-badge'
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

interface HousesMultiSelectorProps {
  id?: string
  value?: string[]
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
  emptyLabel?: string
  onValueChange?: (value: string[]) => void
}

export function HousesMultiSelector({
  id,
  value = [],
  onValueChange,
  invalid = false,
  disabled = false,
  placeholder = 'Selecciona casas',
  emptyLabel = 'No hay casas disponibles',
}: HousesMultiSelectorProps) {
  const [open, setOpen] = useState(false)
  const { data: houses = [], isLoading: isLoadingHouses } = useQuery(housesListQueryOptions())

  const items = useMemo(() => {
    return houses.map((house) => ({
      value: house.id,
      label: house.houseNumber,
    }))
  }, [houses])

  function toggleSelection(houseId: string) {
    const isSelected = value.includes(houseId)
    const newValues = isSelected ? value.filter((v) => v !== houseId) : [...value, houseId]
    onValueChange?.(newValues)
  }

  function renderValue() {
    if (isLoadingHouses) return <span className="animate-pulse">Cargando datos...</span>

    if (items.length === 0) {
      return <span className="text-muted-foreground">{emptyLabel}</span>
    }

    if (value.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((houseId) => {
            const house = houses.find((h) => h.id === houseId)
            if (!house) return null
            return <HouseNumberBadge key={houseId} number={house.houseNumber} />
          })}
        </div>
      )
    }

    return <span className="text-muted-foreground">{placeholder}</span>
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
            aria-label="Selector múltiple de casas"
            disabled={items.length === 0 || disabled}
            className="w-full justify-between font-normal disabled:*:opacity-70"
          >
            <div className="min-w-0 flex-1 text-left">{renderValue()}</div>
            <IconSelector className="-me-1 shrink-0 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent
        className="w-(--anchor-width) gap-0 rounded-lg p-0"
        render={
          <Command>
            {items.length > 10 && <CommandInput placeholder="Buscar casa" />}
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    keywords={[item.label]}
                    onSelect={() => toggleSelection(item.value)}
                    data-checked={value.includes(item.value)}
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

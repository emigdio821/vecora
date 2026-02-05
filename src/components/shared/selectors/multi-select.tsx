import { IconSelector } from '@tabler/icons-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
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

interface ComboboxMultiSelectItem {
  label: string
  value: string
}

export interface ComboboxMultiSelectProps {
  id?: string
  value?: string[]
  invalid?: boolean
  disabled?: boolean
  isLoading?: boolean
  emptyLabel?: string
  placeholder?: string
  noneOptionLabel?: string
  includeNoneOption?: boolean
  items: ComboboxMultiSelectItem[]
  onValueChange: (value: string[]) => void
}

export function ComboboxMultiSelect({
  id,
  value,
  items,
  isLoading,
  onValueChange,
  invalid = false,
  disabled = false,
  placeholder = 'Selecciona una opción',
  emptyLabel = 'No hay opciones disponibles',
}: ComboboxMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [selectedValues, setSelectedValues] = useState<string[]>(value || [])

  function toggleSelection(value: string) {
    const isSelected = selectedValues.includes(value)
    const newValues = isSelected ? selectedValues.filter((v) => v !== value) : [...selectedValues, value]
    setSelectedValues(newValues)
    onValueChange(newValues)
  }

  function renderValue() {
    if (isLoading) return <span className="animate-pulse">Cargando datos...</span>
    if (items.length === 0) return <span className="text-muted-foreground">{emptyLabel}</span>

    if (selectedValues.length > 0) {
      return (
        <span className="truncate">
          {selectedValues.map((value) => {
            const item = items.find((i) => i.value === value)
            if (!item) return null

            return (
              <Badge key={value} variant="outline" className="me-1">
                {item.label}
              </Badge>
            )
          })}
        </span>
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
            aria-label="Combobox de usuarios externos"
            className="w-full justify-between font-normal"
            disabled={items.length === 0 || isLoading || disabled}
          >
            {renderValue()}
            <IconSelector className="shrink-0 text-muted-foreground" aria-hidden="true" />
          </Button>
        }
      />
      <PopoverContent
        className="w-(--anchor-width) gap-0 rounded-lg p-0"
        render={
          <Command>
            {items.length > 10 && <CommandInput placeholder="Buscar" />}
            <CommandList>
              <CommandEmpty>No framework found.</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    keywords={[item.label]}
                    onSelect={() => toggleSelection(item.value)}
                    data-checked={selectedValues.includes(item.value)}
                  >
                    <span className="truncate">{item.label}</span>
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

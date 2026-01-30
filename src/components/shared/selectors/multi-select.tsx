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
  onValueChange,
  invalid = false,
  disabled = false,
  placeholder = 'Selecciona una opción',
}: ComboboxMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [selectedValues, setSelectedValues] = useState<string[]>(value || [])

  function toggleSelection(value: string) {
    const isSelected = selectedValues.includes(value)
    const newValues = isSelected ? selectedValues.filter((v) => v !== value) : [...selectedValues, value]
    setSelectedValues(newValues)
    onValueChange(newValues)
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
            disabled={items.length === 0 || disabled}
            aria-label="Combobox de usuarios externos"
            className="w-full justify-between font-normal"
          >
            {selectedValues.length > 0 ? (
              <span className="truncate">
                {selectedValues.map((value) => {
                  const framework = items.find((fw) => fw.value === value)
                  if (!framework) return null
                  return (
                    <Badge key={value} variant="outline" className="me-1">
                      {framework.label}
                    </Badge>
                  )
                })}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <IconSelector className="shrink-0 text-muted-foreground/80" aria-hidden="true" />
          </Button>
        }
      />
      <PopoverContent className="w-(--anchor-width) p-0">
        <Command>
          {items.length > 10 && <CommandInput placeholder="Buscar" />}
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => toggleSelection(item.value)}
                  data-checked={selectedValues.includes(item.value)}
                >
                  <span className="truncate">{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

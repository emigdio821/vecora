import { IconSelector } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { externalUsersListQueryOptions } from '@/api/tanstack-queries/external-users'
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

export function ExternalUsersSelector({
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
  const { data: externalUsers = [], isLoading: isLoadingExternalUsers } = useQuery(
    externalUsersListQueryOptions(),
  )
  const items = useMemo(() => {
    const externalUsersItems = externalUsers.map((externalUser) => ({
      value: externalUser.id,
      label: `${externalUser.firstName} ${externalUser.lastName}`,
    }))

    return externalUsersItems
  }, [externalUsers])

  function renderExternalUserValue(value?: string | null) {
    if (isLoadingExternalUsers) return <Skeleton className="h-2 w-1/3" />
    if (externalUsers.length === 0) {
      return <span className="text-muted-foreground">No hay usuarios externos disponibles</span>
    }

    const externalUser = externalUsers.find((externalUser) => externalUser.id === value)
    return externalUser ? (
      `${externalUser.firstName} ${externalUser.lastName}`
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
            aria-label="Combobox de usuarios externos"
            disabled={externalUsers.length === 0 || disabled}
            className="w-full justify-between font-normal"
          >
            {renderExternalUserValue(value)}
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

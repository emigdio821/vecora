import { IconSelector } from '@tabler/icons-react'
import { useCallback, useMemo, useState } from 'react'
import RPNInput, {
  type Country,
  getCountryCallingCode,
  type Props as RPNInputProps,
} from 'react-phone-number-input'
import defaultLabels from 'react-phone-number-input/locale/es'
import { VList } from 'virtua'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn, normalizeString } from '@/lib/utils'

type PhoneInputProps = Omit<
  RPNInputProps<typeof InputComponent>,
  'inputComponent' | 'countrySelectComponent' | 'labels'
> & {
  id?: string
}

export function PhoneInput({ className, ...props }: PhoneInputProps) {
  return (
    <RPNInput
      defaultCountry="MX"
      labels={defaultLabels}
      inputComponent={InputComponent}
      countrySelectComponent={CountrySelect}
      className={cn('flex gap-2 rounded-md', className)}
      {...props}
    />
  )
}

function InputComponent({ className, ...props }: React.ComponentProps<'input'>) {
  return <Input className={cn('focus-visible:z-10', className)} {...props} />
}

interface CountrySelectProps {
  disabled?: boolean
  value?: Country
  onChange: (value: Country) => void
  options: { label: string; value: Country | undefined }[]
}

function CountrySelect({ disabled, value: selectedCountry, onChange, options }: CountrySelectProps) {
  const [openPopover, setOpenPopover] = useState(false)
  const countries = useMemo(() => options.filter((option) => option.value !== undefined), [options])
  const [filteredOptions, setFilteredOptions] = useState(countries)

  const getCountryCode = useCallback((country: Country) => {
    return `+${getCountryCallingCode(country)}`
  }, [])

  const handleCountryFilter = useCallback(
    (value: string) => {
      const normalizedValue = normalizeString(value).toLocaleLowerCase()
      const filtered = countries.filter((country) =>
        normalizeString(country.label).toLocaleLowerCase().includes(normalizedValue),
      )
      setFilteredOptions(filtered)
    },
    [countries],
  )

  return (
    <Popover
      open={openPopover}
      onOpenChange={setOpenPopover}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) setFilteredOptions(countries)
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label="Country"
            className="w-20 justify-between gap-1 font-normal hover:bg-inherit"
          >
            <span>{selectedCountry ? getCountryCode(selectedCountry) : null}</span>
            <IconSelector className="size-4 text-muted-foreground/80" />
          </Button>
        }
      />
      <PopoverContent className="w-72 p-0" align="start">
        <Command shouldFilter={false} className="p-0">
          <CommandInput placeholder="Buscar..." onValueChange={handleCountryFilter} />
          <CommandList>
            {filteredOptions.length === 0 ? (
              <CommandEmpty>Sin resultados.</CommandEmpty>
            ) : (
              <CommandGroup>
                <VList style={{ height: filteredOptions.length > 0 ? 240 : 0, width: '100%' }}>
                  {filteredOptions.map(
                    ({ label, value }) =>
                      value && (
                        <div key={value}>
                          <CommandItem
                            className="justify-between gap-2"
                            onSelect={() => {
                              onChange(value)
                              setOpenPopover(false)
                            }}
                            data-checked={value === selectedCountry}
                          >
                            <span className="flex-1 truncate text-sm">{label}</span>
                            <span className="text-muted-foreground text-sm">{getCountryCode(value)}</span>
                          </CommandItem>
                        </div>
                      ),
                  )}
                </VList>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

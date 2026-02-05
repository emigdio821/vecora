import { IconSelector } from '@tabler/icons-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import RPNInput, {
  type Country,
  getCountryCallingCode,
  type Props as RPNInputProps,
} from 'react-phone-number-input'
import defaultLabels from 'react-phone-number-input/locale/es'
import { Input } from '@/components/ui/input'
import { cn, normalizeString } from '@/lib/utils'
import { Button } from './button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

type PhoneInputProps = Omit<
  RPNInputProps<typeof InputComponent>,
  'inputComponent' | 'countrySelectComponent' | 'labels'
> & {
  id?: string
}

function getCountryCode(country: Country) {
  return `+${getCountryCallingCode(country)}`
}

export function PhoneInput({ className, ...props }: PhoneInputProps) {
  return (
    <RPNInput
      defaultCountry="MX"
      international={false}
      labels={defaultLabels}
      inputComponent={InputComponent}
      countrySelectComponent={CountrySelect}
      className={cn('flex w-full gap-2 rounded-md', className)}
      {...props}
    />
  )
}

function InputComponent({ className, ...props }: React.ComponentProps<'input'>) {
  return <Input className={cn('focus-visible:z-10', className)} {...props} />
}

interface CountrySelectOption {
  label: string
  value: Country | undefined
}

interface CountrySelectProps {
  disabled?: boolean
  value?: Country
  onChange: (value: Country) => void
  options: CountrySelectOption[]
}

function CountrySelect({ disabled, value: selectedCountry, onChange, options }: CountrySelectProps) {
  const [open, setOpen] = useState(false)
  const [enabledVirtualizer, setEnabledVirtualizer] = useState(false)
  const countries = useMemo(() => options.filter((option) => option.value !== undefined), [options])
  const [filteredCountries, setFilteredCountries] = useState<CountrySelectOption[]>(countries)
  const selectedItemRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    enabled: enabledVirtualizer,
    count: filteredCountries.length,
    getScrollElement: () => selectedItemRef.current,
    estimateSize: () => 32,
    overscan: 10,
    paddingStart: 4,
    paddingEnd: 4,
    scrollPaddingEnd: 4,
    scrollPaddingStart: 4,
  })

  const handleCountryFilter = useCallback(
    (value: string) => {
      const filtered = countries.filter((country) =>
        normalizeString(country.label).toLowerCase().includes(normalizeString(value).toLowerCase()),
      )
      setFilteredCountries(filtered)
    },
    [countries],
  )

  const handleScrollElementRef = useCallback(
    (element: HTMLDivElement | null) => {
      selectedItemRef.current = element
      if (element) {
        virtualizer.measure()
      }
    },
    [virtualizer],
  )

  const totalSize = virtualizer.getTotalSize()

  useEffect(() => {
    if (open) {
      setEnabledVirtualizer(true)
      const selectedIndex = filteredCountries.findIndex((c) => c.value === selectedCountry)

      if (selectedIndex >= 0) {
        queueMicrotask(() => {
          virtualizer.scrollToIndex(selectedIndex, { align: 'auto' })
        })
      }
    }
  }, [open, virtualizer, filteredCountries, selectedCountry])

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) {
          setFilteredCountries(countries)
          setEnabledVirtualizer(false)
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            role="combobox"
            variant="outline"
            disabled={disabled}
            aria-invalid={false}
            data-invalid={false}
            aria-label="Combobox de código de país"
            className="w-20 justify-between font-normal"
          >
            {selectedCountry ? getCountryCode(selectedCountry) : 'Código'}
            <IconSelector className="-me-1 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-64 p-0 sm:w-72">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar" onValueChange={handleCountryFilter} />
          <CommandList className="overflow-hidden">
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup className="overflow-hidden p-0">
              {filteredCountries.length > 0 && (
                <div
                  role="presentation"
                  ref={handleScrollElementRef}
                  className="h-[min(16.5rem,var(--total-size))] max-h-(--available-height) overflow-auto overscroll-contain px-1"
                  style={{ '--total-size': `${totalSize}px` } as React.CSSProperties}
                >
                  <div
                    role="presentation"
                    className="relative w-full overflow-hidden"
                    style={{ height: totalSize }}
                  >
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                      const item = filteredCountries[virtualRow.index]
                      if (!item || !item.value) return null
                      const { label, value } = item

                      return (
                        <CommandItem
                          key={value}
                          value={value}
                          data-index={virtualRow.index}
                          ref={virtualizer.measureElement}
                          data-checked={value === selectedCountry}
                          onSelect={(currentValue) => {
                            setOpen(false)
                            onChange(currentValue as Country)
                          }}
                          aria-setsize={filteredCountries.length}
                          aria-posinset={virtualRow.index + 1}
                          className="absolute top-0 left-0 w-full"
                          style={{
                            height: virtualRow.size,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <div className="inline-flex w-full min-w-0 flex-1 items-center justify-between gap-2">
                            <span title={label} className="truncate">
                              {label}
                            </span>
                            <span className="text-muted-foreground text-xs">{getCountryCode(value)}</span>
                          </div>
                        </CommandItem>
                      )
                    })}
                  </div>
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

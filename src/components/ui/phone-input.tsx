import { Combobox as ComboboxPrimitive } from '@base-ui/react'
import { IconSearch, IconSelector } from '@tabler/icons-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useCallback, useDeferredValue, useMemo, useRef, useState } from 'react'
import RPNInput, {
  type Country,
  getCountryCallingCode,
  type Props as RPNInputProps,
} from 'react-phone-number-input'
import defaultLabels from 'react-phone-number-input/locale/es'
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Button } from './button'

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

function getItemLabel(item: CountrySelectOption | null) {
  return item ? item.label : ''
}

function CountrySelect({ disabled, value: selectedCountry, onChange, options }: CountrySelectProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const countries = useMemo(() => options.filter((option) => option.value !== undefined), [options])

  const deferredSearchValue = useDeferredValue(searchValue)

  const scrollElementRef = useRef<HTMLDivElement | null>(null)

  const { contains } = ComboboxPrimitive.useFilter({ value: selectedCountry })

  const resolvedSearchValue =
    searchValue === '' || deferredSearchValue === '' ? searchValue : deferredSearchValue

  const filteredItems = useMemo(() => {
    return countries.filter((item) => contains(item, resolvedSearchValue, getItemLabel))
  }, [contains, resolvedSearchValue, countries.filter])

  const virtualizer = useVirtualizer({
    enabled: open,
    count: filteredItems.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 32,
    overscan: 4,
  })

  const handleScrollElementRef = useCallback(
    (element: HTMLDivElement | null) => {
      scrollElementRef.current = element
      if (element) {
        virtualizer.measure()
      }
    },
    [virtualizer],
  )

  const getCountryCode = useCallback((country: CountrySelectOption | null) => {
    return country?.value ? `+${getCountryCallingCode(country.value)}` : 'País'
  }, [])

  const totalSize = virtualizer.getTotalSize()

  return (
    <Combobox
      virtualized
      items={countries}
      filteredItems={filteredItems}
      disabled={disabled}
      value={selectedCountry ? countries.find((c) => c.value === selectedCountry) : null}
      open={open}
      onOpenChange={setOpen}
      onValueChange={(item) => {
        if (item?.value) onChange(item.value)
      }}
      inputValue={searchValue}
      onInputValueChange={setSearchValue}
      itemToStringLabel={getItemLabel}
      onItemHighlighted={(item, { reason, index }) => {
        if (!item) {
          return
        }

        const isStart = index === 0
        const isEnd = index === filteredItems.length - 1
        const shouldScroll = reason === 'none' || (reason === 'keyboard' && (isStart || isEnd))

        if (shouldScroll) {
          queueMicrotask(() => {
            virtualizer.scrollToIndex(index, { align: isEnd ? 'start' : 'end' })
          })
        }
      }}
    >
      <ComboboxTrigger render={<Button className="w-full max-w-20 justify-between" variant="outline" />}>
        <ComboboxValue>{getCountryCode}</ComboboxValue>
        <IconSelector className="-me-1!" />
      </ComboboxTrigger>
      <ComboboxPopup aria-label="Selecciona una opción" align="start" className="[--anchor-width:288px]">
        <div className="border-b p-1">
          <ComboboxInput
            showTrigger={false}
            placeholder="Buscar"
            aria-invalid="false"
            startAddon={<IconSearch />}
            className="rounded-sm before:rounded-[calc(var(--radius-sm)-1px)]"
          />
        </div>
        <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
        <ComboboxList className="overflow-hidden">
          {filteredItems.length > 0 && (
            <div
              role="presentation"
              ref={handleScrollElementRef}
              className="h-[min(20rem,var(--total-size))] max-h-(--available-height) overflow-y-auto"
              style={{ '--total-size': `${totalSize}px` } as React.CSSProperties}
            >
              <div role="presentation" className="relative h-(--total-size) w-full">
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const item = filteredItems[virtualItem.index]
                  if (!item) {
                    return null
                  }

                  return (
                    <ComboboxItem
                      key={virtualItem.key}
                      index={virtualItem.index}
                      data-index={virtualItem.index}
                      ref={virtualizer.measureElement}
                      value={item}
                      aria-setsize={filteredItems.length}
                      aria-posinset={virtualItem.index + 1}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: virtualItem.size,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <div className="inline-flex w-full items-center justify-between gap-2">
                        <span>{item.label}</span>
                        <span className="text-muted-foreground text-xs">{getCountryCode(item)}</span>
                      </div>
                    </ComboboxItem>
                  )
                })}
              </div>
            </div>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}

import { IconSearch, IconSelector } from '@tabler/icons-react'
import { useCallback, useMemo } from 'react'
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

function CountrySelect({ disabled, value: selectedCountry, onChange, options }: CountrySelectProps) {
  const countries = useMemo(() => options.filter((option) => option.value !== undefined), [options])
  // const [filteredOptions, setFilteredOptions] = useState(countries)

  const getCountryCode = useCallback((country: Country) => {
    return `+${getCountryCallingCode(country)}`
  }, [])

  // const handleCountryFilter = useCallback(
  //   (value: string) => {
  //     const normalizedValue = normalizeString(value).toLocaleLowerCase()
  //     const filtered = countries.filter((country) =>
  //       normalizeString(country.label).toLocaleLowerCase().includes(normalizedValue),
  //     )
  //     setFilteredOptions(filtered)
  //   },
  //   [countries],
  // )

  return (
    <Combobox
      items={countries}
      disabled={disabled}
      onValueChange={(item) => {
        if (item?.value) onChange(item.value)
      }}
      value={selectedCountry ? countries.find((c) => c.value === selectedCountry) : null}
    >
      <ComboboxTrigger render={<Button className="w-full max-w-20 justify-between" variant="outline" />}>
        <ComboboxValue>
          {(item: CountrySelectOption) => (item.value ? getCountryCode(item.value) : 'País')}
        </ComboboxValue>
        <IconSelector className="-me-1!" />
      </ComboboxTrigger>
      <ComboboxPopup aria-label="Selecciona una opción" className="[--anchor-width:288px]">
        <div className="border-b p-2">
          <ComboboxInput
            showTrigger={false}
            placeholder="Buscar"
            aria-invalid="false"
            startAddon={<IconSearch />}
            className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
          />
        </div>
        <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
        <ComboboxList>
          {(item: CountrySelectOption) =>
            item && (
              <ComboboxItem key={item.value} value={item}>
                <div className="inline-flex w-full items-center justify-between gap-2">
                  <span>{item.label}</span>
                  {item.value && (
                    <span className="text-muted-foreground text-xs">{getCountryCode(item.value)}</span>
                  )}
                </div>
              </ComboboxItem>
            )
          }
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}

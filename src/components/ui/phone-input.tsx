import { useMemo } from 'react'
import RPNInput, {
  type Country,
  getCountryCallingCode,
  type Props as RPNInputProps,
} from 'react-phone-number-input'
import defaultLabels from 'react-phone-number-input/locale/es'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
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

function getCountryCode(country: CountrySelectOption | null) {
  return country?.value ? `+${getCountryCallingCode(country.value)}` : 'País'
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

  return (
    <Combobox
      items={countries}
      disabled={disabled}
      value={selectedCountry ? countries.find((c) => c.value === selectedCountry) : null}
      onValueChange={(item) => {
        if (item?.value) onChange(item.value)
      }}
    >
      <ComboboxTrigger render={<Button variant="outline" aria-invalid={false} data-invalid={false} />}>
        <ComboboxValue>{getCountryCode}</ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent align="start" className="[--anchor-width:240px]" aria-label="Selecciona una opción">
        <ComboboxInput showTrigger={false} placeholder="Buscar" />
        <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item}>
              <div className="inline-flex w-full items-center justify-between gap-2">
                <span>{item.label}</span>
                <span className="text-muted-foreground text-xs">{getCountryCode(item)}</span>
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

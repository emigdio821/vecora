import { ChevronsUpDownIcon, SearchIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import RPNInput, {
  type Country,
  getCountryCallingCode,
  type Props as RPNInputProps,
} from 'react-phone-number-input'
import defaultLabels from 'react-phone-number-input/locale/es'
import { Group, GroupSeparator } from '@/components/ui/group'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from '../ui/combobox'

type PhoneInputProps = Omit<
  RPNInputProps<typeof InputComponent>,
  'inputComponent' | 'countrySelectComponent' | 'labels'
> & {
  id?: string
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

function getCountryCode(country: CountrySelectOption) {
  return `+${getCountryCallingCode(country.value ?? 'MX')}`
}

export function PhoneInput({ className, ...props }: PhoneInputProps) {
  return (
    <RPNInput
      defaultCountry="MX"
      international={false}
      labels={defaultLabels}
      containerComponent={Group}
      inputComponent={InputComponent}
      countrySelectComponent={CountrySelect}
      className={cn('w-full', className)}
      {...props}
    />
  )
}

function InputComponent({ className, ...props }: React.ComponentProps<'input'>) {
  return <Input className={cn('focus-visible:z-10', className)} {...props} />
}

function CountrySelect({ disabled, value: selectedCountry, onChange, options }: CountrySelectProps) {
  const [open, setOpen] = useState(false)
  const countries = useMemo(() => options.filter((option) => option.value !== undefined), [options])

  // Fragment so the separator is a direct child of the Group container.
  return (
    <>
      <Combobox
        open={open}
        autoHighlight
        items={countries}
        value={countries.find((c) => c.value === selectedCountry)}
        disabled={disabled}
        onValueChange={(country: CountrySelectOption | null) => {
          onChange(country?.value ?? 'MX')
        }}
        onOpenChange={setOpen}
      >
        <ComboboxTrigger render={<Button className="w-20 justify-between font-normal" variant="outline" />}>
          <ComboboxValue>{getCountryCode}</ComboboxValue>
          <ChevronsUpDownIcon className="-me-1!" />
        </ComboboxTrigger>
        <ComboboxPopup aria-label="Código" className="max-w-64 sm:max-w-72 sm:min-w-72">
          <div className="border-b p-2">
            <ComboboxInput
              showTrigger={false}
              placeholder="Buscar"
              className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
              startAddon={<SearchIcon />}
            />
          </div>
          <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
          <ComboboxList>
            {(country: CountrySelectOption) => (
              <ComboboxItem key={country.value} value={country}>
                {country.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>
      <GroupSeparator />
    </>
  )
}

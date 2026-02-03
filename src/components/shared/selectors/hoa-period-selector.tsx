import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { hoaBoardPeriodsListQueryOptions } from '@/api/tanstack-queries/hoa-board'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/utils'

interface HoaPeriodSelectorProps extends React.ComponentProps<typeof Select> {
  invalid?: boolean
  placeholder?: string
  includeNoneOption?: boolean
  noneOptionLabel?: string
  value: string | null
}

export function HoaPeriodSelector({
  invalid = false,
  disabled = false,
  placeholder = 'Selecciona una opción',
  includeNoneOption = true,
  noneOptionLabel = 'Sin selección',
  value,
  ...selectProps
}: HoaPeriodSelectorProps) {
  const { data: periods = [], isLoading: isLoadingPeriods } = useQuery(hoaBoardPeriodsListQueryOptions())

  const periodOptions = useMemo(() => {
    return periods.map((period) => ({
      value: period.id,
      label: `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`,
    }))
  }, [periods])

  function renderPeriodValue(value: string | undefined) {
    if (isLoadingPeriods) return <span className="animate-pulse">Cargando periodos...</span>

    if (periodOptions.length === 0) {
      return <span className="text-muted-foreground">No hay periodos disponibles</span>
    }

    const period = periodOptions.find((p) => p.value === value)
    return period ? period.label : <span className="text-muted-foreground">Selecciona un periodo</span>
  }

  return (
    <Select value={value} disabled={periods.length === 0 || disabled} {...selectProps}>
      <SelectTrigger aria-invalid={invalid} className="w-full">
        <SelectValue>{renderPeriodValue}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {includeNoneOption && <SelectItem value={null}>{noneOptionLabel}</SelectItem>}

          {periodOptions.map((period) => (
            <SelectItem key={period.value} value={period.value}>
              {period.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

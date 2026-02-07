import { IconWind } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { paymentsByYearQueryOptions } from '@/api/tanstack-queries/payments'
import { ChartDottedBackgroundPattern } from '@/components/shared/charts/dotted-bg'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TextGenericSkeleton } from '@/components/shared/skeletons/text-generic'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Frame, FrameDescription, FrameFooter, FrameHeader, FrameTitle } from '@/components/ui/frame'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STARTING_YEAR } from '@/lib/constants'
import { getAllMonthsMap } from '@/lib/utils'

const chartConfig = {
  paid: {
    label: 'Pagado',
    color: 'var(--color-success)',
  },
  pending: {
    label: 'Pendiente',
    color: 'var(--color-warning)',
  },
} satisfies ChartConfig

const currentYear = new Date().getFullYear()
const paymentsChartYears = Array.from({ length: currentYear - STARTING_YEAR + 1 }, (_, i) => ({
  value: (STARTING_YEAR + i).toString(),
  label: (STARTING_YEAR + i).toString(),
}))

export function PaymentsChart() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const {
    data: payments = [],
    error,
    isLoading,
    refetch,
  } = useQuery(paymentsByYearQueryOptions(selectedYear))

  const chartData = useMemo(() => {
    const allMonths = getAllMonthsMap()
    const monthsMap = new Map<number, { month: string; paid: number; pending: number }>()

    for (const payment of payments) {
      const monthIndex = new Date(payment.createdAt).getMonth() + 1
      const amount = Number(payment.amount)

      const entry = monthsMap.get(monthIndex) ?? { month: allMonths[monthIndex], paid: 0, pending: 0 }

      if (payment.status === 'paid') {
        entry.paid += amount
      } else {
        entry.pending += amount
      }

      monthsMap.set(monthIndex, entry)
    }

    return Array.from(monthsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([, data]) => data)
  }, [payments])

  const paymentStats = useMemo(() => {
    const totalPaid = payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    const totalPending = payments
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const total = totalPaid + totalPending
    const paidPercentage = total > 0 ? (totalPaid / total) * 100 : 0
    const pendingPercentage = total > 0 ? (totalPending / total) * 100 : 0
    const pendingPayments = payments.filter((p) => p.status === 'pending')

    return {
      totalPaid,
      totalPending,
      total,
      paidPercentage,
      pendingPercentage,
      pendingPayments,
    }
  }, [payments])

  function renderChartContent() {
    if (isLoading) {
      return <TextGenericSkeleton />
    } else if (error) {
      return (
        <TSQueryGenericError
          refetch={refetch}
          className="size-full flex-1 border-none"
          errorDescription="Algo salió mal al cargar la información de los pagos."
        />
      )
    } else if (payments.length === 0) {
      return (
        <Empty className="size-full">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconWind />
            </EmptyMedia>
            <EmptyTitle>Sin resultados</EmptyTitle>
            <EmptyDescription>No hay pagos para mostrar en este año.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }

    return (
      <AreaChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent valueFormatFn={(value) => `$${Number(value).toLocaleString()}`} />}
        />
        <defs>
          <ChartDottedBackgroundPattern config={chartConfig} />
        </defs>
        <Area
          dataKey="paid"
          type="natural"
          fill="url(#dotted-background-pattern-paid)"
          fillOpacity={0.4}
          stroke="var(--color-success)"
          stackId="a"
          strokeWidth={0.8}
        />
        <Area
          dataKey="pending"
          type="natural"
          fill="url(#dotted-background-pattern-pending)"
          fillOpacity={0.4}
          stroke="var(--color-warning)"
          stackId="a"
          strokeWidth={0.8}
        />
      </AreaChart>
    )
  }

  return (
    <Frame>
      <FrameHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <FrameTitle>Pagos</FrameTitle>
          <FrameDescription>
            Mostrando el total de pagos en el año <span className="font-medium">{selectedYear}</span>
          </FrameDescription>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Label htmlFor="payments-chart-year">Año</Label>
          <Select
            disabled={isLoading}
            value={selectedYear.toString()}
            onValueChange={(value) => value && setSelectedYear(Number(value))}
          >
            <SelectTrigger id="payments-chart-year" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                {paymentsChartYears.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </FrameHeader>
      <Card>
        <CardContent>
          <ChartContainer config={chartConfig} className="max-h-80 min-h-52 w-full">
            {renderChartContent()}
          </ChartContainer>
        </CardContent>
      </Card>
      {paymentStats.total > 0 && (
        <FrameFooter className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="size-3 shrink-0 rounded-[2px] border bg-success" />
              <span className="text-muted-foreground">
                Pagado:{' '}
                <span className="font-medium text-foreground">{paymentStats.paidPercentage.toFixed(1)}%</span>
              </span>
            </div>

            <Popover>
              <PopoverTrigger
                render={
                  <Button variant="plain">
                    <div className="size-3 shrink-0 rounded-[2px] border bg-warning" />
                    <span className="text-muted-foreground">
                      Pendiente:{' '}
                      <span className="font-medium text-foreground">
                        {paymentStats.pendingPercentage.toFixed(1)}%
                      </span>
                    </span>
                  </Button>
                }
              />
              <PopoverContent align="start" className="max-w-80 p-0">
                <div className="p-2 pb-0">
                  <PopoverTitle className="text-sm">Pagos pendientes</PopoverTitle>
                  <PopoverDescription>
                    Propietarios con pagos pendientes en <span className="font-medium">{selectedYear}</span>
                  </PopoverDescription>
                </div>
                <div className="max-h-72 space-y-1 overflow-y-auto p-2 pt-0">
                  {paymentStats.pendingPayments.map((payment) => (
                    <Card key={payment.id} className="rounded-sm">
                      <CardHeader className="gap-0 px-2.5 py-2">
                        <CardTitle className="text-sm">{`${payment.owner?.firstName} ${payment.owner?.lastName}`}</CardTitle>
                        <CardDescription className="text-sm">{payment.concept}</CardDescription>
                        <CardAction>
                          <span className="font-medium text-sm">${Number(payment.amount).toFixed(2)}</span>
                        </CardAction>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </FrameFooter>
      )}
    </Frame>
  )
}

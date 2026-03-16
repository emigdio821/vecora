import { IconWind } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { paymentsByYearQueryOptions } from '@/api/tanstack-queries/payments'
import { ChartDottedBackgroundPattern } from '@/components/shared/charts/dotted-bg'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TextGenericSkeleton } from '@/components/shared/skeletons/text-generic'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFrame,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
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

    for (let i = 1; i <= 12; i++) {
      monthsMap.set(i, { month: allMonths[i], paid: 0, pending: 0 })
    }

    for (const payment of payments) {
      const monthIndex = new Date(payment.createdAt).getMonth() + 1
      const amount = Number(payment.amount)
      const entry = monthsMap.get(monthIndex)
      if (!entry) continue

      if (payment.status === 'paid') {
        entry.paid += amount
      } else {
        entry.pending += amount
      }
    }

    return Array.from(monthsMap.values())
  }, [payments])

  const paymentStats = useMemo(() => {
    const pendingPayments: typeof payments = []
    let totalPaid = 0
    let totalPending = 0

    for (const payment of payments) {
      const amount = Number(payment.amount)

      if (payment.status === 'paid') {
        totalPaid += amount
      } else {
        totalPending += amount
        pendingPayments.push(payment)
      }
    }

    const total = totalPaid + totalPending
    const paidPercentage = total > 0 ? (totalPaid / total) * 100 : 0
    const pendingPercentage = total > 0 ? (totalPending / total) * 100 : 0

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
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-[10px] sm:text-xs"
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
          isAnimationActive={false}
          dataKey="paid"
          type="natural"
          fill="url(#dotted-background-pattern-paid)"
          fillOpacity={0.4}
          stroke="var(--color-success)"
          stackId="a"
          strokeWidth={0.8}
        />
        <Area
          isAnimationActive={false}
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
    <CardFrame>
      <CardFrameHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardFrameTitle>Pagos</CardFrameTitle>
          <CardFrameDescription>
            Mostrando el total de pagos en el año <span className="font-medium">{selectedYear}</span>
          </CardFrameDescription>
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
      </CardFrameHeader>
      <Card>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-40 w-full sm:h-60 lg:h-80">
            {renderChartContent()}
          </ChartContainer>
        </CardContent>
      </Card>
      {paymentStats.total > 0 && (
        <CardFrameFooter className="flex items-center justify-between gap-4 text-sm">
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
                        <CardTitle className="text-sm">{`${payment.resident?.firstName} ${payment.resident?.lastName}`}</CardTitle>
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
        </CardFrameFooter>
      )}
    </CardFrame>
  )
}

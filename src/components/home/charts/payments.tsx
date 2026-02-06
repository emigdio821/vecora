import { IconWind } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Bar, BarChart, XAxis } from 'recharts'
import { paymentsByYearQueryOptions } from '@/api/tanstack-queries/payments'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/ui/frame'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
    color: 'var(--chart-1)',
  },
  pending: {
    label: 'Pendiente',
    color: 'var(--chart-2)',
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

  // if (isLoading) return <TextGenericSkeleton />

  // if (error) {
  //   return (
  //     <TSQueryGenericError
  //       refetch={refetch}
  //       className="size-full flex-1 border-none"
  //       errorDescription="Algo salió mal al cargar la información de los pagos."
  //     />
  //   )
  // }

  function renderChartContent() {
    if (error && !isLoading) {
      return (
        <TSQueryGenericError
          refetch={refetch}
          className="size-full flex-1 border-none"
          errorDescription="Algo salió mal al cargar la información de los pagos."
        />
      )
    } else if (payments.length === 0 && !isLoading) {
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
      <BarChart accessibilityLayer data={chartData}>
        <rect x="0" y="0" width="100%" height="85%" fill="url(#default-multiple-pattern-dots)" />
        <defs>
          <DottedBackgroundPattern />
        </defs>
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" hideLabel />} />
        <Bar dataKey="paid" fill="var(--chart-1)" shape={<CustomHatchedBar />} radius={4} />
        <Bar dataKey="pending" fill="var(--chart-2)" shape={<CustomHatchedBar />} radius={4} />
      </BarChart>
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
      <FrameFooter className="flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="size-3 shrink-0 rounded-[2px] border bg-chart-1" />
            <span className="text-muted-foreground">
              Pagado:{' '}
              <span className="font-medium text-foreground">{paymentStats.paidPercentage.toFixed(1)}%</span>
            </span>
          </div>

          <Popover>
            <PopoverTrigger
              render={
                <Button variant="plain">
                  <div className="size-3 shrink-0 rounded-[2px] border bg-chart-2" />
                  <span className="text-muted-foreground">
                    Pendiente:{' '}
                    <span className="font-medium text-foreground">
                      {paymentStats.pendingPercentage.toFixed(1)}%
                    </span>
                  </span>
                </Button>
              }
            />
            <PopoverContent align="start" className="max-w-80 overflow-y-auto p-0">
              <Frame className="w-full">
                <FrameHeader className="p-2">
                  <FrameTitle className="text-sm">Pagos pendientes</FrameTitle>
                  <FrameDescription>
                    Propietarios con pagos pendientes en <span className="font-medium">{selectedYear}</span>
                  </FrameDescription>
                </FrameHeader>
                <div className="max-h-96 space-y-1 overflow-y-auto">
                  {paymentStats.pendingPayments.map((payment) => (
                    <FramePanel className="flex gap-2 rounded-sm p-2" key={payment.id}>
                      <div className="flex-1">
                        <h2 className="font-medium text-sm">{`${payment.owner?.firstName} ${payment.owner?.lastName}`}</h2>
                        <p className="line-clamp-2 text-muted-foreground text-sm">{payment.concept}</p>
                      </div>

                      <span className="font-medium text-sm">${Number(payment.amount).toFixed(2)}</span>
                    </FramePanel>
                  ))}
                </div>
              </Frame>
            </PopoverContent>
          </Popover>
        </div>
      </FrameFooter>
    </Frame>
  )
}

const CustomHatchedBar = (
  props: React.SVGProps<SVGRectElement> & {
    dataKey?: string
    isHatched?: boolean
  },
) => {
  const { fill, x, y, width, height, dataKey } = props
  const isHatched = props.isHatched ?? true

  return (
    <>
      <rect
        rx={4}
        x={x}
        y={y}
        width={width}
        height={height}
        stroke="none"
        fill={isHatched ? `url(#hatched-bar-pattern-${dataKey})` : fill}
      />
      <defs>
        <pattern
          key={dataKey}
          id={`hatched-bar-pattern-${dataKey}`}
          x="0"
          y="0"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
        >
          <rect width="10" height="10" opacity={0.5} fill={fill} />
          <rect width="1" height="10" fill={fill} />
        </pattern>
      </defs>
    </>
  )
}
const DottedBackgroundPattern = () => {
  return (
    <pattern
      id="default-multiple-pattern-dots"
      x="0"
      y="0"
      width="10"
      height="10"
      patternUnits="userSpaceOnUse"
    >
      <circle className="text-muted dark:text-muted/40" cx="2" cy="2" r="1" fill="currentColor" />
    </pattern>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addDays, addYears, format, getYear, parseISO, startOfMonth } from 'date-fns'
import { useForm } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { DrawerPrimitive } from '@/components/ui/drawer'
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Form } from '@/components/ui/form'
import { toastManager } from '@/components/ui/toast'
import { useCurrency } from '@/hooks/use-currency'
import { type CurrencyCode, ISO_DAY } from '@/lib/utils'
import { type PeriodInput, periodSchema } from '@/lib/validations/treasury'
import { createPeriod } from '@/server-actions/treasury'
import { type PeriodQueryData, TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'
import { PeriodFormFields } from './period-form-fields'

const FORM_ID = 'create-period-form'

/**
 * Pre-fills the next cycle: the day after the latest period ends, one year
 * long, same rates. Without a previous period, a year starting this month.
 * Rates in another currency (it changed since) aren't carried over.
 */
function defaultValues(latest: PeriodQueryData | undefined, currency: CurrencyCode): PeriodInput {
  const startsOn = latest ? addDays(parseISO(latest.ends_on), 1) : startOfMonth(new Date())
  const endsOn = addDays(addYears(startsOn, 1), -1)
  const rates = latest?.currency === currency ? latest : undefined

  return {
    name: `${getYear(startsOn)}-${getYear(endsOn)}`,
    starts_on: format(startsOn, ISO_DAY),
    ends_on: format(endsOn, ISO_DAY),
    monthly_fee: rates ? Number(rates.monthly_fee) : (null as unknown as number),
    late_fee: rates ? Number(rates.late_fee) : 100,
    due_day: latest?.due_day ?? 10,
  }
}

interface CreatePeriodDrawerProps extends React.ComponentProps<typeof Drawer> {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Newest existing period, used to suggest the next one. */
  latest: PeriodQueryData | undefined
}

export function CreatePeriodDrawer({ open, onOpenChange, latest, ...props }: CreatePeriodDrawerProps) {
  const queryClient = useQueryClient()
  const currency = useCurrency()

  const form = useForm<PeriodInput>({
    resolver: zodResolver(periodSchema),
    defaultValues: defaultValues(latest, currency),
  })

  const mutation = useMutation({
    mutationFn: async (values: PeriodInput) => {
      const result = await createPeriod(values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      toastManager.add({ type: 'success', title: 'Periodo creado', description: values.name })
      onOpenChange(false)
    },
    onError: (error) => {
      form.setError('root', { message: error.message })
    },
  })

  const handleOpenChange: DrawerPrimitive.Root.Props['onOpenChange'] = (nextOpen, eventDetails) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  function handleOpenChangeComplete(isOpen: boolean) {
    props.onOpenChangeComplete?.(isOpen)

    if (!isOpen) {
      form.reset(defaultValues(latest, currency))
    }
  }

  return (
    <Drawer
      position="right"
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      {...props}
    >
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>Nuevo periodo</DrawerTitle>
          <DrawerDescription>
            Cada movimiento pertenece a un periodo según su fecha. El periodo define la cuota mensual y el
            recargo por pago tardío.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerPanel>
          <Form
            id={FORM_ID}
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <PeriodFormFields form={form} currency={currency} disabled={mutation.isPending} />

            {form.formState.errors.root && (
              <Alert variant="error">
                <IconAlertCircle />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
              </Alert>
            )}
          </Form>
        </DrawerPanel>

        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
            Cancelar
          </DrawerClose>
          <Button type="submit" form={FORM_ID} disabled={mutation.isPending} loading={mutation.isPending}>
            Crear
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

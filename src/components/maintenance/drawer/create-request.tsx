import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
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
import { useCurrency, useFormatCurrency } from '@/hooks/use-currency'
import { ISO_DAY } from '@/lib/utils'
import { type MaintenanceRequestInput, maintenanceRequestSchema } from '@/lib/validations/maintenance'
import { createMaintenanceRequest } from '@/server-actions/maintenance'
import { MAINTENANCE_QUERY_KEY } from '@/tanstack-queries/maintenance'
import { RequestFormFields } from './request-form-fields'

const FORM_ID = 'create-request-form'

function defaultValues(): MaintenanceRequestInput {
  return {
    title: '',
    details: '',
    // The schema wants a number; RHF/NumberField hand us null until typed.
    amount: null as unknown as number,
    requested_on: format(new Date(), ISO_DAY),
  }
}

interface CreateRequestDrawerProps extends React.ComponentProps<typeof Drawer> {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRequestDrawer({ open, onOpenChange, ...props }: CreateRequestDrawerProps) {
  const queryClient = useQueryClient()
  const currency = useCurrency()
  const formatCurrency = useFormatCurrency()

  const form = useForm<MaintenanceRequestInput>({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: defaultValues(),
  })

  const mutation = useMutation({
    mutationFn: async (values: MaintenanceRequestInput) => {
      const result = await createMaintenanceRequest(values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [MAINTENANCE_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: 'Solicitud enviada a tesorería',
        description: `${values.title} - ${formatCurrency(values.amount, currency)}`,
      })
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
      form.reset(defaultValues())
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
          <DrawerTitle>Nueva solicitud</DrawerTitle>
          <DrawerDescription>
            Registra lo que se hizo y cuánto costó. Quedará pendiente hasta que la tesorería la pague o la
            rechace.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerPanel>
          <Form
            id={FORM_ID}
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <RequestFormFields form={form} currency={currency} disabled={mutation.isPending} />

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
            Enviar solicitud
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

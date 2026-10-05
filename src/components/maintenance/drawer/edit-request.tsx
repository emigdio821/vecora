import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query'
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
import { type MaintenanceRequestInput, maintenanceRequestSchema } from '@/lib/validations/maintenance'
import { updateMaintenanceRequest } from '@/server-actions/maintenance'
import { MAINTENANCE_QUERY_KEY, type MaintenanceRequestQueryData } from '@/tanstack-queries/maintenance'
import { RequestFormFields } from './request-form-fields'

const FORM_ID = 'edit-request-form'

interface EditRequestDrawerProps extends React.ComponentProps<typeof Drawer> {
  request: MaintenanceRequestQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type UpdateRequestMutation = UseMutationResult<void, Error, MaintenanceRequestInput>

export function EditRequestDrawer({ request, open, onOpenChange, ...props }: EditRequestDrawerProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: MaintenanceRequestInput) => {
      const result = await updateMaintenanceRequest(request.id, values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [MAINTENANCE_QUERY_KEY] })
      toastManager.add({ type: 'success', title: 'Solicitud actualizada', description: values.title })
      onOpenChange(false)
    },
  })

  const handleOpenChange: DrawerPrimitive.Root.Props['onOpenChange'] = (nextOpen, eventDetails) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  return (
    <Drawer position="right" open={open} onOpenChange={handleOpenChange} {...props}>
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>Editar solicitud</DrawerTitle>
          <DrawerDescription>Solo se puede editar mientras esté pendiente.</DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while open, so the form starts from the current row
            and a refetch mid-edit can't reset it. */}
        <EditRequestForm request={request} mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

function EditRequestForm({
  request,
  mutation,
}: {
  request: MaintenanceRequestQueryData
  mutation: UpdateRequestMutation
}) {
  const form = useForm<MaintenanceRequestInput>({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: {
      title: request.title,
      details: request.details ?? '',
      amount: Number(request.amount),
      requested_on: request.requested_on,
    },
  })

  return (
    <>
      <DrawerPanel>
        <Form
          id={FORM_ID}
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) =>
            mutation.mutate(values, {
              onError: (error) => form.setError('root', { message: error.message }),
            }),
          )}
        >
          <RequestFormFields form={form} currency={request.currency} disabled={mutation.isPending} />

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
          Guardar
        </Button>
      </DrawerFooter>
    </>
  )
}

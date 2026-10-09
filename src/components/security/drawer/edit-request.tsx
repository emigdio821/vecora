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
import { type SecurityRequestInput, securityRequestSchema } from '@/lib/validations/security'
import { m } from '@/paraglide/messages'
import { updateSecurityRequest } from '@/server-actions/security'
import { SECURITY_QUERY_KEY, type SecurityRequestQueryData } from '@/tanstack-queries/security'
import { RequestFormFields } from './request-form-fields'

const FORM_ID = 'edit-request-form'

interface EditRequestDrawerProps extends React.ComponentProps<typeof Drawer> {
  request: SecurityRequestQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type UpdateRequestMutation = UseMutationResult<void, Error, SecurityRequestInput>

export function EditRequestDrawer({
  request,
  open,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: EditRequestDrawerProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: SecurityRequestInput) => {
      const result = await updateSecurityRequest(request.id, values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [SECURITY_QUERY_KEY] })
      toastManager.add({ type: 'success', title: m.requests_update_success(), description: values.title })
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
    <Drawer
      position="right"
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(isOpen) => {
        // Clears `success`, which keeps the form busy while the drawer slides out.
        if (!isOpen) {
          mutation.reset()
        }
        onOpenChangeComplete?.(isOpen)
      }}
      {...props}
    >
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>{m.requests_edit_title()}</DrawerTitle>
          <DrawerDescription>{m.requests_edit_description()}</DrawerDescription>
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
  request: SecurityRequestQueryData
  mutation: UpdateRequestMutation
}) {
  const form = useForm<SecurityRequestInput>({
    resolver: zodResolver(securityRequestSchema),
    defaultValues: {
      kind: request.kind,
      title: request.title,
      details: request.details ?? '',
      amount: Number(request.amount),
      requested_on: request.requested_on,
    },
  })

  // Still busy after a save, until the drawer has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

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
          <RequestFormFields form={form} currency={request.currency} disabled={isBusy} />

          {form.formState.errors.root && (
            <Alert variant="error">
              <IconAlertCircle />
              <AlertTitle>{m.common_error()}</AlertTitle>
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}
        </Form>
      </DrawerPanel>

      <DrawerFooter>
        <DrawerClose render={<Button variant="ghost" />} disabled={isBusy}>
          {m.common_action_cancel()}
        </DrawerClose>
        <Button type="submit" form={FORM_ID} disabled={isBusy} loading={isBusy}>
          {m.common_action_save()}
        </Button>
      </DrawerFooter>
    </>
  )
}

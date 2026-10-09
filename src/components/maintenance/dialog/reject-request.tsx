import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { DialogPrimitive } from '@/components/ui/dialog'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { toastManager } from '@/components/ui/toast'
import { type RejectRequestInput, rejectRequestSchema } from '@/lib/validations/requests'
import { m } from '@/paraglide/messages'
import { rejectMaintenanceRequest } from '@/server-actions/maintenance'
import { MAINTENANCE_QUERY_KEY, type MaintenanceRequestQueryData } from '@/tanstack-queries/maintenance'

const FORM_ID = 'reject-request-form'

interface RejectRequestDialogProps extends React.ComponentProps<typeof Dialog> {
  request: MaintenanceRequestQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type RejectMutation = UseMutationResult<void, Error, RejectRequestInput>

/** Treasurer: declines a pending request; the reason stays visible to the requester. */
export function RejectRequestDialog({
  request,
  open,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: RejectRequestDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: RejectRequestInput) => {
      const result = await rejectMaintenanceRequest(request.id, values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [MAINTENANCE_QUERY_KEY] })
      toastManager.add({ type: 'success', title: m.requests_reject_success(), description: request.title })
      onOpenChange(false)
    },
  })

  const handleOpenChange: DialogPrimitive.Root.Props['onOpenChange'] = (nextOpen, eventDetails) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(isOpen) => {
        // Clears `success`, which keeps the form busy while the dialog closes.
        if (!isOpen) {
          mutation.reset()
        }
        onOpenChangeComplete?.(isOpen)
      }}
      {...props}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{m.requests_reject_title()}</DialogTitle>
          <DialogDescription>{m.requests_reject_description({ title: request.title })}</DialogDescription>
        </DialogHeader>

        {/* Mounted only while open so each rejection starts with an empty reason. */}
        <RejectRequestForm mutation={mutation} />
      </DialogPopup>
    </Dialog>
  )
}

function RejectRequestForm({ mutation }: { mutation: RejectMutation }) {
  const form = useForm<RejectRequestInput>({
    resolver: zodResolver(rejectRequestSchema),
    defaultValues: { reason: '' },
  })

  // Still busy after a reject, until the dialog has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

  return (
    <>
      <DialogPanel>
        <Form
          id={FORM_ID}
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) =>
            mutation.mutate(values, {
              onError: (error) => form.setError('root', { message: error.message }),
            }),
          )}
        >
          <Controller
            name="reason"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel>
                  {m.requests_reason()} <span className="text-destructive">*</span>
                </FieldLabel>
                <Textarea {...field} rows={3} className="max-h-40" disabled={isBusy} />
                <FieldDescription>{m.requests_reason_description()}</FieldDescription>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          {form.formState.errors.root && (
            <Alert variant="error">
              <IconAlertCircle />
              <AlertTitle>{m.common_error()}</AlertTitle>
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}
        </Form>
      </DialogPanel>

      <DialogFooter>
        <DialogClose render={<Button variant="ghost" />} disabled={isBusy}>
          {m.common_action_cancel()}
        </DialogClose>
        <Button type="submit" form={FORM_ID} variant="destructive" disabled={isBusy} loading={isBusy}>
          {m.requests_action_reject()}
        </Button>
      </DialogFooter>
    </>
  )
}

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { CircleAlertIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
import { Input } from '@/components/ui/input'
import { toastManager } from '@/components/ui/toast'
import type { Settings } from '@/lib/supabase/settings'
import { DEFAULT_RESIDENTIAL_LABEL, type SettingsInput, settingsSchema } from '@/lib/validations/settings'
import { updateSettings } from '@/server-actions/settings'

const FORM_ID = 'edit-settings-form'

interface EditSettingsDialogProps extends React.ComponentProps<typeof Dialog> {
  settings: Settings
  open: boolean
  onOpenChange: (open: boolean) => void
}

type UpdateSettingsMutation = UseMutationResult<void, Error, SettingsInput>

/** President: the residential's details. The sidebar reads them server-side, hence the refresh. */
export function EditSettingsDialog({ settings, open, onOpenChange, ...props }: EditSettingsDialogProps) {
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: async (values: SettingsInput) => {
      const result = await updateSettings(values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      router.refresh()
      toastManager.add({ type: 'success', title: 'Ajustes guardados' })
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
    <Dialog open={open} onOpenChange={handleOpenChange} {...props}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Ajustes del residencial</DialogTitle>
          <DialogDescription>Datos generales que se muestran en toda la aplicación.</DialogDescription>
        </DialogHeader>

        {/* Mounted only while open so the form always starts from the saved values. */}
        <EditSettingsForm settings={settings} mutation={mutation} />
      </DialogPopup>
    </Dialog>
  )
}

function EditSettingsForm({ settings, mutation }: { settings: Settings; mutation: UpdateSettingsMutation }) {
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { residential_name: settings.residentialName },
  })

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
            name="residential_name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel>Nombre del residencial</FieldLabel>
                <Input {...field} autoComplete="off" disabled={mutation.isPending} />
                <FieldDescription>
                  Si lo dejas vacío se mostrará como "{DEFAULT_RESIDENTIAL_LABEL}".
                </FieldDescription>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          {form.formState.errors.root && (
            <Alert variant="error">
              <CircleAlertIcon />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}
        </Form>
      </DialogPanel>

      <DialogFooter>
        <DialogClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
          Cancelar
        </DialogClose>
        <Button type="submit" form={FORM_ID} disabled={mutation.isPending} loading={mutation.isPending}>
          Guardar
        </Button>
      </DialogFooter>
    </>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
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
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Settings } from '@/lib/supabase/settings'
import { CURRENCY_ITEMS, LANGUAGE_ITEMS, type SetupInput, setupSchema } from '@/lib/validations/settings'
import { completeSetup } from '@/server-actions/settings'
import { SETTINGS_QUERY_KEY } from '@/tanstack-queries/settings'

const FORM_ID = 'setup-form'

/**
 * The main admin's first sign-in: what the whole HOA works with. It can't be
 * skipped; once saved, the settings query refetches and the welcome follows.
 */
export function SetupDialog({ settings }: { settings: Settings }) {
  const queryClient = useQueryClient()

  const form = useForm<SetupInput>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      residential_name: settings.residentialName,
      default_language: settings.defaultLanguage,
      currency: settings.currency,
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: SetupInput) => {
      const result = await completeSetup(values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] })
    },
    onError: (error) => {
      form.setError('root', { message: error.message })
    },
  })

  return (
    <Dialog open disablePointerDismissal>
      <DialogPopup showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Configura tu residencial</DialogTitle>
          <DialogDescription>
            Antes de empezar, elige cómo se llama el residencial, su idioma y su moneda.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <Form
            id={FORM_ID}
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
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
                  <FieldLabel>
                    Nombre del residencial <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input {...field} autoComplete="off" disabled={mutation.isPending} />
                  <FieldDescription>Aparece en el menú y en los reportes.</FieldDescription>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="default_language"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched}
                  dirty={fieldState.isDirty}
                >
                  <FieldLabel>
                    Idioma <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    items={LANGUAGE_ITEMS}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                    }}
                    disabled={mutation.isPending}
                  >
                    <SelectTrigger ref={field.ref} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {LANGUAGE_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                  <FieldDescription>
                    El de los reportes y los textos que genera la aplicación.
                  </FieldDescription>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="currency"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched}
                  dirty={fieldState.isDirty}
                >
                  <FieldLabel>
                    Moneda <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    items={CURRENCY_ITEMS}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                    }}
                    disabled={mutation.isPending}
                  >
                    <SelectTrigger ref={field.ref} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {CURRENCY_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                  <FieldDescription>
                    Puedes cambiarla después en "Ajustes"; lo ya registrado conserva su moneda.
                  </FieldDescription>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {form.formState.errors.root && (
              <Alert variant="error">
                <IconAlertCircle />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
              </Alert>
            )}
          </Form>
        </DialogPanel>

        <DialogFooter>
          <Button type="submit" form={FORM_ID} disabled={mutation.isPending} loading={mutation.isPending}>
            Guardar y continuar
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}

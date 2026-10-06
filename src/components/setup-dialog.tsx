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
import { MULTI_LANGUAGE } from '@/lib/config/i18n'
import type { Settings } from '@/lib/supabase/settings'
import { CURRENCY_ITEMS, LANGUAGE_ITEMS, type SetupInput, setupSchema } from '@/lib/validations/settings'
import { m } from '@/paraglide/messages'
import { getLocale, setLocale } from '@/paraglide/runtime'
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
    onSuccess: (_data, values) => {
      // The admin's pick is also their own screen language; switching reloads.
      if (MULTI_LANGUAGE && values.default_language !== getLocale()) {
        void setLocale(values.default_language)
        return
      }
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
          <DialogTitle>{m.settings_setup_title()}</DialogTitle>
          <DialogDescription>
            {MULTI_LANGUAGE ? m.settings_setup_description() : m.settings_setup_description_single_language()}
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
                    {m.settings_residential_name()} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input {...field} autoComplete="off" disabled={mutation.isPending} />
                  <FieldDescription>{m.settings_residential_name_hint()}</FieldDescription>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {/* Single language: the field stays in the form with its default. */}
            {MULTI_LANGUAGE && (
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
                      {m.common_language()} <span className="text-destructive">*</span>
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
                    <FieldDescription>{m.settings_language_hint()}</FieldDescription>
                    <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            )}

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
                    {m.settings_currency()} <span className="text-destructive">*</span>
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
                  <FieldDescription>{m.settings_setup_currency_hint()}</FieldDescription>
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
          <Button type="submit" form={FORM_ID} disabled={mutation.isPending} loading={mutation.isPending}>
            {m.settings_setup_submit()}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}

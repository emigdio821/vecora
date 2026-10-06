import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle, IconAlertTriangle, IconPhoto, IconTrash, IconUpload } from '@tabler/icons-react'
import { useMutation, type UseMutationResult, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useCurrentUser } from '@/components/current-user-provider'
import { RemoveLogoAlertDialog } from '@/components/settings/dialog/remove-logo'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter, DialogPanel } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toastManager } from '@/components/ui/toast'
import { MULTI_LANGUAGE } from '@/lib/config/i18n'
import type { Settings } from '@/lib/supabase/settings'
import {
  CURRENCY_ITEMS,
  defaultResidentialLabel,
  LANGUAGE_ITEMS,
  logoFileSchema,
  type SettingsInput,
  settingsSchema,
} from '@/lib/validations/settings'
import { m } from '@/paraglide/messages'
import { uploadLogo } from '@/server-actions/settings'
import { logoUrlQueryOptions, SETTINGS_QUERY_KEY } from '@/tanstack-queries/settings'

const FORM_ID = 'hoa-settings-form'

/** Owned by the dialog, which can't close while it's pending. */
export type UpdateSettingsMutation = UseMutationResult<void, Error, SettingsInput>

interface HoaSettingsPanelProps {
  settings: Settings
  mutation: UpdateSettingsMutation
}

/**
 * The settings dialog's "Residencial" tab, for president and admin: the HOA's
 * details. The sidebar reads them from the settings query. Mounted with the
 * dialog, so the form always starts from the saved values.
 */
export function HoaSettingsPanel({ settings, mutation }: HoaSettingsPanelProps) {
  const user = useCurrentUser()
  // Language and currency shape the whole HOA's records, so they're admin only.
  const isAdmin = user.roles.includes('admin')
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: isAdmin
      ? {
          residential_name: settings.residentialName,
          // Left out with a single language, so saving never touches it.
          default_language: MULTI_LANGUAGE ? settings.defaultLanguage : undefined,
          currency: settings.currency,
        }
      : { residential_name: settings.residentialName },
  })
  const currency = useWatch({ control: form.control, name: 'currency' })

  return (
    <>
      <DialogPanel className="flex flex-col gap-6">
        <LogoField logoPath={settings.logoPath} />

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
                <FieldLabel>{m.settings_residential_name()}</FieldLabel>
                <Input {...field} autoComplete="off" disabled={mutation.isPending} />
                <FieldDescription>
                  {m.settings_residential_name_empty_hint({ label: defaultResidentialLabel() })}
                </FieldDescription>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          {isAdmin && (
            <>
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
                      <FieldLabel>{m.common_language()}</FieldLabel>
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
                    <FieldLabel>{m.settings_currency()}</FieldLabel>
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
                    <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />

              {currency && currency !== settings.currency && (
                <Alert variant="warning">
                  <IconAlertTriangle />
                  <AlertTitle>{m.settings_currency_change_title({ currency })}</AlertTitle>
                  <AlertDescription>{m.settings_currency_change_description({ currency })}</AlertDescription>
                </Alert>
              )}
            </>
          )}

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
        <DialogClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
          {m.common_action_cancel()}
        </DialogClose>
        <Button type="submit" form={FORM_ID} disabled={mutation.isPending} loading={mutation.isPending}>
          {m.common_action_save()}
        </Button>
      </DialogFooter>
    </>
  )
}

/**
 * Saved as soon as it's picked, apart from Save. The server shrinks it,
 * so the size check here only spares uploading something it would refuse.
 */
function LogoField({ logoPath }: { logoPath: string | null }) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const logoUrl = useQuery(logoUrlQueryOptions(logoPath))
  const [isRemoveOpen, setRemoveOpen] = useState(false)

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const parsed = logoFileSchema.safeParse(file)
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? m.settings_logo_select_image())

      const formData = new FormData()
      formData.set('logo', parsed.data)
      const result = await uploadLogo(formData)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] })
      toastManager.add({ type: 'success', title: m.settings_logo_updated() })
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.common_error(), description: error.message })
    },
  })

  return (
    <Field>
      <FieldLabel>{m.settings_logo()}</FieldLabel>
      <div className="flex items-center gap-4">
        {/* White like the report page, so the preview shows how it will print. */}
        <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border bg-muted p-2">
          {logoUrl.data ? (
            <img
              src={logoUrl.data}
              alt={m.settings_logo_alt()}
              width={64}
              height={64}
              className="size-full object-contain"
            />
          ) : (
            <IconPhoto className="size-6 text-muted-foreground/60" />
          )}
        </div>
        <div className="flex flex-col flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            loading={upload.isPending}
            disabled={upload.isPending}
            onClick={() => {
              inputRef.current?.click()
            }}
          >
            <IconUpload />
            {logoPath ? m.settings_logo_change() : m.settings_logo_upload()}
          </Button>
          {logoPath && (
            <Button
              type="button"
              variant="destructive-outline"
              disabled={upload.isPending}
              onClick={() => {
                setRemoveOpen(true)
              }}
            >
              <IconTrash />
              {m.common_action_remove()}
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            // Reset so picking the same file again still fires a change.
            event.target.value = ''
            if (file) upload.mutate(file)
          }}
        />
      </div>
      <FieldDescription>{m.settings_logo_hint()}</FieldDescription>

      <RemoveLogoAlertDialog open={isRemoveOpen} onOpenChange={setRemoveOpen} />
    </Field>
  )
}

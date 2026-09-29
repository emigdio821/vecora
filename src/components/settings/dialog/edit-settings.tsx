'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, type UseMutationResult, useQuery } from '@tanstack/react-query'
import { CircleAlertIcon, ImageIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { RemoveLogoAlertDialog } from '@/components/settings/dialog/remove-logo'
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
import {
  DEFAULT_RESIDENTIAL_LABEL,
  logoFileSchema,
  type SettingsInput,
  settingsSchema,
} from '@/lib/validations/settings'
import { updateSettings, uploadLogo } from '@/server-actions/settings'
import { logoUrlQueryOptions } from '@/tanstack-queries/settings'

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

/**
 * Saved as soon as it's picked, apart from "Guardar". The server shrinks it,
 * so the size check here only spares uploading something it would refuse.
 */
function LogoField({ logoPath }: { logoPath: string | null }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const logoUrl = useQuery(logoUrlQueryOptions(logoPath))
  const [isRemoveOpen, setRemoveOpen] = useState(false)

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const parsed = logoFileSchema.safeParse(file)
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Selecciona una imagen')

      const formData = new FormData()
      formData.set('logo', parsed.data)
      const result = await uploadLogo(formData)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      router.refresh()
      toastManager.add({ type: 'success', title: 'Logo actualizado' })
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: 'Error', description: error.message })
    },
  })

  return (
    <Field>
      <FieldLabel>Logo</FieldLabel>
      <div className="flex items-center gap-4">
        {/* White like the report page, so the preview shows how it will print. */}
        <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border bg-muted p-2">
          {logoUrl.data ? (
            // Already a small PNG behind an expiring link: nothing for the optimizer to do.
            <Image
              src={logoUrl.data}
              alt="Logo del residencial"
              width={64}
              height={64}
              unoptimized
              className="size-full object-contain"
            />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground/60" />
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
            <UploadIcon />
            {logoPath ? 'Cambiar logo' : 'Subir logo'}
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
              <Trash2Icon />
              Quitar
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
      <FieldDescription>
        Aparece en los reportes. Es recomendable usar el formato PNG con fondo transparente, con un máximo de
        2 MB.
      </FieldDescription>

      <RemoveLogoAlertDialog open={isRemoveOpen} onOpenChange={setRemoveOpen} />
    </Field>
  )
}

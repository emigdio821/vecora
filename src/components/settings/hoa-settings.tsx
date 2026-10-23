import { zodResolver } from '@hookform/resolvers/zod'
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconBuildingCommunity,
  IconPhoto,
  IconPhotoUp,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useCurrentUser } from '@/components/current-user-provider'
import { SettingsCard, SettingsGrid } from '@/components/settings/settings-card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toastManager } from '@/components/ui/toast'
import { MULTI_LANGUAGE } from '@/lib/config/i18n'
import type { Settings } from '@/lib/db/settings'
import { cn } from '@/lib/utils'
import {
  CURRENCY_ITEMS,
  defaultResidentialLabel,
  LANGUAGE_ITEMS,
  logoFileSchema,
  type SettingsInput,
  settingsSchema,
} from '@/lib/validations/settings'
import { m } from '@/paraglide/messages'
import { removeLogo, updateSettings, uploadLogo } from '@/server-actions/settings'
import { logoUrlQueryOptions, SETTINGS_QUERY_KEY } from '@/tanstack-queries/settings'

const FORM_ID = 'hoa-settings-form'

/** A logo picked but not saved yet; `preview` is the file as a data URL. */
interface PendingLogo {
  file: File
  preview: string
}

interface HoaSettingsPanelProps {
  settings: Settings
}

/**
 * The settings page's "Residencial" tab, for president and admin: the HOA's
 * logo and details, each card saved on its own. The sidebar reads them from
 * the settings query.
 */
export function HoaSettingsPanel({ settings }: HoaSettingsPanelProps) {
  return (
    <SettingsGrid>
      <DetailsCard settings={settings} />
      <LogoCard
        logoPath={settings.logoPath}
        residentialName={settings.residentialName || defaultResidentialLabel()}
      />
    </SettingsGrid>
  )
}

function DetailsCard({ settings }: HoaSettingsPanelProps) {
  const user = useCurrentUser()
  const queryClient = useQueryClient()
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

  const mutation = useMutation({
    mutationFn: async (values: SettingsInput) => {
      const result = await updateSettings(values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: async (_, values) => {
      await queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] })
      form.reset(values)
      toastManager.add({ type: 'success', title: m.settings_saved() })
    },
    onError: (error) => {
      form.setError('root', { message: error.message })
    },
  })

  const isDisabled = !form.formState.isDirty || mutation.isPending

  return (
    <SettingsCard
      title={m.settings_details_title()}
      description={m.settings_hoa_description()}
      icon={IconBuildingCommunity}
      footer={
        <>
          <Button
            variant="ghost"
            disabled={isDisabled}
            onClick={() => {
              form.reset()
            }}
          >
            {m.settings_discard_changes()}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isDisabled} loading={mutation.isPending}>
            {m.common_action_save()}
          </Button>
        </>
      }
    >
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
    </SettingsCard>
  )
}

/**
 * "84 KB", "1.9 MB": enough to tell a file is under the 2 MB limit. Rounded
 * down, so a file just under the limit never reads "2.0 MB".
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.floor(bytes / 1024))} KB`
  return `${(Math.floor((bytes / (1024 * 1024)) * 10) / 10).toFixed(1)} MB`
}

/** "logo final (2).png" → ["logo final (2)", ".png"], so a long name can lose its middle, not its extension. */
function splitExtension(name: string): [string, string] {
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return [name, '']
  return [name.slice(0, dot), name.slice(dot)]
}

interface LogoCardProps {
  logoPath: string | null
  /** The saved one, for the report header preview. */
  residentialName: string
}

/**
 * A pick or a removal waits for Save, so "Descartar cambios" undoes it. The
 * server shrinks the image, so the size check here only spares uploading
 * something it would refuse.
 */
function LogoCard({ logoPath, residentialName }: LogoCardProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const logoUrl = useQuery(logoUrlQueryOptions(logoPath))
  // `null` removes the saved logo; `undefined` while the saved logo stands.
  const [logo, setLogo] = useState<PendingLogo | null>()
  const [error, setError] = useState<string>()
  const [isDragging, setDragging] = useState(false)
  // The last image that finished loading, so the skeleton covers the download too.
  const [loadedUrl, setLoadedUrl] = useState<string>()

  const pickFile = (file: File) => {
    const parsed = logoFileSchema.safeParse(file)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? m.settings_logo_select_image())
      return
    }

    setError(undefined)
    const reader = new FileReader()
    reader.onload = () => {
      // readAsDataURL always yields a string; the check narrows the type.
      if (typeof reader.result === 'string') {
        setLogo({ file: parsed.data, preview: reader.result })
      }
    }
    reader.readAsDataURL(parsed.data)
  }

  const mutation = useMutation({
    mutationFn: async (pending: PendingLogo | null) => {
      if (pending) {
        const formData = new FormData()
        formData.set('logo', pending.file)
        const result = await uploadLogo(formData)
        if (result.error !== undefined) throw new Error(result.error)
      } else {
        const result = await removeLogo()
        if (result.error !== undefined) throw new Error(result.error)
      }
    },
    onSuccess: async () => {
      // Waits for the saved settings, so the preview doesn't flash the old logo.
      await queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] })
      setLogo(undefined)
      toastManager.add({ type: 'success', title: m.settings_saved() })
    },
  })

  const previewUrl = logo === undefined ? logoUrl.data : logo?.preview
  const hasLogo = logo === undefined ? !!logoPath : logo !== null
  const isDisabled = logo === undefined || mutation.isPending

  // Still waiting for the saved logo's link, or for the image itself. A failed
  // link ends it: the empty drop zone is better than a skeleton forever.
  let isLoadingImage = false
  if (previewUrl) {
    isLoadingImage = loadedUrl !== previewUrl
  } else if (logo === undefined && logoPath) {
    isLoadingImage = !logoUrl.isError
  }

  const markLoaded = () => {
    setLoadedUrl(previewUrl)
  }

  return (
    <SettingsCard
      title={m.settings_logo()}
      description={m.settings_logo_description()}
      icon={IconPhoto}
      footer={
        <>
          <Button
            variant="ghost"
            disabled={isDisabled}
            onClick={() => {
              setError(undefined)
              mutation.reset()
              setLogo(undefined)
            }}
          >
            {m.settings_discard_changes()}
          </Button>
          <Button
            disabled={isDisabled}
            loading={mutation.isPending}
            onClick={() => {
              if (logo !== undefined) mutation.mutate(logo)
            }}
          >
            {m.common_action_save()}
          </Button>
        </>
      }
    >
      <Field invalid={!!error}>
        {/* Click or drop an image. With a logo it sits on white, the way it prints. */}
        <button
          type="button"
          aria-label={hasLogo ? m.settings_logo_change() : m.settings_logo_upload()}
          disabled={mutation.isPending}
          data-dragging={isDragging || undefined}
          className={cn(
            // Children ignore the pointer, so dragging over them doesn't fire dragleave.
            'flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center transition-[background-color,border-color,scale] duration-150 ease-out outline-none *:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring active:not-disabled:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-64',
            previewUrl && !isLoadingImage ? 'bg-white' : 'bg-muted/40 hover:bg-muted/72',
            'data-dragging:border-primary data-dragging:bg-primary/4',
          )}
          onClick={() => {
            inputRef.current?.click()
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => {
            setDragging(false)
          }}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            const file = event.dataTransfer.files[0]
            if (file) pickFile(file)
          }}
        >
          {/* Hidden, not left out, while loading: it has to be in the page to download.
              Meanwhile the zone stays empty; the report preview shows the skeleton. */}
          {previewUrl && (
            <img
              src={previewUrl}
              alt={m.settings_logo_alt()}
              className={cn(
                // Fades in once shown: @starting-style runs when `hidden` comes off.
                'max-h-full max-w-[80%] object-contain transition-opacity duration-200 ease-out starting:opacity-0',
                isLoadingImage && 'hidden',
              )}
              onLoad={markLoaded}
              onError={markLoaded}
            />
          )}
          {!previewUrl && !isLoadingImage && (
            <>
              <span className="flex size-10 items-center justify-center rounded-full border bg-background shadow-xs/5">
                <IconPhotoUp className="size-5 text-muted-foreground" />
              </span>
              <span className="text-sm font-medium">
                {isDragging ? m.settings_logo_drop_active() : m.settings_logo_drop()}
              </span>
              <span className="text-xs text-muted-foreground">{m.settings_logo_drop_hint()}</span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            // Reset so picking the same file again still fires a change.
            event.target.value = ''
            if (file) pickFile(file)
          }}
        />
        <FieldError match={!!error}>{error}</FieldError>
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={mutation.isPending}
          onClick={() => {
            inputRef.current?.click()
          }}
        >
          <IconUpload />
          {hasLogo ? m.settings_logo_change() : m.settings_logo_upload()}
        </Button>
        {hasLogo && (
          <Button
            type="button"
            variant="destructive-outline"
            size="sm"
            disabled={mutation.isPending}
            onClick={() => {
              setError(undefined)
              // Without a saved logo there's nothing to remove, only the pick to drop.
              setLogo(logoPath ? null : undefined)
            }}
          >
            <IconTrash />
            {m.common_action_remove()}
          </Button>
        )}
        {logo && (
          <span
            className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground transition-opacity duration-150 ease-out starting:opacity-0"
            title={logo.file.name}
          >
            <Badge variant="warning" className="shrink-0">
              {m.settings_logo_unsaved()}
            </Badge>
            {/* Names differ at the end ("final (2)"): the middle gives way, the extension stays. */}
            <span className="flex min-w-0">
              <span className="truncate">{splitExtension(logo.file.name)[0]}</span>
              <span className="shrink-0 whitespace-nowrap">
                {splitExtension(logo.file.name)[1]} · {formatFileSize(logo.file.size)}
              </span>
            </span>
          </span>
        )}
        {logo === null && (
          <Badge variant="warning" className="transition-opacity duration-150 ease-out starting:opacity-0">
            {m.settings_logo_will_be_removed()}
          </Badge>
        )}
      </div>

      {/* The PDF's page header (reports/pdf/layout.tsx), at the same proportions. */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">{m.settings_logo_report_preview()}</span>
        <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3 text-neutral-900">
          {/* A light gray in both themes: the header is always white, like the page. */}
          {isLoadingImage && (
            <Skeleton className="size-8 shrink-0 [--color-muted:var(--color-neutral-200)]" />
          )}
          {previewUrl && (
            <img
              src={previewUrl}
              alt=""
              className={cn(
                // 40%: on a narrow card a wide logo shrinks before the name has to break mid-word.
                'h-8 max-w-[min(7.5rem,40%)] shrink-0 object-contain object-left transition-opacity duration-200 ease-out starting:opacity-0',
                isLoadingImage && 'hidden',
              )}
            />
          )}
          {/* The PDF wraps a long name, so the preview does too, up to two lines. */}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold wrap-break-word" title={residentialName}>
              {residentialName}
            </p>
            <p className="truncate text-xs text-neutral-500">{m.common_section_financial_report()}</p>
          </div>
        </div>
      </div>

      {mutation.error && (
        <Alert variant="error">
          <IconAlertCircle />
          <AlertTitle>{m.common_error()}</AlertTitle>
          <AlertDescription>{mutation.error.message}</AlertDescription>
        </Alert>
      )}
    </SettingsCard>
  )
}

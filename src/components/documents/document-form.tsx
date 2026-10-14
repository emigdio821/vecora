import { zodResolver } from '@hookform/resolvers/zod'
import { IconDownload, IconEye, IconFilePlus, IconSelector, IconSparkles } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { addYears, format, parseISO, subYears } from 'date-fns'
import { useEffect, useId, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { toastManager } from '@/components/ui/toast'
import { useToday } from '@/hooks/use-today'
import { formatDay, ISO_DAY } from '@/lib/utils'
import {
  type DocumentInput,
  documentContentSchema,
  documentSchema,
  EMPTY_DOCUMENT_CONTENT,
  hasContent,
} from '@/lib/validations/documents'
import { m } from '@/paraglide/messages'
import { AiPromptDialog } from './dialog/ai-prompt'
import { RichTextEditor } from './rich-text-editor'

const DRAFT_KEY = 'vecora-document-draft'
const DRAFT_SAVE_DELAY = 400

/** Looser than documentSchema: a draft can be half written. */
const draftSchema = z.object({
  header_title: z.string(),
  date: z.iso.date(),
  title: z.string(),
  content: documentContentSchema,
})

/** The draft saved on this device, if any; a broken or outdated one is ignored. */
function loadDraft(): DocumentInput | null {
  const stored = localStorage.getItem(DRAFT_KEY)
  if (!stored) {
    return null
  }
  try {
    const parsed = draftSchema.safeParse(JSON.parse(stored))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}

/** The form loads it when it mounts (a template, before remounting it). */
export function saveDraft(document: DocumentInput) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(document))
}

/** Something written on this device that replacing the draft would lose. */
export function hasWrittenDraft(): boolean {
  const draft = loadDraft()
  if (!draft) {
    return false
  }
  return draft.title.trim() !== '' || hasContent(draft.content)
}

function blankDocument(today: Date): DocumentInput {
  return {
    header_title: m.documents_header_title_default(),
    date: format(today, ISO_DAY),
    title: '',
    content: EMPTY_DOCUMENT_CONTENT,
  }
}

/** The route answers with the PDF; failures come back as JSON with a message. */
async function generateDocument(document: DocumentInput): Promise<{ blob: Blob; fileName: string }> {
  const response = await fetch('/reports/document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(document),
  })
  // Signed out, the proxy redirects to the login page, which is a 200 in HTML.
  const isPdf = response.headers.get('Content-Type') === 'application/pdf'
  if (!response.ok || !isPdf) {
    const body: { error?: string } | null = await response.json().catch(() => null)
    throw new Error(body?.error ?? m.documents_generate_failed())
  }

  const disposition = response.headers.get('Content-Disposition') ?? ''
  const fileName = /filename="(.+)"/.exec(disposition)?.[1] ?? m.documents_default_file_name()
  return { blob: await response.blob(), fileName }
}

async function downloadDocument(document: DocumentInput) {
  const { blob, fileName } = await generateDocument(document)
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  // Give the browser a moment to start the download before freeing the file.
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

async function previewDocument({ document, tab }: { document: DocumentInput; tab: Window }) {
  const { blob } = await generateDocument(document)
  const url = URL.createObjectURL(blob)
  tab.location.href = url
  // The tab's viewer has read it by then; a reload there would need it again, though.
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 60_000)
}

interface DocumentFormProps {
  onStartOver: () => void
}

/**
 * Header, date, title and rich text, saved on this device as it's typed. Browser
 * only (localStorage, the editor): the page renders it inside ClientOnly.
 */
export function DocumentForm({ onStartOver }: DocumentFormProps) {
  const today = useToday()
  const dateTriggerId = useId()
  const contentLabelId = useId()
  const [isDateOpen, setDateOpen] = useState(false)
  const [isAiPromptOpen, setAiPromptOpen] = useState(false)
  const [initialValues] = useState(() => loadDraft() ?? blankDocument(today))
  // Phones without a built-in PDF viewer (Android) would just download it: there, only Download.
  const canPreview = navigator.pdfViewerEnabled

  const form = useForm<DocumentInput>({
    resolver: zodResolver(documentSchema),
    defaultValues: initialValues,
  })

  // Saves every change, so a reload or a closed tab doesn't lose the document. A moment
  // after the typing stops: with images the draft is megabytes, too much for every key.
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined
    let isTooBig = false
    const unsubscribe = form.subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(values))
            isTooBig = false
          } catch {
            // Over the browser's quota (about 5 MB): said once, until it fits again.
            if (!isTooBig) {
              toastManager.add({ type: 'warning', title: m.documents_draft_too_big() })
            }
            isTooBig = true
          }
        }, DRAFT_SAVE_DELAY)
      },
    })
    return () => {
      clearTimeout(timeout)
      unsubscribe()
    }
  }, [form])

  const downloadMutation = useMutation({
    mutationFn: downloadDocument,
    onSuccess: () => {
      toastManager.add({ type: 'success', title: m.documents_downloaded() })
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.common_error(), description: error.message })
    },
  })

  const previewMutation = useMutation({
    mutationFn: previewDocument,
    onError: (error, variables) => {
      variables.tab.close()
      toastManager.add({ type: 'error', title: m.common_error(), description: error.message })
    },
  })

  function handlePreview() {
    // Checked here, not through handleSubmit: that waits, and browsers block tabs opened after waiting.
    const parsed = documentSchema.safeParse(form.getValues())
    if (!parsed.success) {
      // Shows the errors and focuses the first one, like a submit.
      void form.trigger(undefined, { shouldFocus: true })
      return
    }

    const tab = window.open('', '_blank')
    if (!tab) {
      // The browser blocked the tab anyway: hand over the file instead.
      downloadMutation.mutate(parsed.data)
      return
    }
    tab.document.title = m.documents_preview()
    tab.document.body.textContent = m.documents_preview_generating()
    previewMutation.mutate({ document: parsed.data, tab })
  }

  return (
    <>
      <Form
        className="flex flex-col gap-4 md:min-h-0 md:flex-1"
        onSubmit={form.handleSubmit((values) => {
          downloadMutation.mutate(values)
        })}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="header_title"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel>
                  {m.documents_field_header_title()} <span className="text-destructive">*</span>
                </FieldLabel>
                <Input {...field} autoComplete="off" />
                <FieldDescription>{m.documents_header_title_description()}</FieldDescription>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name="date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel id={`${dateTriggerId}-label`} htmlFor={dateTriggerId}>
                  {m.common_field_date()} <span className="text-destructive">*</span>
                </FieldLabel>
                <Popover open={isDateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger
                    id={dateTriggerId}
                    aria-labelledby={`${dateTriggerId}-label ${dateTriggerId}-value`}
                    ref={field.ref}
                    render={
                      <Button
                        variant="outline"
                        aria-invalid={fieldState.invalid}
                        className="w-full justify-between pr-2"
                      >
                        <span id={`${dateTriggerId}-value`} className="truncate font-normal">
                          {formatDay(field.value)}
                        </span>
                        <IconSelector className="pointer-events-none size-4" />
                      </Button>
                    }
                  />
                  <PopoverPopup className="w-auto p-1">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
                      startMonth={subYears(today, 2)}
                      endMonth={addYears(today, 1)}
                      selected={parseISO(field.value)}
                      defaultMonth={parseISO(field.value)}
                      onSelect={(date) => {
                        field.onChange(format(date ?? new Date(), ISO_DAY))
                        setDateOpen(false)
                      }}
                    />
                  </PopoverPopup>
                </Popover>
                <FieldDescription>{m.documents_date_description()}</FieldDescription>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
        </div>

        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              name={field.name}
              invalid={fieldState.invalid}
              touched={fieldState.isTouched}
              dirty={fieldState.isDirty}
            >
              <FieldLabel>
                {m.documents_field_title()} <span className="text-destructive">*</span>
              </FieldLabel>
              <Input {...field} autoComplete="off" />
              <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />

        <Controller
          name="content"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              name={field.name}
              invalid={fieldState.invalid}
              touched={fieldState.isTouched}
              dirty={fieldState.isDirty}
              className="md:min-h-0 md:flex-1"
            >
              <div className="flex w-full items-center justify-between gap-2">
                {/* Not a <label>: the editor isn't a form control a label can point at. */}
                <FieldLabel id={contentLabelId} nativeLabel={false} render={<span />}>
                  {m.documents_field_content()} <span className="text-destructive">*</span>
                </FieldLabel>
                {/* Negative margins: the button doesn't make the label's line taller. */}
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="-my-1.25 sm:-my-1"
                  onClick={() => {
                    setAiPromptOpen(true)
                  }}
                >
                  <IconSparkles />
                  {m.documents_ai_write()}
                </Button>
              </div>
              <RichTextEditor
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={fieldState.invalid}
                labelId={contentLabelId}
                className="md:max-h-none md:min-h-0 md:flex-1"
              />
              <FieldDescription>{m.documents_draft_hint()}</FieldDescription>
              <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onStartOver()
            }}
          >
            <IconFilePlus className="size-4" />
            {m.documents_start_over()}
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {canPreview && (
              <Button
                type="button"
                variant="outline"
                loading={previewMutation.isPending}
                onClick={() => {
                  handlePreview()
                }}
              >
                <IconEye className="size-4" />
                {m.documents_preview()}
              </Button>
            )}
            <Button type="submit" loading={downloadMutation.isPending}>
              <IconDownload className="size-4" />
              {m.reports_download_pdf()}
            </Button>
          </div>
        </div>
      </Form>

      <AiPromptDialog open={isAiPromptOpen} onOpenChange={setAiPromptOpen} />
    </>
  )
}

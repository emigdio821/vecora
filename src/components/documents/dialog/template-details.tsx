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
import { Input } from '@/components/ui/input'
import { toastManager } from '@/components/ui/toast'
import {
  type DocumentTemplateInput,
  TEMPLATE_NAME_MAX,
  type TemplateDetailsInput,
  templateDetailsSchema,
} from '@/lib/validations/documents'
import { m } from '@/paraglide/messages'
import { saveDocumentTemplate, updateDocumentTemplate } from '@/server-actions/documents'
import { DOCUMENTS_QUERY_KEY, type SavedTemplateQueryData } from '@/tanstack-queries/documents'

const FORM_ID = 'template-details-form'

type DetailsMutation = UseMutationResult<void, Error, TemplateDetailsInput>

interface TemplateDetailsDialogProps extends React.ComponentProps<typeof Dialog> {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/*
 * These dialogs stay mounted, with null until there's something to show: one mounted
 * already open skips its opening animation. The form only renders with a value, so the
 * mutations never run without one.
 */

interface SaveTemplateDialogProps extends TemplateDetailsDialogProps {
  /** The document as it was when the button was pressed; null until then. */
  document: Omit<DocumentTemplateInput, 'details'> | null
}

/** Saves the document in the editor as a template for the whole board. */
export function SaveTemplateDialog({ document, ...props }: SaveTemplateDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (details: TemplateDetailsInput) => {
      if (document === null) return
      const result = await saveDocumentTemplate({ details, ...document })
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, details) => {
      void queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY, 'templates'] })
      toastManager.add({
        type: 'success',
        title: m.documents_template_saved_title(),
        description: m.documents_template_saved_description({ name: details.name }),
      })
      props.onOpenChange(false)
    },
  })

  return (
    <TemplateDetailsDialog
      {...props}
      mutation={mutation}
      title={m.documents_template_save()}
      description={m.documents_template_save_description()}
      // The document's title is usually a good start; the menu has less room for it.
      defaultValues={
        document === null
          ? null
          : { name: document.title.slice(0, TEMPLATE_NAME_MAX).trim(), description: '' }
      }
    />
  )
}

interface EditTemplateDialogProps extends TemplateDetailsDialogProps {
  template: SavedTemplateQueryData | null
}

/** Renames a saved template or changes its description; its document stays as it was. */
export function EditTemplateDialog({ template, ...props }: EditTemplateDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (details: TemplateDetailsInput) => {
      if (template === null) return
      const result = await updateDocumentTemplate(template.id, details)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, details) => {
      void queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY, 'templates'] })
      toastManager.add({ type: 'success', title: m.documents_template_updated(), description: details.name })
      props.onOpenChange(false)
    },
  })

  return (
    <TemplateDetailsDialog
      {...props}
      mutation={mutation}
      title={m.documents_template_edit()}
      description={m.documents_template_edit_description()}
      defaultValues={template === null ? null : { name: template.name, description: template.description }}
    />
  )
}

interface TemplateDetailsDialogBaseProps extends TemplateDetailsDialogProps {
  mutation: DetailsMutation
  title: string
  description: string
  defaultValues: TemplateDetailsInput | null
}

function TemplateDetailsDialog({
  mutation,
  title,
  description,
  defaultValues,
  open,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: TemplateDetailsDialogBaseProps) {
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Mounted only while open, so each time starts from the values it's given. */}
        {defaultValues && <TemplateDetailsForm mutation={mutation} defaultValues={defaultValues} />}
      </DialogPopup>
    </Dialog>
  )
}

interface TemplateDetailsFormProps {
  mutation: DetailsMutation
  defaultValues: TemplateDetailsInput
}

function TemplateDetailsForm({ mutation, defaultValues }: TemplateDetailsFormProps) {
  const form = useForm<TemplateDetailsInput>({
    resolver: zodResolver(templateDetailsSchema),
    defaultValues,
  })

  // Still busy after saving, until the dialog has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

  return (
    <>
      <DialogPanel>
        <Form
          id={FORM_ID}
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) => {
            mutation.mutate(values, {
              onError: (error) => {
                form.setError('root', { message: error.message })
              },
            })
          })}
        >
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel>
                  {m.common_field_name()} <span className="text-destructive">*</span>
                </FieldLabel>
                <Input {...field} autoComplete="off" disabled={isBusy} />
                <FieldDescription>{m.documents_template_name_hint()}</FieldDescription>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel>{m.documents_template_field_description()}</FieldLabel>
                <Input {...field} autoComplete="off" disabled={isBusy} />
                <FieldDescription>{m.documents_template_description_hint()}</FieldDescription>
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
        <Button type="submit" form={FORM_ID} disabled={isBusy} loading={isBusy}>
          {m.common_action_save()}
        </Button>
      </DialogFooter>
    </>
  )
}

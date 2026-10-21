import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogClose,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogPopup,
  type ResponsiveAlertDialogProps,
  ResponsiveAlertDialogTitle,
} from '@/components/shared/responsive-alert-dialog'
import { Button } from '@/components/ui/button'
import { toastManager } from '@/components/ui/toast'
import { m } from '@/paraglide/messages'
import { deleteDocumentTemplate } from '@/server-actions/documents'
import {
  DOCUMENTS_QUERY_KEY,
  type SavedTemplateQueryData,
  templateDocumentQueryOptions,
} from '@/tanstack-queries/documents'

interface DeleteTemplateAlertDialogProps extends Omit<ResponsiveAlertDialogProps, 'children'> {
  /** Null until one is picked: mounted already open, the dialog would skip its opening animation. */
  template: SavedTemplateQueryData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Removes a saved template for the whole board; drafts started from it keep their text. */
export function DeleteTemplateAlertDialog({
  template,
  open,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: DeleteTemplateAlertDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (target: SavedTemplateQueryData) => {
      const result = await deleteDocumentTemplate(target.id)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, target) => {
      void queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY, 'templates'] })
      queryClient.removeQueries({ queryKey: templateDocumentQueryOptions(target.id).queryKey })
      toastManager.add({ type: 'success', title: m.documents_template_deleted(), description: target.name })
      onOpenChange(false)
    },
    onError: (error) => {
      toastManager.add({
        type: 'error',
        title: m.documents_template_delete_failed(),
        description: error.message,
      })
    },
  })

  const handleOpenChange = (nextOpen: boolean, eventDetails: { cancel: () => void }) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  // Still busy after deleting, until the dialog has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

  return (
    <ResponsiveAlertDialog
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(isOpen) => {
        // Clears `success`, which keeps the buttons busy while the dialog closes.
        if (!isOpen) {
          mutation.reset()
        }
        onOpenChangeComplete?.(isOpen)
      }}
      {...props}
    >
      <ResponsiveAlertDialogPopup>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle>
            {template && m.documents_template_delete_title({ name: template.name })}
          </ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            {m.documents_template_delete_description()}
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>

        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogClose render={<Button variant="ghost" />} disabled={isBusy}>
            {m.common_action_cancel()}
          </ResponsiveAlertDialogClose>
          {template && (
            <Button
              variant="destructive"
              loading={isBusy}
              onClick={() => {
                mutation.mutate(template)
              }}
            >
              {m.common_action_delete()}
            </Button>
          )}
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogPopup>
    </ResponsiveAlertDialog>
  )
}

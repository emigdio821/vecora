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
import { m } from '@/paraglide/messages'

interface StartOverAlertDialogProps extends Omit<ResponsiveAlertDialogProps, 'children'> {
  /** Starting from a template instead of a blank document. */
  templateName: string | null
  onConfirm: () => void
}

/** Discards the draft on this device; there's no undo since it's only stored here. */
export function StartOverAlertDialog({ templateName, onConfirm, ...props }: StartOverAlertDialogProps) {
  let title = m.documents_start_over_title()
  let confirmLabel = m.documents_start_over()
  if (templateName !== null) {
    title = m.documents_template_confirm_title({ name: templateName })
    confirmLabel = m.documents_template_use()
  }

  return (
    <ResponsiveAlertDialog {...props}>
      <ResponsiveAlertDialogPopup>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle>{title}</ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            {m.documents_start_over_description()}
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>
        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogClose render={<Button variant="ghost" />}>
            {m.common_action_cancel()}
          </ResponsiveAlertDialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
            }}
          >
            {confirmLabel}
          </Button>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogPopup>
    </ResponsiveAlertDialog>
  )
}

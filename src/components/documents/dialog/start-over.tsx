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
  onConfirm: () => void
}

/** Discards the draft on this device; there's no undo since it's only stored here. */
export function StartOverAlertDialog({ onConfirm, ...props }: StartOverAlertDialogProps) {
  return (
    <ResponsiveAlertDialog {...props}>
      <ResponsiveAlertDialogPopup>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle>{m.documents_start_over_title()}</ResponsiveAlertDialogTitle>
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
            {m.documents_start_over()}
          </Button>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogPopup>
    </ResponsiveAlertDialog>
  )
}

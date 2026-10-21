import { IconPencil, IconTrash } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Muted } from '@/components/shared/details'
import { Button } from '@/components/ui/button'
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
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDay } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import { type SavedTemplateQueryData, savedTemplatesQueryOptions } from '@/tanstack-queries/documents'
import { DeleteTemplateAlertDialog } from './delete-template'
import { EditTemplateDialog } from './template-details'

export interface TemplateViewer {
  id: string
  isAdmin: boolean
}

interface ManageTemplatesDialogProps extends React.ComponentProps<typeof Dialog> {
  viewer: TemplateViewer
}

/** The board's saved templates, with editing and deleting for whoever saved each one (or an admin). */
export function ManageTemplatesDialog({ viewer, ...props }: ManageTemplatesDialogProps) {
  const { data: templates = [] } = useQuery(savedTemplatesQueryOptions)
  // Kept apart from the open flags, so a deleted template stays in its dialog while it closes.
  const [editing, setEditing] = useState<SavedTemplateQueryData | null>(null)
  const [isEditOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState<SavedTemplateQueryData | null>(null)
  const [isDeleteOpen, setDeleteOpen] = useState(false)

  return (
    <Dialog {...props}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{m.documents_templates_saved()}</DialogTitle>
          <DialogDescription>{m.documents_templates_manage_description()}</DialogDescription>
        </DialogHeader>

        <DialogPanel>
          {/* The last one can be deleted from here. */}
          {templates.length === 0 && <Muted>{m.documents_templates_none()}</Muted>}
          <ul className="grid gap-4">
            {templates.map((template) => {
              const canManage = viewer.isAdmin || template.created_by === viewer.id
              return (
                <li key={template.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="grid min-w-0 gap-0.5">
                    <span className="font-medium wrap-anywhere">{template.name}</span>
                    {template.description && (
                      <span className="wrap-anywhere text-muted-foreground">{template.description}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{savedLine(template)}</span>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 items-center gap-1">
                      <IconAction
                        label={m.documents_template_edit_label({ name: template.name })}
                        variant="outline"
                        onClick={() => {
                          setEditing(template)
                          setEditOpen(true)
                        }}
                      >
                        <IconPencil />
                      </IconAction>
                      <IconAction
                        label={m.documents_template_delete_label({ name: template.name })}
                        variant="destructive-outline"
                        onClick={() => {
                          setDeleting(template)
                          setDeleteOpen(true)
                        }}
                      >
                        <IconTrash />
                      </IconAction>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </DialogPanel>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>{m.common_action_close()}</DialogClose>
        </DialogFooter>

        {/* Rendered inside the popup so Base UI treats them as nested dialogs. */}
        <EditTemplateDialog template={editing} open={isEditOpen} onOpenChange={setEditOpen} />
        <DeleteTemplateAlertDialog template={deleting} open={isDeleteOpen} onOpenChange={setDeleteOpen} />
      </DialogPopup>
    </Dialog>
  )
}

/** "Guardada por Ana el 21 Oct 2026"; without the name once that account is gone. */
function savedLine(template: SavedTemplateQueryData): string {
  const date = formatDay(template.created_at)
  if (template.author) {
    return m.documents_template_saved_by({ name: template.author.full_name, date })
  }
  return m.documents_template_saved_on({ date })
}

interface IconActionProps {
  label: string
  variant: 'outline' | 'destructive-outline'
  onClick: () => void
  children: React.ReactNode
}

function IconAction({ label, variant, onClick, children }: IconActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        closeOnClick={false}
        render={
          <Button
            size="icon-sm"
            variant={variant}
            aria-label={label}
            onClick={() => {
              onClick()
            }}
          >
            {children}
          </Button>
        }
      />
      <TooltipPopup>{label}</TooltipPopup>
    </Tooltip>
  )
}

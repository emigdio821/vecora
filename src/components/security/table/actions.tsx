import { IconDots } from '@tabler/icons-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'
import type { SecurityRequestQueryData } from '@/tanstack-queries/security'
import { DeleteRequestAlertDialog } from '../dialog/delete-request'
import { RejectRequestDialog } from '../dialog/reject-request'
import { ReopenRequestAlertDialog } from '../dialog/reopen-request'
import { EditRequestDrawer } from '../drawer/edit-request'
import { PayRequestDrawer } from '../drawer/pay-request'
import type { SecurityViewer } from './columns'

interface ActionsProps {
  request: SecurityRequestQueryData
  viewer: SecurityViewer
}

/** Pending rows are resolved or edited, rejected ones can be reopened, paid ones are history. */
export function RequestsTableActions({ request, viewer }: ActionsProps) {
  const [isEditOpen, setEditOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const [isPayOpen, setPayOpen] = useState(false)
  const [isRejectOpen, setRejectOpen] = useState(false)
  const [isReopenOpen, setReopenOpen] = useState(false)

  const isPending = request.status === 'pending'
  const canResolve = isPending && viewer.canResolve
  const canEdit = isPending && viewer.canRequest
  const canReopen = request.status === 'rejected' && viewer.canResolve

  if (!canResolve && !canEdit && !canReopen) return null

  return (
    <>
      {canEdit && (
        <>
          <EditRequestDrawer request={request} open={isEditOpen} onOpenChange={setEditOpen} />
          <DeleteRequestAlertDialog request={request} open={isDeleteOpen} onOpenChange={setDeleteOpen} />
        </>
      )}
      {canResolve && (
        <>
          <PayRequestDrawer request={request} open={isPayOpen} onOpenChange={setPayOpen} />
          <RejectRequestDialog request={request} open={isRejectOpen} onOpenChange={setRejectOpen} />
        </>
      )}
      {canReopen && (
        <ReopenRequestAlertDialog request={request} open={isReopenOpen} onOpenChange={setReopenOpen} />
      )}

      <Menu>
        <MenuTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className="ms-auto flex"
              aria-label={`Acciones de ${request.title}`}
            >
              <IconDots className="size-4" />
            </Button>
          }
        />
        <MenuPopup align="end" className="max-w-56">
          <MenuGroup>
            <MenuGroupLabel className="my-1.5 py-0">{request.title}</MenuGroupLabel>

            {canResolve && (
              <>
                <MenuItem
                  onClick={() => {
                    setPayOpen(true)
                  }}
                >
                  Registrar pago
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setRejectOpen(true)
                  }}
                >
                  Rechazar
                </MenuItem>
              </>
            )}

            {canReopen && (
              <MenuItem
                onClick={() => {
                  setReopenOpen(true)
                }}
              >
                Reabrir
              </MenuItem>
            )}

            {canResolve && canEdit && <MenuSeparator />}

            {canEdit && (
              <>
                <MenuItem
                  onClick={() => {
                    setEditOpen(true)
                  }}
                >
                  Editar
                </MenuItem>
                <MenuItem
                  variant="destructive"
                  onClick={() => {
                    setDeleteOpen(true)
                  }}
                >
                  Eliminar
                </MenuItem>
              </>
            )}
          </MenuGroup>
        </MenuPopup>
      </Menu>
    </>
  )
}

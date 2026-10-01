import { EllipsisIcon } from 'lucide-react'
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
import type { MaintenanceRequestQueryData } from '@/tanstack-queries/maintenance'
import { DeleteRequestAlertDialog } from '../dialog/delete-request'
import { RejectRequestDialog } from '../dialog/reject-request'
import { EditRequestDrawer } from '../drawer/edit-request'
import { PayRequestDrawer } from '../drawer/pay-request'
import type { MaintenanceViewer } from './columns'

interface ActionsProps {
  request: MaintenanceRequestQueryData
  viewer: MaintenanceViewer
}

/** Only pending rows have actions; paid and rejected ones are history. */
export function RequestsTableActions({ request, viewer }: ActionsProps) {
  const [isEditOpen, setEditOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const [isPayOpen, setPayOpen] = useState(false)
  const [isRejectOpen, setRejectOpen] = useState(false)

  if (request.status !== 'pending' || (!viewer.canRequest && !viewer.canResolve)) return null

  return (
    <>
      {viewer.canRequest && (
        <>
          <EditRequestDrawer request={request} open={isEditOpen} onOpenChange={setEditOpen} />
          <DeleteRequestAlertDialog request={request} open={isDeleteOpen} onOpenChange={setDeleteOpen} />
        </>
      )}
      {viewer.canResolve && (
        <>
          <PayRequestDrawer request={request} open={isPayOpen} onOpenChange={setPayOpen} />
          <RejectRequestDialog request={request} open={isRejectOpen} onOpenChange={setRejectOpen} />
        </>
      )}

      <Menu>
        <MenuTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className="ml-auto"
              aria-label={`Acciones de ${request.title}`}
            >
              <EllipsisIcon className="size-4" />
            </Button>
          }
        />
        <MenuPopup align="end" className="max-w-56">
          <MenuGroup>
            <MenuGroupLabel className="my-1.5 py-0">{request.title}</MenuGroupLabel>

            {viewer.canResolve && (
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

            {viewer.canResolve && viewer.canRequest && <MenuSeparator />}

            {viewer.canRequest && (
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

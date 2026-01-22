import { IconCurrencyDollar, IconDotsVertical, IconEdit, IconTrash } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { deletePayment } from '@/api/server-functions/payments'
import { PAYMENTS_QUERY_KEY } from '@/api/tanstack-queries/payments'
import { LoaderIcon } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { toastManager } from '@/components/ui/toast'
import type { PaymentWithOwnerAndMonths } from '@/db/schemas/zod/payments'
import { getPaymentTypeLabel } from '@/lib/utils'
import type { DeletePaymentData } from '@/schemas/payments'
import { EditPaymentSheet } from '../sheets/edit-payment'
import { PaymentDetailsSheet } from '../sheets/payment-details'

interface ActionsProps {
  payment: PaymentWithOwnerAndMonths
}

export function PaymentsTableActions({ payment }: ActionsProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isPaymentDetailsSheetOpen, setPaymentDetailsSheetOpen] = useState(false)
  const [isEditPaymentSheetOpen, setEditPaymentSheetOpen] = useState(false)
  const queryClient = useQueryClient()

  const deletePaymentMutation = useMutation({
    mutationFn: async (data: DeletePaymentData) => {
      return await deletePayment({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAYMENTS_QUERY_KEY] })
      setDeleteDialogOpen(false)
      toastManager.add({
        type: 'success',
        title: 'Pago eliminado',
        description: 'El pago ha sido eliminado exitosamente.',
      })
    },
    onError: (error) => {
      console.error('Error deleting payment:', error)

      toastManager.add({
        type: 'error',
        title: 'Error',
        description: 'Ocurrió un error al eliminar el pago, intenta nuevamente.',
      })
    },
  })

  function handleDeletePayment() {
    deletePaymentMutation.mutate({ paymentId: payment.id })
  }

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar este pago. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" disabled={deletePaymentMutation.isPending} />}
            >
              Cancelar
            </AlertDialogClose>
            <AlertDialogClose
              render={
                <Button
                  variant="destructive"
                  onClick={handleDeletePayment}
                  disabled={deletePaymentMutation.isPending}
                />
              }
            >
              Eliminar
              {deletePaymentMutation.isPending && <LoaderIcon />}
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>

      <PaymentDetailsSheet
        payment={payment}
        state={{ isOpen: isPaymentDetailsSheetOpen, onOpenChange: setPaymentDetailsSheetOpen }}
      />

      <EditPaymentSheet
        payment={payment}
        state={{ isOpen: isEditPaymentSheetOpen, onOpenChange: setEditPaymentSheetOpen }}
      />

      <div className="flex">
        <Menu>
          <MenuTrigger
            render={
              <Button aria-label="Table actions" size="icon" variant="ghost" className="ml-auto">
                <IconDotsVertical className="size-4" />
              </Button>
            }
          />
          <MenuPopup align="end" className="max-w-42">
            <MenuGroup>
              <MenuGroupLabel className="wrap-break-word my-1.5 line-clamp-2 py-0">
                {`$${payment.amount} - ${getPaymentTypeLabel(payment.paymentType)}`}
              </MenuGroupLabel>

              <MenuItem onClick={() => setPaymentDetailsSheetOpen(true)}>
                <IconCurrencyDollar className="size-4" />
                Información
              </MenuItem>

              <MenuItem onClick={() => setEditPaymentSheetOpen(true)}>
                <IconEdit className="size-4" />
                Editar
              </MenuItem>

              <MenuSeparator />

              <MenuItem variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <IconTrash className="size-4" />
                Eliminar
              </MenuItem>
            </MenuGroup>
          </MenuPopup>
        </Menu>
      </div>
    </>
  )
}

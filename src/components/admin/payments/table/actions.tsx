import { IconDotsVertical, IconEdit, IconInfoCircle, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { deletePayment } from '@/api/server-functions/payments'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { PAYMENTS_QUERY_KEY, type PaymentQueryData } from '@/api/tanstack-queries/payments'
import { AlertDialogGeneric } from '@/components/shared/alert-dialog-generic'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { getPaymentTypeLabel } from '@/lib/utils'
import type { DeletePaymentData } from '@/schemas/payments'
import { EditPaymentSheet } from '../sheets/edit-payment'
import { PaymentDetailsSheet } from '../sheets/payment-details'

interface ActionsProps {
  payment: PaymentQueryData
}

export function PaymentsTableActions({ payment }: ActionsProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isPaymentDetailsSheetOpen, setPaymentDetailsSheetOpen] = useState(false)
  const [isEditPaymentSheetOpen, setEditPaymentSheetOpen] = useState(false)

  const deletePaymentMutation = useEntityMutation({
    mutationFn: async (data: DeletePaymentData) => {
      return await deletePayment({ data })
    },
    invalidateKeys: [PAYMENTS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Pago eliminado',
    successDescription: 'El pago ha sido eliminado exitosamente',
    errorDescription: 'Ocurrió un error al eliminar el pago, intenta nuevamente',
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  function handleDeletePayment() {
    deletePaymentMutation.mutate({ paymentId: payment.id })
  }

  return (
    <>
      <AlertDialogGeneric
        open={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        action={handleDeletePayment}
        variant="destructive"
        actionLabel="Eliminar"
        title="¿Eliminar pago?"
        description={<p>Estás por eliminar este pago. Esta acción no se puede deshacer.</p>}
      />

      <PaymentDetailsSheet
        payment={payment}
        open={isPaymentDetailsSheetOpen}
        onOpenChange={setPaymentDetailsSheetOpen}
      />

      <EditPaymentSheet
        payment={payment}
        open={isEditPaymentSheetOpen}
        onOpenChange={setEditPaymentSheetOpen}
      />

      <div className="flex">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button aria-label="Table actions" size="icon" variant="ghost" className="ml-auto">
                <IconDotsVertical className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="max-w-42">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="wrap-break-word my-1.5 line-clamp-2 py-0">
                {`$${payment.amount} - ${getPaymentTypeLabel(payment.paymentType)}`}
              </DropdownMenuLabel>

              <DropdownMenuItem onClick={() => setPaymentDetailsSheetOpen(true)}>
                <IconInfoCircle className="size-4" />
                Información
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setEditPaymentSheetOpen(true)}>
                <IconEdit className="size-4" />
                Editar
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <IconTrash className="size-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

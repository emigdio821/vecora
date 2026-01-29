import { IconDotsVertical, IconEdit, IconInfoCircle, IconTrash, IconUserOff } from '@tabler/icons-react'
import { useState } from 'react'
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
// import type { PaymentWithOwnerAndMonths } from '@/db/schemas/zod/payments'
import type { ProfileWithAllRelations } from '@/db/schemas/zod/profiles'

// import { useEntityMutation } from '@/hooks/use-entity-mutation'
// import type { DeletePaymentData } from '@/schemas/payments'

// import { EditPaymentSheet } from '../sheets/edit-payment'
// import { PaymentDetailsSheet } from '../sheets/payment-details'

interface ActionsProps {
  profile: ProfileWithAllRelations
}

export function ProfilesTableActions({ profile }: ActionsProps) {
  const [isDeactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  // const [isPaymentDetailsSheetOpen, setPaymentDetailsSheetOpen] = useState(false)
  // const [isEditPaymentSheetOpen, setEditPaymentSheetOpen] = useState(false)

  // const deletePaymentMutation = useEntityMutation({
  //   mutationFn: async (data: DeletePaymentData) => {
  //     return await deletePayment({ data })
  //   },
  //   invalidateKeys: [PAYMENTS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
  //   successTitle: 'Pago eliminado',
  //   successDescription: 'El pago ha sido eliminado exitosamente.',
  //   errorDescription: 'Ocurrió un error al eliminar el pago, intenta nuevamente.',
  //   onSuccess: () => {
  //     setDeleteDialogOpen(false)
  //   },
  // })

  // function handleDeletePayment() {
  //   // deletePaymentMutation.mutate({ paymentId: payment.id })
  // }

  return (
    <>
      <AlertDialogGeneric
        variant="destructive"
        actionLabel="Eliminar"
        title="¿Eliminar perfil?"
        description="Se eliminará de manera permanentemente. Esta acción no se puede deshacer."
        // onAction={handleDeletePayment}
        state={{ isOpen: isDeleteDialogOpen, onOpenChange: setDeleteDialogOpen }}
      />

      <AlertDialogGeneric
        variant="warning"
        actionLabel="Desactivar"
        title="¿Desactivar perfil?"
        description="El perfil será desactivado y el usuario no podrá acceder a su cuenta. Esta acción puede ser revertida."
        // onAction={handleDeactivateProfile}
        state={{ isOpen: isDeactivateDialogOpen, onOpenChange: setDeactivateDialogOpen }}
      />

      {/* <PaymentDetailsSheet
        payment={payment}
        state={{ isOpen: isPaymentDetailsSheetOpen, onOpenChange: setPaymentDetailsSheetOpen }}
      />

      <EditPaymentSheet
        payment={payment}
        state={{ isOpen: isEditPaymentSheetOpen, onOpenChange: setEditPaymentSheetOpen }}
      /> */}

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
                {`${profile.user?.name}`}
              </DropdownMenuLabel>

              <DropdownMenuItem>
                <IconInfoCircle className="size-4" />
                Información
              </DropdownMenuItem>

              <DropdownMenuItem>
                <IconEdit className="size-4" />
                Editar
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setDeactivateDialogOpen(true)}>
                <IconUserOff className="size-4" />
                Desactivar
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

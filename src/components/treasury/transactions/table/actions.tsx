import { IconDots } from '@tabler/icons-react'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { Button } from '@/components/ui/button'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import type { TransactionQueryData } from '@/tanstack-queries/treasury'
import { DeleteTransactionsAlertDialog } from '../dialog/delete-transactions'
import { EditTransactionDrawer } from '../drawer/edit-transaction'

interface ActionsProps {
  transaction: TransactionQueryData
}

/** Edit and delete only, so readers see no menu; details open from the concept cell. */
export function TransactionsTableActions({ transaction }: ActionsProps) {
  const canManage = useHasRole('treasurer')
  const [isEditOpen, setEditOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)

  if (!canManage) return null

  return (
    <>
      <EditTransactionDrawer transaction={transaction} open={isEditOpen} onOpenChange={setEditOpen} />
      <DeleteTransactionsAlertDialog
        transactions={[transaction]}
        open={isDeleteOpen}
        onOpenChange={setDeleteOpen}
      />

      <Menu>
        <MenuTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className="ms-auto flex"
              aria-label={`Acciones de ${transaction.description}`}
            >
              <IconDots className="size-4" />
            </Button>
          }
        />
        <MenuPopup align="end" className="max-w-42">
          <MenuGroup>
            <MenuGroupLabel className="my-1.5 line-clamp-2 py-0 wrap-break-word">
              {transaction.description}
            </MenuGroupLabel>

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
          </MenuGroup>
        </MenuPopup>
      </Menu>
    </>
  )
}

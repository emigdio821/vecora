'use client'

import { IconDotsVertical, IconEdit, IconTrash, IconUser } from '@tabler/icons-react'
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
import type { OwnerWithRelations } from '@/db/schemas/zod'

interface ActionsProps {
  owner: OwnerWithRelations
}

export function OwnersTableActions({ owner }: ActionsProps) {
  const ownerFullName = `${owner.firstName} ${owner.lastName}`.trim()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label="Table actions" size="icon" variant="ghost">
            <IconDotsVertical className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="wrap-break-word my-1.5 line-clamp-2 py-0">
            {ownerFullName}
          </DropdownMenuLabel>

          <DropdownMenuItem>
            <IconUser className="size-4" />
            Información
          </DropdownMenuItem>

          <DropdownMenuItem>
            <IconEdit className="size-4" />
            Editar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem variant="destructive">
            <IconTrash className="size-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

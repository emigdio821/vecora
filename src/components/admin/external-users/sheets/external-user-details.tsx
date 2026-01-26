import { IconChevronDown, IconNotes, IconUser } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CopyButton } from '@/components/ui/copy-button'
import { Frame, FrameHeader, FramePanel } from '@/components/ui/frame'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import type { SelectExternalUser } from '@/db/schemas/zod/external-users'
import { formatDate } from '@/lib/utils'

interface ExternalUserDetailsSheetProps {
  externalUser: SelectExternalUser
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function ExternalUserDetailsSheet({ externalUser, state }: ExternalUserDetailsSheetProps) {
  const { isOpen, onOpenChange } = state
  const externalUserFullName = `${externalUser.firstName} ${externalUser.lastName}`.trim()

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Información del usuario externo</SheetTitle>
          <SheetDescription>Información completa y detallada del usuario externo</SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-4">
          {/* Personal info */}
          <Frame className="w-full">
            <Collapsible defaultOpen>
              <FrameHeader className="flex-row items-center justify-between p-2">
                <CollapsibleTrigger
                  className="data-panel-open:[&_svg]:rotate-180"
                  render={<Button variant="plain" />}
                >
                  <IconChevronDown className="size-4" />
                  Información personal
                </CollapsibleTrigger>
                <IconUser className="size-4 text-muted-foreground" />
              </FrameHeader>
              <CollapsibleContent className="space-y-1">
                <FramePanel className="flex items-center gap-2 p-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">Nombre</h2>
                    <p className="line-clamp-2 text-muted-foreground text-sm">{externalUserFullName}</p>
                  </div>
                  <CopyButton tooltipText="Copiar ID" value={externalUser.id} />
                </FramePanel>
                {externalUser.email && (
                  <FramePanel className="p-2">
                    <h2 className="font-medium text-sm">Correo</h2>
                    <p className="line-clamp-2 text-muted-foreground text-sm">{externalUser.email}</p>
                  </FramePanel>
                )}
                {externalUser.phone && (
                  <FramePanel className="p-2">
                    <h2 className="font-medium text-sm">Teléfono</h2>
                    <p className="line-clamp-2 text-muted-foreground text-sm">{externalUser.phone}</p>
                  </FramePanel>
                )}
              </CollapsibleContent>
            </Collapsible>
          </Frame>

          <Frame className="w-full">
            {/* Notes info */}
            {externalUser.notes && (
              <Collapsible defaultOpen>
                <FrameHeader className="flex-row items-center justify-between p-2">
                  <CollapsibleTrigger
                    className="data-panel-open:[&_svg]:rotate-180"
                    render={<Button variant="plain" />}
                  >
                    <IconChevronDown className="size-4" />
                    Notas
                  </CollapsibleTrigger>
                  <IconNotes className="size-4 text-muted-foreground" />
                </FrameHeader>
                <CollapsibleContent className="space-y-1">
                  <FramePanel className="flex items-center gap-2 p-2">
                    <p className="line-clamp-2 text-muted-foreground text-sm">{externalUser.notes}</p>
                  </FramePanel>
                </CollapsibleContent>
              </Collapsible>
            )}
          </Frame>
        </SheetPanel>

        <SheetFooter className="block space-y-1">
          {/* Metadata */}
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Fecha de registro</span>
            <span>{formatDate(externalUser.createdAt)}</span>
          </div>
          {externalUser.updatedAt &&
            new Date(externalUser.updatedAt).getTime() > new Date(externalUser.createdAt).getTime() && (
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Última actualización</span>
                <span>{formatDate(externalUser.updatedAt)}</span>
              </div>
            )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

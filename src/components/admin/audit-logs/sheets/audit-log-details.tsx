import {
  IconChevronDown,
  IconDeviceDesktopAnalytics,
  IconFileDescription,
  IconUser,
  IconWind,
} from '@tabler/icons-react'
import { AuditLogActionBadge } from '@/components/shared/audit-logs/action-badge'
import { AuditLogEntityTypeBadge } from '@/components/shared/audit-logs/identity-type-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CopyButton } from '@/components/ui/copy-button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty'
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
import type { AuditLogWithUserAndProfile } from '@/db/schemas/zod/audit-logs'
import { formatDate } from '@/lib/utils'

interface AuditDetailsSheetProps {
  auditLog: AuditLogWithUserAndProfile
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function AuditLogDetailsSheet({ auditLog, state }: AuditDetailsSheetProps) {
  const { isOpen, onOpenChange } = state
  const profileRoles = auditLog.profile?.roles || []

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Detalles del registro de auditoría</SheetTitle>
          <SheetDescription>Información completa y detallada del registro de auditoría</SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-4">
          {/* Action info */}
          <Frame className="w-full">
            <Collapsible defaultOpen>
              <FrameHeader className="flex-row items-center justify-between p-2">
                <CollapsibleTrigger
                  className="data-panel-open:[&_svg]:rotate-180"
                  render={<Button variant="plain" />}
                >
                  <IconChevronDown className="size-4" />
                  Información de la acción
                </CollapsibleTrigger>
                <IconFileDescription className="size-4 text-muted-foreground" />
              </FrameHeader>
              <CollapsiblePanel className="space-y-1">
                <FramePanel className="flex items-center gap-2 p-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">ID de registro</h2>
                    <p className="font-mono text-muted-foreground text-xs">{auditLog.id}</p>
                  </div>
                  <CopyButton tooltipText="Copiar ID" value={auditLog.id} />
                </FramePanel>
                <FramePanel className="p-2">
                  <h2 className="font-medium text-sm">Acción</h2>
                  <AuditLogActionBadge action={auditLog.action} />
                </FramePanel>
                <FramePanel className="flex items-center gap-2 p-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">Tipo de entidad</h2>
                    <AuditLogEntityTypeBadge entityType={auditLog.entityType} />
                  </div>
                  {auditLog.entityId && (
                    <CopyButton tooltipText="Copiar ID de entidad" value={auditLog.entityId} />
                  )}
                </FramePanel>
              </CollapsiblePanel>
            </Collapsible>
          </Frame>

          {/* User info */}
          <Frame className="w-full">
            <Collapsible defaultOpen>
              <FrameHeader className="flex-row items-center justify-between p-2">
                <CollapsibleTrigger
                  className="data-panel-open:[&_svg]:rotate-180"
                  render={<Button variant="plain" />}
                >
                  <IconChevronDown className="size-4" />
                  Usuario
                </CollapsibleTrigger>
                <IconUser className="size-4 text-muted-foreground" />
              </FrameHeader>
              <CollapsiblePanel>
                {auditLog.user ? (
                  <div className="space-y-1">
                    <FramePanel className="flex items-center gap-2 p-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="font-medium text-sm">Nombre</h2>
                        <p className="truncate text-muted-foreground text-sm">{auditLog.user.name}</p>
                      </div>
                      <CopyButton tooltipText="Copiar ID de usuario" value={auditLog.user.id} />
                    </FramePanel>
                    <FramePanel className="p-2">
                      <h2 className="font-medium text-sm">Correo electrónico</h2>
                      <p className="text-muted-foreground text-sm">{auditLog.user.email}</p>
                    </FramePanel>

                    {profileRoles.length > 0 && (
                      <FramePanel className="p-2">
                        <h2 className="font-medium text-sm">Rol</h2>
                        <div className="flex flex-wrap gap-1">
                          {profileRoles.map((role) => (
                            <Badge variant="outline" key={role}>
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </FramePanel>
                    )}
                  </div>
                ) : (
                  <FramePanel className="p-2">
                    <Empty className="p-0 md:p-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon" className="mb-1">
                          <IconWind />
                        </EmptyMedia>
                        <EmptyDescription>Usuario no disponible</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </FramePanel>
                )}
              </CollapsiblePanel>
            </Collapsible>
          </Frame>

          {/* Changes */}
          {auditLog.changes && (
            <Frame className="w-full">
              <Collapsible defaultOpen>
                <FrameHeader className="flex-row items-center justify-between p-2">
                  <CollapsibleTrigger
                    className="data-panel-open:[&_svg]:rotate-180"
                    render={<Button variant="plain" />}
                  >
                    <IconChevronDown className="size-4" />
                    Cambios
                  </CollapsibleTrigger>
                  <IconFileDescription className="size-4 text-muted-foreground" />
                </FrameHeader>
                <CollapsiblePanel>
                  <FramePanel className="p-2">
                    <pre className="overflow-x-auto font-mono text-muted-foreground text-xs">
                      {JSON.stringify(auditLog.changes, null, 2)}
                    </pre>
                  </FramePanel>
                </CollapsiblePanel>
              </Collapsible>
            </Frame>
          )}

          {/* Technical details */}
          {(auditLog.ipAddress || auditLog.userAgent) && (
            <Frame className="w-full">
              <Collapsible defaultOpen>
                <FrameHeader className="flex-row items-center justify-between p-2">
                  <CollapsibleTrigger
                    className="data-panel-open:[&_svg]:rotate-180"
                    render={<Button variant="plain" />}
                  >
                    <IconChevronDown className="size-4" />
                    Detalles técnicos
                  </CollapsibleTrigger>
                  <IconDeviceDesktopAnalytics className="size-4 text-muted-foreground" />
                </FrameHeader>
                <CollapsiblePanel className="space-y-1">
                  {auditLog.ipAddress && (
                    <FramePanel className="flex items-center gap-2 p-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="font-medium text-sm">Dirección IP</h2>
                        <p className="text-muted-foreground text-sm">{auditLog.ipAddress}</p>
                      </div>
                      <CopyButton tooltipText="Copiar IP" value={auditLog.ipAddress} />
                    </FramePanel>
                  )}
                  {auditLog.userAgent && (
                    <FramePanel className="p-2">
                      <h2 className="font-medium text-sm">Agente de usuario</h2>
                      <p className="break-all text-muted-foreground text-xs">{auditLog.userAgent}</p>
                    </FramePanel>
                  )}
                </CollapsiblePanel>
              </Collapsible>
            </Frame>
          )}
        </SheetPanel>

        <SheetFooter className="block space-y-1">
          {/* Metadata */}
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Fecha y hora</span>
            <span>{formatDate(auditLog.timestamp, { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

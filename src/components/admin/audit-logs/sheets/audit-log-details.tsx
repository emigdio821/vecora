import { IconDeviceDesktopAnalytics, IconFileDescription, IconUser, IconWind } from '@tabler/icons-react'
import type { AuditLogQueryData } from '@/api/tanstack-queries/audit-logs'
import { AuditLogActionBadge } from '@/components/shared/audit-logs/action-badge'
import { AuditLogEntityTypeBadge } from '@/components/shared/audit-logs/identity-type-badge'
import { CollapsibleDetails } from '@/components/shared/collapsible-details'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import { CopyButton } from '@/components/ui/copy-button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDate } from '@/lib/utils'

interface AuditDetailsSheetProps {
  auditLog: AuditLogQueryData
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function AuditLogDetailsSheet({ auditLog, state }: AuditDetailsSheetProps) {
  const userRole = auditLog.user?.role
  const { isOpen, onOpenChange } = state

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Detalles del registro de auditoría</SheetTitle>
          <SheetDescription>Información completa y detallada del registro de auditoría</SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-4">
          {/* Action info */}
          <CollapsibleDetails
            title="Información de la acción"
            icon={IconFileDescription}
            content={
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">ID de registro</h2>
                    <p className="font-mono text-muted-foreground text-xs">{auditLog.id}</p>
                  </div>
                  <CopyButton tooltipText="Copiar ID" value={auditLog.id} />
                </div>

                <div>
                  <h2 className="font-medium text-sm">Acción</h2>
                  <AuditLogActionBadge className="mt-1" action={auditLog.action} />
                </div>

                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">Tipo de entidad</h2>
                    <AuditLogEntityTypeBadge className="mt-1" entityType={auditLog.entityType} />
                  </div>
                  {auditLog.entityId && (
                    <CopyButton tooltipText="Copiar ID de entidad" value={auditLog.entityId} />
                  )}
                </div>
              </div>
            }
          />

          {/* User info */}
          <CollapsibleDetails
            title="Usuario"
            icon={IconUser}
            content={
              auditLog.user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-medium text-sm">Nombre</h2>
                      <p className="truncate text-muted-foreground text-sm">{auditLog.user.name}</p>
                    </div>
                    <CopyButton tooltipText="Copiar ID de usuario" value={auditLog.user.id} />
                  </div>

                  <div>
                    <h2 className="font-medium text-sm">Correo electrónico</h2>
                    <p className="text-muted-foreground text-sm">{auditLog.user.email}</p>
                  </div>

                  {userRole && (
                    <div>
                      <h2 className="font-medium text-sm">Rol</h2>
                      <div className="mt-1">
                        <RoleNameBadge roleName={userRole} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <Empty className="p-1">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="mb-0">
                        <IconWind />
                      </EmptyMedia>
                      <EmptyDescription>Usuario no disponible</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              )
            }
          />

          {/* Changes */}
          {auditLog.changes && (
            <CollapsibleDetails
              title="Cambios"
              icon={IconFileDescription}
              content={
                <pre className="overflow-x-auto font-mono text-muted-foreground text-xs">
                  {JSON.stringify(auditLog.changes, null, 2)}
                </pre>
              }
            />
          )}

          {/* Technical details */}
          {(auditLog.ipAddress || auditLog.userAgent) && (
            <CollapsibleDetails
              title="Detalles técnicos"
              icon={IconDeviceDesktopAnalytics}
              content={
                <>
                  {auditLog.ipAddress && (
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="font-medium text-sm">Dirección IP</h2>
                        <p className="text-muted-foreground text-sm">{auditLog.ipAddress}</p>
                      </div>
                      <CopyButton tooltipText="Copiar IP" value={auditLog.ipAddress} />
                    </div>
                  )}
                  {auditLog.userAgent && (
                    <div>
                      <h2 className="font-medium text-sm">Agente de usuario</h2>
                      <p className="break-all text-muted-foreground text-xs">{auditLog.userAgent}</p>
                    </div>
                  )}
                </>
              }
            />
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

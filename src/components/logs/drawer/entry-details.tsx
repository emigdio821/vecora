import { ArrowRightIcon, LayersIcon, ListIcon, ScrollTextIcon } from 'lucide-react'
import { CollapsibleSection, Detail, Muted } from '@/components/shared/details'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from '@/components/ui/drawer'
import { formatDate } from '@/lib/utils'
import type { LogEntryQueryData } from '@/tanstack-queries/logs'
import {
  ACTION_BADGE_VARIANT,
  ACTION_LABEL,
  entryAction,
  entryChanges,
  entrySummary,
  fieldLabel,
  identityName,
  sectionLabel,
} from '../entry'

interface EntryDetailsDrawerProps extends React.ComponentProps<typeof Drawer> {
  entry: LogEntryQueryData
  /** Other entries written by the same action. */
  related: LogEntryQueryData[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Read-only: the log can't be changed from the app. */
export function EntryDetailsDrawer({
  entry,
  related,
  open,
  onOpenChange,
  ...props
}: EntryDetailsDrawerProps) {
  const action = entryAction(entry)
  const changes = entryChanges(entry)
  const isUpdate = entry.operation === 'update'

  return (
    <Drawer position="right" open={open} onOpenChange={onOpenChange} {...props}>
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>{entrySummary(entry)}</DrawerTitle>
          <DrawerDescription>Detalle del cambio</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel className="grid gap-3">
          <CollapsibleSection icon={<ScrollTextIcon />} title="Cambio">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Identidad">{identityName(entry)}</Detail>
              <Detail label="Fecha y hora">
                <span className="tabular-nums">{formatDate(entry.occurred_at)}</span>
              </Detail>
              <Detail label="Acción">
                <Badge variant={ACTION_BADGE_VARIANT[action]}>{ACTION_LABEL[action]}</Badge>
              </Detail>
              <Detail label="Sección">
                <Badge variant="outline">{sectionLabel(entry.table_name)}</Badge>
              </Detail>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            icon={<ListIcon />}
            title={isUpdate ? 'Campos que cambiaron' : 'Datos'}
            count={changes.length}
          >
            {changes.length ? (
              <dl className="grid gap-3">
                {changes.map(({ field, before, after }) => (
                  <div key={field} className="grid gap-0.5">
                    <dt className="text-xs text-muted-foreground">{fieldLabel(field)}</dt>
                    <dd className="text-sm font-medium">
                      {isUpdate ? (
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="whitespace-pre-wrap text-muted-foreground line-through">
                            {before || <Muted>Vacío</Muted>}
                          </span>
                          <ArrowRightIcon
                            aria-label="cambió a"
                            className="size-3.5 shrink-0 text-muted-foreground"
                          />
                          <span className="whitespace-pre-wrap">{after || <Muted>Vacío</Muted>}</span>
                        </span>
                      ) : (
                        <span className="whitespace-pre-wrap">{after || before}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <Muted>Sin datos que mostrar.</Muted>
            )}
          </CollapsibleSection>

          {related.length > 0 && (
            <CollapsibleSection icon={<LayersIcon />} title="Cambios relacionados" count={related.length}>
              <ul className="grid gap-2 text-sm">
                {related.map((other) => {
                  const otherAction = entryAction(other)
                  return (
                    <li key={other.id} className="flex flex-wrap items-center gap-2">
                      <Badge variant={ACTION_BADGE_VARIANT[otherAction]}>{ACTION_LABEL[otherAction]}</Badge>
                      <Badge variant="outline">{sectionLabel(other.table_name)}</Badge>
                      <span className="truncate">{entrySummary(other)}</span>
                    </li>
                  )
                })}
              </ul>
            </CollapsibleSection>
          )}
        </DrawerPanel>

        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost" />}>Cerrar</DrawerClose>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

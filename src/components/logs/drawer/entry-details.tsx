import { IconArrowRight, IconList, IconScript, IconStack2 } from '@tabler/icons-react'
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
import { m } from '@/paraglide/messages'
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

function changesTitle(entry: LogEntryQueryData) {
  if (entry.operation === 'update') return m.logs_changes_updated()
  return entry.operation === 'insert' ? m.logs_changes_inserted() : m.logs_changes_deleted()
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
      <DrawerPopup variant="inset" className="max-w-lg">
        <DrawerHeader>
          <DrawerTitle>{entrySummary(entry)}</DrawerTitle>
          <DrawerDescription>
            {m.logs_entry_description({
              name: identityName(entry),
              action: ACTION_LABEL[action].toLowerCase(),
              date: formatDate(entry.occurred_at),
            })}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerPanel className="grid gap-3">
          <CollapsibleSection icon={<IconScript />} title={m.logs_summary()}>
            <div className="grid grid-cols-2 gap-3">
              <Detail label={m.logs_who()}>{identityName(entry)}</Detail>
              <Detail label={m.logs_when()}>
                <span className="tabular-nums">{formatDate(entry.occurred_at)}</span>
              </Detail>
              <Detail label={m.logs_action()}>
                <Badge variant={ACTION_BADGE_VARIANT[action]}>{ACTION_LABEL[action]}</Badge>
              </Detail>
              <Detail label={m.logs_section()}>
                <Badge variant="outline">{sectionLabel(entry.table_name)}</Badge>
              </Detail>
            </div>
          </CollapsibleSection>

          <CollapsibleSection icon={<IconList />} title={changesTitle(entry)} count={changes.length}>
            {changes.length ? (
              <dl className="grid gap-3">
                {changes.map(({ field, before, after }) => (
                  <div key={field} className="grid gap-0.5">
                    <dt className="text-xs text-muted-foreground">{fieldLabel(field)}</dt>
                    <dd className="text-sm font-medium">
                      {isUpdate ? (
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="whitespace-pre-wrap text-muted-foreground line-through">
                            {before || <Muted>{m.logs_value_empty()}</Muted>}
                          </span>
                          <IconArrowRight
                            aria-label={m.logs_changed_to()}
                            className="size-3.5 shrink-0 text-muted-foreground"
                          />
                          <span className="whitespace-pre-wrap">
                            {after || <Muted>{m.logs_value_empty()}</Muted>}
                          </span>
                        </span>
                      ) : (
                        <span className="whitespace-pre-wrap">{after || before}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <Muted>{m.logs_no_data()}</Muted>
            )}
          </CollapsibleSection>

          {related.length > 0 && (
            <CollapsibleSection icon={<IconStack2 />} title={m.logs_related_title()} count={related.length}>
              <p className="mb-3 text-sm text-muted-foreground">{m.logs_related_description()}</p>
              <ul className="grid gap-3 text-sm">
                {related.map((other) => {
                  const otherAction = entryAction(other)
                  return (
                    <li key={other.id} className="grid gap-1">
                      <span className="flex flex-wrap gap-2">
                        <Badge variant={ACTION_BADGE_VARIANT[otherAction]}>{ACTION_LABEL[otherAction]}</Badge>
                        <Badge variant="outline">{sectionLabel(other.table_name)}</Badge>
                      </span>
                      <span className="min-w-0 wrap-break-word">{entrySummary(other)}</span>
                    </li>
                  )
                })}
              </ul>
            </CollapsibleSection>
          )}
        </DrawerPanel>

        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost" />}>{m.common_action_close()}</DrawerClose>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

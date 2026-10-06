import {
  IconCalendarPlus,
  IconCash,
  IconCircleCheck,
  IconCircleX,
  IconNotes,
  IconUrgent,
} from '@tabler/icons-react'
import { CollapsibleSection, Detail, Timestamp } from '@/components/shared/details'
import { Money } from '@/components/shared/money'
import { STATUS_BADGE_VARIANT, STATUS_LABEL } from '@/components/shared/request-status'
import { PAYMENT_METHOD_LABEL } from '@/components/treasury/kind'
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
import { formatDay } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import type { SecurityRequestQueryData } from '@/tanstack-queries/security'
import { KIND_LABEL } from '../kind'

interface RequestDetailsDrawerProps extends React.ComponentProps<typeof Drawer> {
  request: SecurityRequestQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Read-only view; actions stay in the row menu. */
export function RequestDetailsDrawer({ request, open, onOpenChange, ...props }: RequestDetailsDrawerProps) {
  const { status, transaction, resolver } = request

  return (
    <Drawer position="right" open={open} onOpenChange={onOpenChange} {...props}>
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>{request.title}</DrawerTitle>
          <DrawerDescription>{m.requests_details_description()}</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel className="grid gap-3">
          <CollapsibleSection icon={<IconUrgent />} title={m.requests_section_request()}>
            <div className="grid grid-cols-2 gap-3">
              <Detail label={m.common_field_type()}>
                <Badge variant="outline">{KIND_LABEL[request.kind]}</Badge>
              </Detail>
              <Detail label={m.common_field_status()}>
                <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
              </Detail>
              <Detail label={m.common_field_amount()}>
                <span className="tabular-nums">
                  <Money value={request.amount} currency={request.currency} />
                </span>
              </Detail>
              <Detail label={m.common_field_date()}>{formatDay(request.requested_on)}</Detail>
              <Detail label={m.requests_requester()}>{request.requester.full_name}</Detail>
            </div>
          </CollapsibleSection>

          {request.details && (
            <CollapsibleSection icon={<IconNotes />} title={m.common_field_details()}>
              <p className="text-sm whitespace-pre-wrap">{request.details}</p>
            </CollapsibleSection>
          )}

          {status === 'paid' && transaction && (
            <CollapsibleSection icon={<IconCash />} title={m.requests_section_payment()}>
              <div className="grid grid-cols-2 gap-3">
                <Detail label={m.requests_payment_date()}>{formatDay(transaction.occurred_on)}</Detail>
                <Detail label={m.common_field_payment_method()}>
                  {PAYMENT_METHOD_LABEL[transaction.payment_method]}
                </Detail>
                {transaction.reference && (
                  <Detail label={m.common_field_reference()}>{transaction.reference}</Detail>
                )}
                {resolver && <Detail label={m.requests_recorded_by()}>{resolver.full_name}</Detail>}
              </div>
            </CollapsibleSection>
          )}

          {status === 'rejected' && (
            <CollapsibleSection icon={<IconCircleX />} title={m.requests_section_rejection()}>
              <Detail label={m.requests_reason()}>
                <p className="font-normal whitespace-pre-wrap">{request.rejection_reason}</p>
              </Detail>
              {resolver && <Detail label={m.requests_rejected_by()}>{resolver.full_name}</Detail>}
            </CollapsibleSection>
          )}

          <dl className="grid grid-cols-2 gap-3 px-1 pt-1">
            <Timestamp
              icon={<IconCalendarPlus />}
              label={m.requests_submitted()}
              value={request.created_at}
            />
            {request.resolved_at && (
              <Timestamp
                icon={<IconCircleCheck />}
                label={m.requests_resolved()}
                value={request.resolved_at}
              />
            )}
          </dl>
        </DrawerPanel>

        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost" />}>{m.common_action_close()}</DrawerClose>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

import { IconCheck, IconCopy } from '@tabler/icons-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { toastManager } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { m } from '@/paraglide/messages'
import type { InviteResult } from '@/server-actions/hoa-board'

interface InviteLinkDialogProps extends React.ComponentProps<typeof Dialog> {
  invite: InviteResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function whatsappUrl({ phone, full_name, link }: InviteResult) {
  const message = m.board_whatsapp_message({ name: full_name.split(' ')[0], link })
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}

/**
 * Hands the one-time invite link to whoever is adding the member. The link is
 * not emailed; the board shares it by WhatsApp or pastes it wherever suits.
 */
export function InviteLinkDialog({ invite, open, onOpenChange, ...props }: InviteLinkDialogProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!invite) return
    try {
      await navigator.clipboard.writeText(invite.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toastManager.add({
        type: 'error',
        title: m.board_copy_failed(),
        description: m.board_copy_failed_description(),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal {...props}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{m.board_invite_title({ name: invite?.full_name ?? '' })}</DialogTitle>
          <DialogDescription>{m.board_invite_description()}</DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <InputGroup>
            <InputGroupInput
              readOnly
              value={invite?.link ?? ''}
              aria-label={m.board_access_link()}
              onFocus={(e) => {
                e.currentTarget.select()
              }}
            />
            <InputGroupAddon align="inline-end">
              <Tooltip>
                <TooltipTrigger
                  closeOnClick={false}
                  render={
                    <Button size="icon-xs" variant="ghost" aria-label={m.board_copy_link()} onClick={copy}>
                      {copied ? <IconCheck className="text-success-foreground" /> : <IconCopy />}
                    </Button>
                  }
                />
                <TooltipContent>{copied ? m.board_link_copied() : m.board_copy_link()}</TooltipContent>
              </Tooltip>
            </InputGroupAddon>
          </InputGroup>
        </DialogPanel>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>{m.common_action_close()}</DialogClose>
          {invite && (
            <Button
              render={
                <a
                  href={whatsappUrl(invite)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={m.board_send_whatsapp()}
                />
              }
            >
              {m.board_send_whatsapp()}
            </Button>
          )}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}

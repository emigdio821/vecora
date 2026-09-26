'use client'

import { CheckIcon, CopyIcon } from 'lucide-react'
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
import type { InviteResult } from '@/server-actions/hoa-board'

interface InviteLinkDialogProps {
  invite: InviteResult | null
  onOpenChange: (open: boolean) => void
}

function whatsappUrl({ phone, full_name, link }: InviteResult) {
  const message = `Hola ${full_name.split(' ')[0]}, te comparto tu acceso a Resido. Abre este enlace y crea tu contraseña: ${link}`
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}

/**
 * Hands the one-time invite link to whoever is adding the member. The link is
 * not emailed; the board shares it by WhatsApp or pastes it wherever suits.
 */
export function InviteLinkDialog({ invite, onOpenChange }: InviteLinkDialogProps) {
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
        title: 'No se pudo copiar',
        description: 'Selecciona el enlace y cópialo manualmente',
      })
    }
  }

  return (
    <Dialog open={invite !== null} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Enlace de acceso para {invite?.full_name}</DialogTitle>
          <DialogDescription>
            Compártelo por WhatsApp o cópialo. Al abrirlo, la persona creará su contraseña. El enlace solo
            sirve una vez; si se pierde, puedes generar otro desde el menú del integrante.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <InputGroup>
            <InputGroupInput
              readOnly
              value={invite?.link ?? ''}
              aria-label="Enlace de acceso"
              onFocus={(e) => {
                e.currentTarget.select()
              }}
            />
            <InputGroupAddon align="inline-end">
              <Tooltip>
                <TooltipTrigger
                  closeOnClick={false}
                  render={
                    <Button size="icon-xs" variant="ghost" aria-label="Copiar enlace" onClick={copy}>
                      {copied ? <CheckIcon className="text-success-foreground" /> : <CopyIcon />}
                    </Button>
                  }
                />
                <TooltipContent>{copied ? 'Enlace copiado' : 'Copiar enlace'}</TooltipContent>
              </Tooltip>
            </InputGroupAddon>
          </InputGroup>
        </DialogPanel>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cerrar</DialogClose>
          {invite && (
            <Button
              render={
                <a
                  href={whatsappUrl(invite)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Enviar por WhatsApp"
                />
              }
            >
              Enviar por WhatsApp
            </Button>
          )}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}

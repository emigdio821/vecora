import { IconCheck, IconCopy } from '@tabler/icons-react'
import { useRef } from 'react'
import { COPY_TIMEOUT, useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from './button'
import { anchoredToastManager } from './toast'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

type CopyButtonProps = ButtonProps & {
  value: string
  tooltipText?: string
  successText?: string
  iconClassName?: string
}

export function CopyButton(props: CopyButtonProps) {
  const { value, tooltipText = 'Copiar', successText = 'Copiado', iconClassName, ...btnProps } = props
  const copyButtonRef = useRef<HTMLButtonElement>(null)

  const { copyToClipboard, isCopied } = useCopyToClipboard({
    onCopy: () => {
      if (copyButtonRef.current) {
        anchoredToastManager.add({
          data: {
            tooltipStyle: true,
          },
          positionerProps: {
            anchor: copyButtonRef.current,
          },
          timeout: COPY_TIMEOUT,
          title: successText,
        })
      }
    },
    timeout: COPY_TIMEOUT,
  })

  function handleCopy() {
    copyToClipboard(value)
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={isCopied}
            ref={copyButtonRef}
            onClick={handleCopy}
            focusableWhenDisabled
            aria-label={isCopied ? successText : tooltipText}
            {...btnProps}
          />
        }
      >
        {isCopied ? (
          <IconCheck className={cn('size-4', iconClassName)} />
        ) : (
          <IconCopy className={cn('size-4', iconClassName)} />
        )}
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  )
}

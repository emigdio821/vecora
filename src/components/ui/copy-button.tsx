import { IconCheck, IconCopy } from '@tabler/icons-react'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from './button'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

type CopyButtonProps = ButtonProps & {
  value: string
  tooltipText?: string
  successText?: string
  iconClassName?: string
}

export function CopyButton(props: CopyButtonProps) {
  const { value, tooltipText = 'Copiar', successText = 'Copiado', iconClassName, ...btnProps } = props
  const { copyToClipboard, isCopied } = useCopyToClipboard()

  function handleCopy() {
    copyToClipboard(value)
  }

  return (
    <Tooltip>
      <TooltipTrigger
        closeOnClick={false}
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={isCopied}
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
        <p>{isCopied ? successText : tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  )
}

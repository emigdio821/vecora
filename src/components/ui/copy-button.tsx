import { IconCheck, IconCopy } from '@tabler/icons-react'
import { useState } from 'react'
import { Button, type ButtonProps } from './button'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

type CopyButtonProps = ButtonProps & {
  value: string
  tooltipText?: string
  successText?: string
  iconSize?: number
}

export function CopyButton({
  value,
  tooltipText = 'Copiar al portapapeles',
  successText = '¡Copiado!',
  iconSize = 16,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleCopy}
            aria-label={copied ? successText : tooltipText}
            {...props}
          >
            {copied ? <IconCheck size={iconSize} /> : <IconCopy size={iconSize} />}
          </Button>
        }
      />
      <TooltipContent>
        <p>{copied ? successText : tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  )
}

import type { Icon } from '@tabler/icons-react'
import { useState } from 'react'
import { Button, type ButtonProps } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

interface DataTableIconHeaderProps extends ButtonProps {
  tipContent: React.ReactNode
  icon: React.ReactElement<Icon>
}

export function DataTableIconHeader({ icon, tipContent, ...buttonProps }: DataTableIconHeaderProps) {
  const [isTooltipOpen, setTooltipOpen] = useState(false)

  return (
    <Tooltip open={isTooltipOpen} onOpenChange={setTooltipOpen}>
      <TooltipTrigger
        render={
          <Button
            size="icon-xs"
            variant="plain"
            className="cursor-default"
            onClick={(e) => {
              e.preventBaseUIHandler()
              setTooltipOpen(true)
            }}
            {...buttonProps}
          >
            {icon}
          </Button>
        }
      />
      <TooltipContent>{tipContent}</TooltipContent>
    </Tooltip>
  )
}

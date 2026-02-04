import { type Icon, IconChevronDown } from '@tabler/icons-react'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Frame, FrameHeader } from '../ui/frame'

interface CollapsibleDetailsProps {
  icon?: Icon
  title?: React.ReactNode
  content: React.ReactNode
}

export function CollapsibleDetails({ icon: Icon, title, content }: CollapsibleDetailsProps) {
  return (
    <Frame className="w-full">
      <Collapsible defaultOpen>
        <FrameHeader className="flex-row items-center justify-between p-1">
          <h4 className="flex items-center gap-2 text-sm leading-none">
            {Icon && <Icon className="size-4 text-muted-foreground" />}
            <span>{title}</span>
          </h4>
          <CollapsibleTrigger
            className="data-panel-open:[&_svg]:rotate-180"
            render={<Button variant="ghost" size="icon-xs" aria-label="Expandir/collapsar información" />}
          >
            <IconChevronDown className="size-4" />
          </CollapsibleTrigger>
        </FrameHeader>
        <CollapsibleContent>{content}</CollapsibleContent>
      </Collapsible>
    </Frame>
  )
}

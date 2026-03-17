import { type Icon, IconChevronDown } from '@tabler/icons-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'

interface CollapsibleDetailsProps {
  icon?: Icon
  title?: React.ReactNode
  content: React.ReactNode
}

export function CollapsibleDetails({ icon: Icon, title, content }: CollapsibleDetailsProps) {
  return (
    <Card className="w-full overflow-clip">
      <Collapsible defaultOpen>
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
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
          </div>
        </CardHeader>
        <CardContent>
          <CollapsibleContent className="flex flex-col gap-2 pt-2">{content}</CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  )
}

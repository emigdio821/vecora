import type { TablerIcon } from '@tabler/icons-react'
import {
  Card,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from '@/components/ui/card'

interface SettingsCardProps {
  title: string
  description: string
  icon: TablerIcon
  children: React.ReactNode
  /** Its buttons, right-aligned; left out when changes apply on pick. */
  footer?: React.ReactNode
}

/** One section of the settings page, laid out like the financial report's cards. */
export function SettingsCard({ title, description, icon: Icon, children, footer }: SettingsCardProps) {
  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>{title}</CardFrameTitle>
        <CardFrameDescription>{description}</CardFrameDescription>
        <CardFrameAction>
          <Icon className="text-muted-foreground" />
        </CardFrameAction>
      </CardFrameHeader>
      {/* flex-1: side by side, the shorter card still lines up with the other. */}
      <Card className="flex-1">
        <CardPanel className="flex flex-col gap-4">{children}</CardPanel>
      </Card>
      {/* flex-wrap: with large text, the buttons stack instead of leaving the card. */}
      {footer && <CardFrameFooter className="flex flex-wrap justify-end gap-2">{footer}</CardFrameFooter>}
    </CardFrame>
  )
}

/** The cards of one tab: stacked, then two per row on large screens. */
export function SettingsGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{children}</div>
}

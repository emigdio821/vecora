import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as React from 'react'
import {
  type SegmentedControlSize,
  segmentedControlItemLayoutClassName,
  segmentedControlItemSizeClassNames,
} from '@/lib/segmented-control'
import { cn } from '@/lib/utils'

type TabsVariant = 'default' | 'underline'
type TabsSize = SegmentedControlSize

interface TabsListContextValue {
  size: TabsSize
  variant: TabsVariant
}

const TabsListContext: React.Context<TabsListContextValue> = React.createContext<TabsListContextValue>({
  size: 'default',
  variant: 'default',
})

// The active tab paints its own state, like the segmented control, so switching
// is instant: there's no indicator sliding between tabs.
const activeTabClassNames: Record<TabsVariant, string> = {
  default:
    'data-active:bg-background data-active:shadow-sm/5 data-active:hover:bg-background dark:data-active:bg-input dark:data-active:hover:bg-input',
  // A bar on the list's edge: past the list's 1-unit padding, 1px out.
  underline:
    'data-active:after:absolute data-active:after:bg-primary data-[orientation=horizontal]:data-active:after:inset-x-0 data-[orientation=horizontal]:data-active:after:-bottom-[calc(--spacing(1)+1px)] data-[orientation=horizontal]:data-active:after:h-0.5 data-[orientation=vertical]:data-active:after:inset-y-0 data-[orientation=vertical]:data-active:after:-start-[calc(--spacing(1)+1px)] data-[orientation=vertical]:data-active:after:w-0.5',
}

export function Tabs({ className, ...props }: TabsPrimitive.Root.Props): React.ReactElement {
  return (
    <TabsPrimitive.Root
      className={cn('flex flex-col gap-4 data-[orientation=vertical]:flex-row', className)}
      data-slot="tabs"
      {...props}
    />
  )
}

export function TabsList({
  variant = 'default',
  size = 'default',
  className,
  children,
  ...props
}: TabsPrimitive.List.Props & {
  size?: TabsSize
  variant?: TabsVariant
}): React.ReactElement {
  const context = React.useMemo(() => ({ size, variant }), [size, variant])

  return (
    <TabsPrimitive.List
      className={cn(
        'relative flex w-fit items-center justify-center-safe gap-x-0.5 text-muted-foreground',
        'max-w-full overflow-x-auto',
        'data-[orientation=vertical]:flex-col',
        variant === 'default'
          ? 'rounded-lg bg-muted p-0.5 text-muted-foreground/72'
          : 'data-[orientation=horizontal]:py-1 data-[orientation=vertical]:px-1 *:data-[slot=tabs-tab]:not-data-active:hover:bg-accent',
        className,
      )}
      data-size={size}
      data-slot="tabs-list"
      {...props}
    >
      <TabsListContext.Provider value={context}>{children}</TabsListContext.Provider>
    </TabsPrimitive.List>
  )
}

export function TabsTab({
  className,
  size,
  ...props
}: TabsPrimitive.Tab.Props & {
  size?: TabsSize
}): React.ReactElement {
  const { size: contextSize, variant } = React.useContext(TabsListContext)
  const resolvedSize: TabsSize = size ?? contextSize

  return (
    <TabsPrimitive.Tab
      className={cn(
        'relative flex shrink-0 grow cursor-pointer items-center justify-center rounded-md border border-transparent text-base font-medium whitespace-nowrap outline-none hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start sm:text-sm data-disabled:pointer-events-none data-disabled:opacity-64 data-active:text-foreground data-active:hover:text-foreground',
        segmentedControlItemLayoutClassName,
        segmentedControlItemSizeClassNames[resolvedSize],
        activeTabClassNames[variant],
        className,
      )}
      data-size={resolvedSize}
      data-slot="tabs-tab"
      {...props}
    />
  )
}

export function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props): React.ReactElement {
  return (
    <TabsPrimitive.Panel
      className={cn('flex-1 outline-none', className)}
      data-slot="tabs-content"
      {...props}
    />
  )
}

export { TabsPrimitive, TabsTab as TabsTrigger, TabsPanel as TabsContent, type TabsSize, type TabsVariant }

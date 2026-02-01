import { cn } from '@/lib/utils'

function Frame({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'relative flex flex-col overflow-clip rounded-2xl bg-muted/75 p-1',
        '*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:mt-1',
        className,
      )}
      data-slot="frame"
      {...props}
    />
  )
}

function FramePanel({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('relative rounded-xl border bg-background bg-clip-padding p-5 shadow-xs', className)}
      data-slot="frame-panel"
      {...props}
    />
  )
}

function FrameHeader({ className, ...props }: React.ComponentProps<'header'>) {
  return (
    <header className={cn('flex flex-col px-5 py-4', className)} data-slot="frame-panel-header" {...props} />
  )
}

function FrameTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('font-medium text-sm leading-none', className)}
      data-slot="frame-panel-title"
      {...props}
    />
  )
}

function FrameDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-muted-foreground text-sm', className)}
      data-slot="frame-panel-description"
      {...props}
    />
  )
}

function FrameFooter({ className, ...props }: React.ComponentProps<'footer'>) {
  return <footer className={cn('px-5 py-4', className)} data-slot="frame-panel-footer" {...props} />
}

export { Frame, FramePanel, FrameHeader, FrameTitle, FrameDescription, FrameFooter }

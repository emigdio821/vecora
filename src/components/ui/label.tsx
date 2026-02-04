import { cn } from '@/lib/utils'

function Label({ className, htmlFor, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      htmlFor={htmlFor}
      aria-label={props['aria-label']}
      data-slot="label"
      className={cn(
        'flex select-none items-center gap-2 font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-70',
        className,
      )}
      {...props}
    />
  )
}

export { Label }

import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-4xl border border-transparent px-2 py-0.5 font-medium text-xs outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a,button]:hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground [a,button]:hover:bg-secondary/80',
        destructive:
          'bg-destructive/10 text-destructive-foreground focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a,button]:hover:bg-destructive/20',
        outline:
          'border-border text-foreground [a,button]:hover:bg-muted [a,button]:hover:text-muted-foreground',
        ghost: 'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
        link: 'text-primary underline-offset-4 hover:underline',
        info: 'bg-info/10 text-info-foreground focus-visible:ring-info/20 dark:bg-info/20 dark:focus-visible:ring-info/40 [a,button]:hover:bg-info/20',
        success:
          'bg-success/10 text-success-foreground focus-visible:ring-success/20 dark:bg-success/20 dark:focus-visible:ring-success/40 [a,button]:hover:bg-success/20',
        warning:
          'bg-warning/10 text-warning-foreground focus-visible:ring-warning/20 dark:bg-warning/20 dark:focus-visible:ring-warning/40 [a,button]:hover:bg-warning/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type BadgeProps = useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>

function Badge({ className, variant = 'default', render, ...props }: BadgeProps) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ className, variant })),
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  })
}

export { Badge, type BadgeProps, badgeVariants }

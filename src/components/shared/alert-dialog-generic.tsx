import { IconAlertTriangle } from '@tabler/icons-react'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LoaderIcon } from '../icons'

interface AlertDialogGenericProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
  action?: () => void | Promise<void>
  title?: React.ReactNode
  description?: React.ReactNode
  actionLabel?: React.ReactNode
  variant?: ButtonProps['variant']
  content?: React.ReactNode
}

export function AlertDialogGeneric(props: AlertDialogGenericProps) {
  const { action, title, description, state, actionLabel, variant, content } = props
  const { isOpen, onOpenChange } = state
  const [isExecutingAction, setExecutingAction] = useState(false)

  async function handleAction() {
    if (action) {
      setExecutingAction(true)
      try {
        await action()
      } catch (error) {
        console.error('Error executing action:', error)
        throw error
      } finally {
        setExecutingAction(false)
      }
    } else {
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(isOPen) => {
        if (isExecutingAction) return
        onOpenChange(isOPen)
      }}
    >
      <AlertDialogContent className="sm:max-w-sm">
        <div className="flex items-center justify-center p-4 pb-0 sm:justify-normal">
          <div
            className={cn('flex rounded-md bg-muted p-2 text-muted-foreground', {
              'bg-info/10 text-info-foreground': variant === 'info',
              'bg-warning/10 text-warning-foreground': variant === 'warning',
              'bg-destructive/10 text-destructive-foreground': variant === 'destructive',
            })}
          >
            <IconAlertTriangle className="size-6" />
          </div>
        </div>
        <AlertDialogHeader>
          <AlertDialogTitle>{title || '¿Proceder?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {description || 'Esta acción no se puede deshacer.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {content && <div className="px-4 pb-4">{content}</div>}
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" disabled={isExecutingAction} />}>
            Cancelar
          </AlertDialogClose>
          <Button variant={variant} onClick={handleAction} disabled={isExecutingAction}>
            {actionLabel || 'Proceder'}
            {isExecutingAction && <LoaderIcon />}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

import { IconAlertTriangle } from '@tabler/icons-react'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia
            className={cn({
              'bg-warning/10 text-warning-foreground': variant === 'warning',
              'bg-info/10 text-info-foreground': variant === 'info',
              'bg-destructive/10 text-destructive-foreground': variant === 'destructive',
            })}
          >
            <IconAlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>{title || '¿Proceder?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {description || 'Esta acción no se puede deshacer.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {content}
        <AlertDialogFooter>
          <AlertDialogCancel render={<Button variant="outline" disabled={isExecutingAction} />}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction variant={variant} onClick={handleAction} disabled={isExecutingAction}>
            {actionLabel || 'Proceder'}
            {isExecutingAction && <LoaderIcon />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

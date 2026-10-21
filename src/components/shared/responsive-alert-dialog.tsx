import { createContext, useContext } from 'react'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPanel,
  AlertDialogPopup,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

// An AlertDialog on desktop and a bottom Drawer on mobile, like ResponsiveDialog:
// opened from another drawer, it stacks on it. The Drawer keeps what makes it an
// alert: an outside press doesn't dismiss it, and screen readers hear "alertdialog".

const IsDrawerContext = createContext(false)

export interface ResponsiveAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean, eventDetails: { cancel: () => void }) => void
  onOpenChangeComplete?: (open: boolean) => void
  children: React.ReactNode
}

export function ResponsiveAlertDialog(props: ResponsiveAlertDialogProps) {
  const isMobile = useIsMobile()

  return (
    <IsDrawerContext.Provider value={isMobile}>
      {isMobile ? <Drawer disablePointerDismissal {...props} /> : <AlertDialog {...props} />}
    </IsDrawerContext.Provider>
  )
}

interface PartProps {
  className?: string
  children?: React.ReactNode
}

export function ResponsiveAlertDialogPopup(props: PartProps) {
  return useContext(IsDrawerContext) ? (
    <DrawerPopup showBar role="alertdialog" {...props} />
  ) : (
    <AlertDialogPopup {...props} />
  )
}

export function ResponsiveAlertDialogHeader(props: PartProps) {
  return useContext(IsDrawerContext) ? <DrawerHeader {...props} /> : <AlertDialogHeader {...props} />
}

export function ResponsiveAlertDialogTitle(props: PartProps) {
  return useContext(IsDrawerContext) ? <DrawerTitle {...props} /> : <AlertDialogTitle {...props} />
}

export function ResponsiveAlertDialogDescription(props: PartProps) {
  return useContext(IsDrawerContext) ? (
    <DrawerDescription {...props} />
  ) : (
    <AlertDialogDescription {...props} />
  )
}

/** A list or other content under the header, which then gets a border. Scrolls itself, so a max height caps it. */
export function ResponsiveAlertDialogPanel({ className, ...props }: PartProps) {
  if (useContext(IsDrawerContext)) {
    // Not the drawer's own scroll wrapper: that one takes no class, so nothing could cap it.
    return (
      <DrawerPanel
        scrollable={false}
        className={cn('min-h-0 scroll-fade touch-auto overflow-y-auto overscroll-contain', className)}
        {...props}
      />
    )
  }

  return <AlertDialogPanel className={className} {...props} />
}

export function ResponsiveAlertDialogFooter(props: PartProps) {
  return useContext(IsDrawerContext) ? <DrawerFooter {...props} /> : <AlertDialogFooter {...props} />
}

interface ResponsiveAlertDialogCloseProps extends PartProps {
  render?: React.ReactElement
  disabled?: boolean
}

export function ResponsiveAlertDialogClose(props: ResponsiveAlertDialogCloseProps) {
  return useContext(IsDrawerContext) ? <DrawerClose {...props} /> : <AlertDialogClose {...props} />
}

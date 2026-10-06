import { createContext, useContext } from 'react'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
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

// A Dialog on desktop and a bottom Drawer on mobile, at the same breakpoint as
// the sidebar. Opened from the mobile sidebar (itself a Drawer), the Drawer
// stacks on it instead of covering it. Based on coss particle p-drawer-12; the
// parts below swap one for the other so the content is written once.

const IsDrawerContext = createContext(false)

interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean, eventDetails: { cancel: () => void }) => void
  children: React.ReactNode
}

export function ResponsiveDialog(props: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  return (
    <IsDrawerContext.Provider value={isMobile}>
      {isMobile ? <Drawer {...props} /> : <Dialog {...props} />}
    </IsDrawerContext.Provider>
  )
}

interface PartProps {
  className?: string
  children?: React.ReactNode
}

export function ResponsiveDialogPopup(props: PartProps) {
  return useContext(IsDrawerContext) ? <DrawerPopup showBar {...props} /> : <DialogPopup {...props} />
}

export function ResponsiveDialogHeader(props: PartProps) {
  return useContext(IsDrawerContext) ? <DrawerHeader {...props} /> : <DialogHeader {...props} />
}

export function ResponsiveDialogTitle(props: PartProps) {
  return useContext(IsDrawerContext) ? <DrawerTitle {...props} /> : <DialogTitle {...props} />
}

export function ResponsiveDialogDescription(props: PartProps) {
  return useContext(IsDrawerContext) ? <DrawerDescription {...props} /> : <DialogDescription {...props} />
}

export function ResponsiveDialogPanel(props: PartProps) {
  return useContext(IsDrawerContext) ? <DrawerPanel {...props} /> : <DialogPanel {...props} />
}

export function ResponsiveDialogFooter(props: PartProps) {
  return useContext(IsDrawerContext) ? <DrawerFooter {...props} /> : <DialogFooter {...props} />
}

interface ResponsiveDialogCloseProps extends PartProps {
  render?: React.ReactElement
  disabled?: boolean
}

export function ResponsiveDialogClose(props: ResponsiveDialogCloseProps) {
  return useContext(IsDrawerContext) ? <DrawerClose {...props} /> : <DialogClose {...props} />
}

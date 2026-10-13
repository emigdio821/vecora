import { IconFileDescription, IconFileText } from '@tabler/icons-react'
import { Link, useLocation } from '@tanstack/react-router'
import { useState } from 'react'
import { FinancialReportDialog } from '@/components/reports/dialog/financial-report'
import { m } from '@/paraglide/messages'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar'
import { LinkPendingIndicator } from './link-pending-indicator'

/** Open to every board member; the PDF routes check the role again. */
export function NavReports({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { setOpenMobile } = useSidebar()
  const [open, setOpen] = useState(false)

  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel>{m.common_section_reports()}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                setOpen(true)
              }}
            >
              <IconFileText className="size-4" />
              <span>{m.common_section_financial_report()}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                setOpenMobile(false)
              }}
              isActive={pathname === '/documents'}
              render={
                <Link to="/documents">
                  <IconFileDescription className="size-4" />
                  <span>{m.common_section_documents()}</span>
                  <LinkPendingIndicator to="/documents" />
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>

      <FinancialReportDialog open={open} onOpenChange={setOpen} />
    </SidebarGroup>
  )
}

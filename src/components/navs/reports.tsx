import { IconClipboardText, IconReportMoney } from '@tabler/icons-react'
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
      {/* Both make a PDF with the HOA's logo: the report from the books, the rest written here. */}
      <SidebarGroupLabel>{m.common_section_documents()}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                setOpen(true)
              }}
            >
              <IconReportMoney className="size-4" />
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
                  <IconClipboardText className="size-4" />
                  <span>{m.common_section_notices()}</span>
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

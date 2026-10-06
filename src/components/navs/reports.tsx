import { IconFileText } from '@tabler/icons-react'
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
} from '../ui/sidebar'

/** Open to every board member; the PDF route checks the role again. */
export function NavReports({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
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
        </SidebarMenu>
      </SidebarGroupContent>

      <FinancialReportDialog open={open} onOpenChange={setOpen} />
    </SidebarGroup>
  )
}

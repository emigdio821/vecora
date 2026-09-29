'use client'

import { FileTextIcon } from 'lucide-react'
import { useState } from 'react'
import { FinancialReportDialog } from '@/components/reports/dialog/financial-report'
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
      <SidebarGroupLabel>Reportes</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                setOpen(true)
              }}
            >
              <FileTextIcon className="size-4" />
              <span>Reporte financiero</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>

      <FinancialReportDialog open={open} onOpenChange={setOpen} />
    </SidebarGroup>
  )
}

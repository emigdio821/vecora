import { createFileRoute } from '@tanstack/react-router'
import { FinancialReportForm } from '@/components/reports/financial-report-form'
import { pageTitle } from '@/lib/metadata'
import { m } from '@/paraglide/messages'

// Open to every board member; the PDF route checks the role again.
export const Route = createFileRoute('/_authed/financial-report')({
  head: () => ({ meta: [{ title: pageTitle(m.common_section_financial_report()) }] }),
  component: FinancialReportPage,
})

function FinancialReportPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-base font-semibold">{m.common_section_financial_report()}</h1>
        <p className="text-sm text-muted-foreground">{m.reports_page_description()}</p>
      </div>

      <FinancialReportForm />
    </>
  )
}

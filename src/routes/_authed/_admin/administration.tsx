import { createFileRoute } from '@tanstack/react-router'
import { AdministrationTabs } from '@/components/admin/administration-tabs'
import { AuditLogsSectionContent } from '@/components/admin/audit-logs/section-content'
import { createSEOTitle } from '@/lib/seo'

export const Route = createFileRoute('/_authed/_admin/administration')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: createSEOTitle('Administración') }],
  }),
})

function RouteComponent() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h4 className="font-heading font-medium text-lg leading-none">Administración</h4>
        <p className="text-muted-foreground text-sm">
          En esta sección puedes administrar los propietarios, casas, infracciones, pagos y usuarios externos.
        </p>
      </div>

      <AuditLogsSectionContent />
      <AdministrationTabs />
    </>
  )
}

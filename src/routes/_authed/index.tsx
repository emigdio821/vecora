import { createFileRoute } from '@tanstack/react-router'
import { HomeNotifications } from '@/components/home/notifications'
// import { StatsChart } from '@/components/home/stats-chart'
import { createSEOTitle } from '@/lib/seo'

export const Route = createFileRoute('/_authed/')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: createSEOTitle('Inicio') }],
  }),
})

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h4 className="font-heading font-medium text-lg leading-none">Notificaciones</h4>
        <p className="text-muted-foreground text-sm">
          Información relevante como pagos, avisos, entre otros aparecerá aquí.
        </p>
        <div className="mt-2">
          <HomeNotifications />
        </div>
      </section>
      <section>
        <h4 className="font-heading font-medium text-lg leading-none">Gráficas</h4>
        <p className="text-muted-foreground text-sm">
          Gráficas representativas relacionadas a los pagos, dinero en el "colchón" y gastos.
        </p>
      </section>
    </div>
  )
}

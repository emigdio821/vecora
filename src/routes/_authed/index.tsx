import { createFileRoute } from '@tanstack/react-router'
import { ExpensesChart } from '@/components/home/charts/expenses'
import { PaymentsChart } from '@/components/home/charts/payments'
import { SavingsChart } from '@/components/home/charts/savings'
import { HomeNotifications } from '@/components/home/notifications'
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
        <HomeNotifications />
        {/* <h4 className="font-heading font-medium text-lg leading-none">Notificaciones</h4>
        <p className="text-muted-foreground text-sm">
          Información relevante como pagos, avisos, entre otros aparecerá aquí.
        </p> */}

        {/* <div className="mt-2">
          <HomeNotifications />
        </div> */}
      </section>
      <section>
        <PaymentsChart />
        {/* <h4 className="font-heading font-medium text-lg leading-none">Gráficas</h4>
        <p className="text-muted-foreground text-sm">
          Gráficas representativas relacionadas a los pagos, gastos y ahorros.
        </p> */}

        {/* <div className="mt-2 space-y-4">
          <PaymentsChart />
          <ExpensesChart />
          <SavingsChart />
        </div> */}
      </section>
      <section>
        <ExpensesChart />
      </section>
      <section>
        <SavingsChart />
      </section>
    </div>
  )
}

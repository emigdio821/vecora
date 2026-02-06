import { createFileRoute } from '@tanstack/react-router'
// import { ExpensesChart } from '@/components/home/charts/expenses'
import { PaymentsChart } from '@/components/home/charts/payments'
// import { SavingsChart } from '@/components/home/charts/savings'
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
      </section>
      <section>
        <PaymentsChart />
      </section>
      {/* <section>
        <ExpensesChart />
      </section>
      <section>
        <SavingsChart />
      </section> */}
    </div>
  )
}

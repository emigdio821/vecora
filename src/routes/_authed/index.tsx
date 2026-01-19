import { createFileRoute } from '@tanstack/react-router'
import { NotesSection } from '@/components/home/notes-section'
import { StatsChart } from '@/components/home/stats-chart'
import { createSEOTitle } from '@/lib/seo'

export const Route = createFileRoute('/_authed/')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: createSEOTitle('Inicio') }],
  }),
})

function RouteComponent() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <NotesSection />
          <StatsChart />
        </div>
      </div>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useQueryState } from 'nuqs'
import { HoaMembersDataTable } from '@/components/hoa-board/members/table/data-table'
import { HoaPeriodsDataTable } from '@/components/hoa-board/periods/table/data-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const Route = createFileRoute('/_authed/hoa-board')({
  component: RouteComponent,
})

function RouteComponent() {
  const [tab, setTab] = useQueryState('tab', {
    defaultValue: 'hoa-board-members',
  })

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading font-medium text-lg leading-none">Mesa directiva</h1>
      <p className="text-muted-foreground text-sm">
        En esta sección puedes ver a los miembros, así como los periodos de la mesa directiva.
      </p>

      <Tabs value={tab} onValueChange={(value) => setTab(value)}>
        <TabsList className="flex justify-start overflow-hidden overflow-x-auto sm:w-fit sm:justify-center">
          <TabsTrigger value="hoa-board-members">Miembros</TabsTrigger>
          <TabsTrigger value="hoa-board-periods">Periodos</TabsTrigger>
        </TabsList>

        <TabsContent value="hoa-board-members">
          <HoaMembersDataTable />
        </TabsContent>

        <TabsContent value="hoa-board-periods">
          <HoaPeriodsDataTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

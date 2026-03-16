import { useQueryState } from 'nuqs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HousesDataTable } from './houses/table/data-table'
import { PaymentsDataTable } from './payments/table/data-table'
import { ViolationsDataTable } from './violations/table/data-table'

export function AdminResidentialTabs() {
  const [tab, setTab] = useQueryState('tab', {
    defaultValue: 'owners',
  })

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value)}>
      <TabsList className="flex justify-start overflow-hidden overflow-x-auto sm:w-fit sm:justify-center">
        <TabsTrigger value="residents">Residentes</TabsTrigger>
        <TabsTrigger value="houses">Casas</TabsTrigger>
        <TabsTrigger value="violations">Infracciones</TabsTrigger>
        <TabsTrigger value="payments">Pagos</TabsTrigger>
      </TabsList>

      {/*<TabsContent value="residents" keepMounted>
        <ResidentsDataTable />
      </TabsContent>*/}

      <TabsContent value="houses" keepMounted>
        <HousesDataTable />
      </TabsContent>

      <TabsContent value="violations">
        <ViolationsDataTable />
      </TabsContent>

      <TabsContent value="payments" keepMounted>
        <PaymentsDataTable />
      </TabsContent>
    </Tabs>
  )
}

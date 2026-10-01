import { useQueryState } from 'nuqs'
import { Tabs, TabsList, TabsPanel, TabsTab } from '../ui/tabs'
import { HallReservationsDataTable } from './hall/table/data-table'
import { PeriodsDataTable } from './periods/table/data-table'

export function PresidencyMainTabs() {
  const [tab, setTab] = useQueryState('tab', { defaultValue: 'periods' })

  return (
    <Tabs
      defaultValue="periods"
      value={tab}
      onValueChange={(value) => {
        void setTab(value)
      }}
    >
      <TabsList>
        <TabsTab value="periods">Periodos</TabsTab>
        <TabsTab value="hall">Terraza</TabsTab>
      </TabsList>
      <TabsPanel value="periods" keepMounted>
        <PeriodsDataTable />
      </TabsPanel>
      <TabsPanel value="hall" keepMounted>
        <HallReservationsDataTable />
      </TabsPanel>
    </Tabs>
  )
}

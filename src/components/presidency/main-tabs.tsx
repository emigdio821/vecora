import { useQueryState } from 'nuqs'
import { Tabs, TabsList, TabsPanel, TabsTab } from '../ui/tabs'
import { AmenitiesDataTable } from './amenities/table/data-table'
import { PeriodsDataTable } from './periods/table/data-table'
import { ReservationsDataTable } from './reservations/table/data-table'

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
        <TabsTab value="reservations">Reservaciones</TabsTab>
        <TabsTab value="amenities">Áreas comunes</TabsTab>
      </TabsList>
      <TabsPanel value="periods">
        <PeriodsDataTable />
      </TabsPanel>
      <TabsPanel value="reservations">
        <ReservationsDataTable />
      </TabsPanel>
      <TabsPanel value="amenities">
        <AmenitiesDataTable />
      </TabsPanel>
    </Tabs>
  )
}

import { useQueryState } from 'nuqs'
import { m } from '@/paraglide/messages'
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
        <TabsTab value="periods">{m.common_section_periods()}</TabsTab>
        <TabsTab value="reservations">{m.common_section_reservations()}</TabsTab>
        <TabsTab value="amenities">{m.common_section_amenities()}</TabsTab>
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

'use client'

import { useQueryState } from 'nuqs'
import { Tabs, TabsList, TabsPanel, TabsTab } from '../ui/tabs'
import { PeriodsDataTable } from './periods/table/data-table'

export function PresidencyMainTabs() {
  const [tab, setTab] = useQueryState('tab', { defaultValue: 'periods' })

  return (
    <Tabs defaultValue="periods" value={tab} onValueChange={(value) => setTab(value)}>
      <TabsList>
        <TabsTab value="periods">Periodos</TabsTab>
      </TabsList>
      <TabsPanel value="periods" keepMounted>
        <PeriodsDataTable />
      </TabsPanel>
    </Tabs>
  )
}

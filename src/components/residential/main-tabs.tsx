'use client'

import { useQueryState } from 'nuqs'
import { HousesDataTable } from '../houses/table/data-table'
import { ResidentsDataTable } from '../residents/table/data-table'
import { Tabs, TabsList, TabsPanel, TabsTab } from '../ui/tabs'

export function ResidentialMainTabs() {
  const [tab, setTab] = useQueryState('tab', { defaultValue: 'houses' })

  return (
    <Tabs defaultValue="houses" value={tab} onValueChange={(value) => setTab(value)}>
      <TabsList>
        <TabsTab value="houses">Casas</TabsTab>
        <TabsTab value="residents">Residentes</TabsTab>
      </TabsList>
      <TabsPanel value="houses" keepMounted>
        <HousesDataTable />
      </TabsPanel>
      <TabsPanel value="residents" keepMounted>
        <ResidentsDataTable />
      </TabsPanel>
    </Tabs>
  )
}

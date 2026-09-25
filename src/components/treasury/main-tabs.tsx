'use client'

import { useQueryState } from 'nuqs'
import { Tabs, TabsList, TabsPanel, TabsTab } from '../ui/tabs'
import { TransactionsDataTable } from './transactions/table/data-table'

export function TreasuryMainTabs() {
  const [tab, setTab] = useQueryState('tab', { defaultValue: 'transactions' })

  return (
    <Tabs defaultValue="transactions" value={tab} onValueChange={(value) => setTab(value)}>
      <TabsList>
        <TabsTab value="transactions">Movimientos</TabsTab>
      </TabsList>
      <TabsPanel value="transactions" keepMounted>
        <TransactionsDataTable />
      </TabsPanel>
    </Tabs>
  )
}

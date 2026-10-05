import { useQueryState } from 'nuqs'
import { Tabs, TabsList, TabsPanel, TabsTab } from '../ui/tabs'
import { CategoriesDataTable } from './categories/table/data-table'
import { TransactionsDataTable } from './transactions/table/data-table'

export function TreasuryMainTabs() {
  const [tab, setTab] = useQueryState('tab', { defaultValue: 'transactions' })

  return (
    <Tabs
      defaultValue="transactions"
      value={tab}
      onValueChange={(value) => {
        void setTab(value)
      }}
    >
      <TabsList>
        <TabsTab value="transactions">Movimientos</TabsTab>
        <TabsTab value="categories">Categorías</TabsTab>
      </TabsList>
      <TabsPanel value="transactions">
        <TransactionsDataTable />
      </TabsPanel>
      <TabsPanel value="categories">
        <CategoriesDataTable />
      </TabsPanel>
    </Tabs>
  )
}

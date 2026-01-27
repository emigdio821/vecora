import { useQueryState } from 'nuqs'
import { OwnersTabContent } from '@/components/admin/owners/owners-tab-content'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HousesTabContent } from './houses/houses-tab-content'
import { PaymentsTabContent } from './payments/payments-tab-content'
import { ViolationsTabContent } from './violations/violations-tab-content'

export function AdminResidentialTabs() {
  const [tab, setTab] = useQueryState('tab', {
    defaultValue: 'owners',
  })

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value)}>
      <TabsList className="flex w-full justify-start overflow-hidden overflow-x-auto sm:w-fit sm:justify-center">
        <TabsTrigger value="owners">Propietarios</TabsTrigger>
        <TabsTrigger value="houses">Casas</TabsTrigger>
        <TabsTrigger value="violations">Infracciones</TabsTrigger>
        <TabsTrigger value="payments">Pagos</TabsTrigger>
      </TabsList>

      <TabsContent value="owners" keepMounted>
        <OwnersTabContent />
      </TabsContent>

      <TabsContent value="houses" keepMounted>
        <HousesTabContent />
      </TabsContent>

      <TabsContent value="violations">
        <ViolationsTabContent />
      </TabsContent>

      <TabsContent value="payments" keepMounted>
        <PaymentsTabContent />
      </TabsContent>
    </Tabs>
  )
}

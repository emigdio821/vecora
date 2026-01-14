import { useQueryState } from 'nuqs'
import { ExternalUsersTab } from '@/components/admin/external-users/external-users-tab'
import { OwnersTab } from '@/components/admin/owners/owners-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HousesTab } from './houses/houses-tab'
import { PaymentsTab } from './payments/payments-tab'
import { ViolationsTab } from './violations/violations-tab'

export function AdministrationTabs() {
  const [tab, setTab] = useQueryState('tab', {
    defaultValue: 'owners',
  })

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value)}>
      <TabsList>
        <TabsTrigger value="owners">Propietarios</TabsTrigger>
        <TabsTrigger value="external-users">Usuarios externos</TabsTrigger>
        <TabsTrigger value="houses">Casas</TabsTrigger>
        <TabsTrigger value="violations">Infracciones</TabsTrigger>
        <TabsTrigger value="payments">Pagos</TabsTrigger>
      </TabsList>

      <TabsContent value="owners">
        <OwnersTab />
      </TabsContent>

      <TabsContent value="external-users">
        <ExternalUsersTab />
      </TabsContent>

      <TabsContent value="houses">
        <HousesTab />
      </TabsContent>

      <TabsContent value="violations">
        <ViolationsTab />
      </TabsContent>

      <TabsContent value="payments">
        <PaymentsTab />
      </TabsContent>
    </Tabs>
  )
}

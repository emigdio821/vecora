import { useQueryState } from 'nuqs'
import { ExternalUsersTabContent } from '@/components/admin/external-users/external-users-tab-content'
import { OwnersTabContent } from '@/components/admin/owners/owners-tab-content'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AuditLogsTabContent } from './audit-logs/audit-logs-tab-content'
import { HousesTabContent } from './houses/houses-tab-content'
import { PaymentsTabContent } from './payments/payments-tab-content'
import { ViolationsTabContent } from './violations/violations-tab-content'

export function AdministrationTabs() {
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
        <TabsTrigger value="external-users">Usuarios externos</TabsTrigger>
        <TabsTrigger value="audit-logs">Auditoría</TabsTrigger>
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

      <TabsContent value="external-users" keepMounted>
        <ExternalUsersTabContent />
      </TabsContent>

      <TabsContent value="audit-logs" keepMounted>
        <AuditLogsTabContent />
      </TabsContent>
    </Tabs>
  )
}

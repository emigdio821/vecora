import { useQueryState } from 'nuqs'
import { ExternalUsersTabContent } from '@/components/admin/external-users/external-users-tab-content'
import { OwnersTabContent } from '@/components/admin/owners/owners-tab-content'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
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
        <TabsTab value="owners">Propietarios</TabsTab>
        <TabsTab value="houses">Casas</TabsTab>
        <TabsTab value="violations">Infracciones</TabsTab>
        <TabsTab value="payments">Pagos</TabsTab>
        <TabsTab value="external-users">Usuarios externos</TabsTab>
        <TabsTab value="audit-logs">Auditoría</TabsTab>
      </TabsList>

      <TabsPanel value="owners" keepMounted>
        <OwnersTabContent />
      </TabsPanel>

      <TabsPanel value="houses" keepMounted>
        <HousesTabContent />
      </TabsPanel>

      <TabsPanel value="violations">
        <ViolationsTabContent />
      </TabsPanel>

      <TabsPanel value="payments" keepMounted>
        <PaymentsTabContent />
      </TabsPanel>

      <TabsPanel value="external-users" keepMounted>
        <ExternalUsersTabContent />
      </TabsPanel>

      <TabsPanel value="audit-logs" keepMounted>
        <AuditLogsTabContent />
      </TabsPanel>
    </Tabs>
  )
}

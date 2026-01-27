import { useQueryState } from 'nuqs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExternalUsersTabContent } from './external-users/external-users-tab-content'
import { HoaBoardTabContent } from './hoa-board/hoa-board-tab-content'
import { UsersTabContent } from './users/users-tab-content'

export function AdminUsersTabs() {
  const [tab, setTab] = useQueryState('tab', {
    defaultValue: 'users',
  })

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value)}>
      <TabsList className="flex w-full justify-start overflow-hidden overflow-x-auto sm:w-fit sm:justify-center">
        <TabsTrigger value="users">Usuarios</TabsTrigger>
        <TabsTrigger value="external-users">Usuarios externos</TabsTrigger>
        <TabsTrigger value="hoa-board">Mesa directiva</TabsTrigger>
      </TabsList>

      <TabsContent value="users" keepMounted>
        <UsersTabContent />
      </TabsContent>

      <TabsContent value="external-users" keepMounted>
        <ExternalUsersTabContent />
      </TabsContent>

      <TabsContent value="hoa-board" keepMounted>
        <HoaBoardTabContent />
      </TabsContent>
    </Tabs>
  )
}

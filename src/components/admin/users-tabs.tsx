import { useQueryState } from 'nuqs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExternalUsersDataTable } from './external-users/table/data-table'
import { HoaBoardDataTable } from './hoa-board/table/data-table'
import { ProfilesDataTable } from './profiles/table/data-table'

export function AdminUsersTabs() {
  const [tab, setTab] = useQueryState('tab', {
    defaultValue: 'profiles',
  })

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value)}>
      <TabsList className="flex w-full justify-start overflow-hidden overflow-x-auto sm:w-fit sm:justify-center">
        <TabsTrigger value="profiles">Perfiles</TabsTrigger>
        <TabsTrigger value="external-users">Usuarios externos</TabsTrigger>
        <TabsTrigger value="hoa-board">Mesa directiva</TabsTrigger>
      </TabsList>

      <TabsContent value="profiles" keepMounted>
        <ProfilesDataTable />
      </TabsContent>

      <TabsContent value="external-users" keepMounted>
        <ExternalUsersDataTable />
      </TabsContent>

      <TabsContent value="hoa-board" keepMounted>
        <HoaBoardDataTable />
      </TabsContent>
    </Tabs>
  )
}

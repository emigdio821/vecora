import { useQueryState } from 'nuqs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfilesDataTable } from './profiles/table/data-table'

export function AdminUsersTabs() {
  const [tab, setTab] = useQueryState('tab', {
    defaultValue: 'profiles',
  })

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value)}>
      <TabsList className="flex justify-start overflow-hidden overflow-x-auto sm:w-fit sm:justify-center">
        <TabsTrigger value="profiles">Perfiles</TabsTrigger>
        <TabsTrigger value="external-users">Usuarios externos</TabsTrigger>
      </TabsList>

      <TabsContent value="profiles" keepMounted>
        <ProfilesDataTable />
      </TabsContent>
    </Tabs>
  )
}

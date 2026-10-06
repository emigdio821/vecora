import {
  IconCalendarPlus,
  IconHistory,
  IconHome,
  IconNotes,
  IconPhone,
  IconUserCircle,
} from '@tabler/icons-react'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { CollapsibleSection, Detail, Muted, Timestamp } from '@/components/shared/details'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from '@/components/ui/drawer'
import { m } from '@/paraglide/messages'
import type { ResidentQueryData } from '@/tanstack-queries/residents'
import { EditResidentDrawer } from './edit-resident'

type Relationship = ResidentQueryData['property_residents'][number]['relationship']

const RELATIONSHIP_LABEL: Record<Relationship, string> = {
  get owner() {
    return m.common_relationship_owner()
  },
  get tenant() {
    return m.common_relationship_tenant()
  },
  get family() {
    return m.common_relationship_family()
  },
}

interface ResidentDetailsDrawerProps extends React.ComponentProps<typeof Drawer> {
  resident: ResidentQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResidentDetailsDrawer({
  resident,
  open,
  onOpenChange,
  ...props
}: ResidentDetailsDrawerProps) {
  const canManage = useHasRole('president')
  const [isEditOpen, setEditOpen] = useState(false)
  const fullName = `${resident.first_name} ${resident.last_name}`
  const roles = resident.profile?.user_roles.map((r) => r.role) ?? []

  return (
    <Drawer position="right" open={open} onOpenChange={onOpenChange} {...props}>
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>{fullName}</DrawerTitle>
          <DrawerDescription>{m.residential_resident_info()}</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel className="grid gap-3">
          <CollapsibleSection icon={<IconPhone />} title={m.residential_section_contact()}>
            <Detail label={m.common_field_phone()}>
              <a className="hover:underline" href={`tel:${resident.phone}`}>
                {resident.phone}
              </a>
            </Detail>
            <Detail label={m.common_field_email()}>
              {resident.email ? (
                <a className="hover:underline" href={`mailto:${resident.email}`}>
                  {resident.email}
                </a>
              ) : (
                <Muted>{m.residential_no_email()}</Muted>
              )}
            </Detail>
          </CollapsibleSection>

          <CollapsibleSection
            icon={<IconHome />}
            title={m.common_section_houses()}
            count={resident.property_residents.length}
          >
            {resident.property_residents.length ? (
              <ul className="grid gap-2">
                {resident.property_residents.map(({ property, relationship }) => (
                  <li key={property.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{property.number}</span>
                    <Badge variant="outline">{RELATIONSHIP_LABEL[relationship]}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <Muted>{m.residential_resident_no_houses()}</Muted>
            )}
          </CollapsibleSection>

          <CollapsibleSection icon={<IconUserCircle />} title={m.residential_section_account()}>
            {resident.profile ? (
              <>
                <Detail label={m.residential_account_name()}>
                  {resident.profile.full_name || <Muted>{m.residential_no_name()}</Muted>}
                </Detail>
                <Detail label={m.residential_roles()}>
                  {roles.length ? (
                    <div className="flex flex-wrap gap-1">
                      {roles.map((role) => (
                        <RoleNameBadge key={role} roleName={role} />
                      ))}
                    </div>
                  ) : (
                    <Badge variant="warning">{m.residential_no_role()}</Badge>
                  )}
                </Detail>
              </>
            ) : (
              <Muted>{m.residential_no_app_access()}</Muted>
            )}
          </CollapsibleSection>

          {resident.notes && (
            <CollapsibleSection icon={<IconNotes />} title={m.common_field_notes()}>
              <p className="text-sm whitespace-pre-wrap">{resident.notes}</p>
            </CollapsibleSection>
          )}

          <dl className="grid grid-cols-2 gap-3 px-1 pt-1">
            <Timestamp
              icon={<IconCalendarPlus />}
              label={m.residential_created_masculine()}
              value={resident.created_at}
            />
            <Timestamp
              icon={<IconHistory />}
              label={m.residential_updated_masculine()}
              value={resident.updated_at}
            />
          </dl>
        </DrawerPanel>

        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost" />}>{m.common_action_close()}</DrawerClose>
          {canManage && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditOpen(true)
                }}
              >
                {m.common_action_edit()}
              </Button>
              {/* Rendered inside this popup so Base UI treats it as a nested drawer. */}
              <EditResidentDrawer resident={resident} open={isEditOpen} onOpenChange={setEditOpen} />
            </>
          )}
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

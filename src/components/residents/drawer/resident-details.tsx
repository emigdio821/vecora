'use client'

import {
  CalendarPlusIcon,
  HistoryIcon,
  HouseIcon,
  NotebookPenIcon,
  PhoneIcon,
  UserRoundIcon,
} from 'lucide-react'
import { useState } from 'react'
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
import type { ResidentQueryData } from '@/tanstack-queries/residents'
import { EditResidentDrawer } from './edit-resident'

type Relationship = ResidentQueryData['property_residents'][number]['relationship']

const RELATIONSHIP_LABEL: Record<Relationship, string> = {
  owner: 'Propietario',
  tenant: 'Inquilino',
  family: 'Familiar',
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
  const [isEditOpen, setEditOpen] = useState(false)
  const fullName = `${resident.first_name} ${resident.last_name}`
  const roles = resident.profile?.user_roles.map((r) => r.role) ?? []

  return (
    <Drawer position="right" open={open} onOpenChange={onOpenChange} {...props}>
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>{fullName}</DrawerTitle>
          <DrawerDescription>Información del residente</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel className="grid gap-3">
          <CollapsibleSection icon={<PhoneIcon />} title="Contacto">
            <Detail label="Teléfono">
              <a className="hover:underline" href={`tel:${resident.phone}`}>
                {resident.phone}
              </a>
            </Detail>
            <Detail label="Correo">
              {resident.email ? (
                <a className="hover:underline" href={`mailto:${resident.email}`}>
                  {resident.email}
                </a>
              ) : (
                <Muted>Sin correo</Muted>
              )}
            </Detail>
          </CollapsibleSection>

          <CollapsibleSection icon={<HouseIcon />} title="Casas" count={resident.property_residents.length}>
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
              <Muted>No está asignado a ninguna casa.</Muted>
            )}
          </CollapsibleSection>

          <CollapsibleSection icon={<UserRoundIcon />} title="Cuenta">
            {resident.profile ? (
              <>
                <Detail label="Nombre en la cuenta">
                  {resident.profile.full_name || <Muted>Sin nombre</Muted>}
                </Detail>
                <Detail label="Roles">
                  {roles.length ? (
                    <div className="flex flex-wrap gap-1">
                      {roles.map((role) => (
                        <RoleNameBadge key={role} roleName={role} />
                      ))}
                    </div>
                  ) : (
                    <Badge variant="warning">Sin rol</Badge>
                  )}
                </Detail>
              </>
            ) : (
              <Muted>Este residente no tiene acceso a la aplicación.</Muted>
            )}
          </CollapsibleSection>

          {resident.notes && (
            <CollapsibleSection icon={<NotebookPenIcon />} title="Notas">
              <p className="text-sm whitespace-pre-wrap">{resident.notes}</p>
            </CollapsibleSection>
          )}

          <dl className="grid grid-cols-2 gap-3 px-1 pt-1">
            <Timestamp icon={<CalendarPlusIcon />} label="Creado" value={resident.created_at} />
            <Timestamp icon={<HistoryIcon />} label="Actualizado" value={resident.updated_at} />
          </dl>
        </DrawerPanel>

        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost" />}>Cerrar</DrawerClose>
          <Button
            variant="outline"
            onClick={() => {
              setEditOpen(true)
            }}
          >
            Editar
          </Button>
          {/* Rendered inside this popup so Base UI treats it as a nested drawer. */}
          <EditResidentDrawer resident={resident} open={isEditOpen} onOpenChange={setEditOpen} />
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

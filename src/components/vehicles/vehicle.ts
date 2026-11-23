import { IconCar, IconMotorbike, type TablerIcon } from '@tabler/icons-react'
import type { VehicleKind } from '@/lib/enums'
import { m } from '@/paraglide/messages'

export const VEHICLE_KIND_LABEL: Record<VehicleKind, string> = {
  get car() {
    return m.common_vehicle_kind_car()
  },
  get motorcycle() {
    return m.common_vehicle_kind_motorcycle()
  },
}

export const VEHICLE_KIND_ICON: Record<VehicleKind, TablerIcon> = {
  car: IconCar,
  motorcycle: IconMotorbike,
}

/** Options for the vehicle type Select, in display order. */
export const VEHICLE_KIND_ITEMS: { value: VehicleKind; label: string }[] = [
  {
    value: 'car',
    get label() {
      return VEHICLE_KIND_LABEL.car
    },
  },
  {
    value: 'motorcycle',
    get label() {
      return VEHICLE_KIND_LABEL.motorcycle
    },
  },
]

/** "RFY-420" and "rfy 420" compare equal, like the database's unique index. */
export function compactPlate(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

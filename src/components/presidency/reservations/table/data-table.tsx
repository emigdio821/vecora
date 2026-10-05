import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { DataTable } from '@/components/shared/table/data-table'
import { amenitiesQueryOptions, reservationsQueryOptions } from '@/tanstack-queries/presidency'
import { reservationsTableColumns } from './columns'
import { ReservationsDataTableHeader, useAmenityFilter } from './data-table-header'

export function ReservationsDataTable() {
  const reservations = useQuery(reservationsQueryOptions())
  const amenities = useQuery(amenitiesQueryOptions())
  const [amenityId] = useAmenityFilter()
  const isLoading = reservations.isLoading || amenities.isLoading

  // Filter the data (not a column) so pagination counts only the visible area.
  // An id from an old link that matches no area shows everything, like the header.
  const visible = useMemo(() => {
    const data = reservations.data ?? []
    const isKnown = amenities.data?.some((a) => a.id === amenityId)
    return isKnown ? data.filter((r) => r.amenity.id === amenityId) : data
  }, [reservations.data, amenities.data, amenityId])

  if (reservations.error || amenities.error) {
    return (
      <TanstackQueryError
        refetch={() => {
          void reservations.refetch()
          void amenities.refetch()
        }}
      />
    )
  }

  return (
    <DataTable
      data={visible}
      tableId="reservations"
      columns={reservationsTableColumns}
      getRowId={(reservation) => reservation.id}
      initialSorting={[{ id: 'reserved_on', desc: true }]}
      header={(table) => (
        <ReservationsDataTableHeader table={table} amenities={amenities.data ?? []} isLoading={isLoading} />
      )}
      emptyMessage={
        amenities.data?.length === 0
          ? 'Sin reservaciones. Agrega un área en "Áreas comunes" para empezar a reservar.'
          : 'Sin reservaciones.'
      }
      isLoading={isLoading}
    />
  )
}

import { queryOptions } from '@tanstack/react-query'
import { fetchVehicles } from '@/server-actions/vehicles'

export const VEHICLES_QUERY_KEY = 'vehicles'

export type VehicleQueryData = Awaited<ReturnType<typeof fetchVehicles>>[number]

export const vehiclesListQueryOptions = queryOptions({
  queryKey: [VEHICLES_QUERY_KEY],
  queryFn: () => fetchVehicles(),
})

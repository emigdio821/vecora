import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

interface EntityMutationConfig<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  invalidateKeys: string[]
  successTitle: React.ReactNode
  successDescription: React.ReactNode
  errorTitle?: React.ReactNode
  errorDescription?: React.ReactNode
  onSuccess?: (data: TData) => void
  onError?: (error: Error) => void
}

export function useEntityMutation<TData = unknown, TVariables = unknown>({
  mutationFn,
  invalidateKeys,
  successTitle,
  successDescription,
  errorTitle = 'Error',
  errorDescription = 'Ocurrió un error, intenta nuevamente',
  onSuccess: customOnSuccess,
  onError: customOnError,
}: EntityMutationConfig<TData, TVariables>) {
  const queryClient = useQueryClient()

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (data) => {
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      toast.success(successTitle, {
        description: successDescription,
      })

      customOnSuccess?.(data)
    },
    onError: (error) => {
      toast.error(errorTitle, {
        description: errorDescription,
      })

      logger.error('Entity Mutation Error:', error)

      customOnError?.(error)
    },
  })
}

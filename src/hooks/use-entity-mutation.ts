import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toastManager } from '@/components/ui/toast'

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
  errorDescription = 'Ocurrió un error, intenta nuevamente.',
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

      toastManager.add({
        type: 'success',
        title: successTitle,
        description: successDescription,
      })

      customOnSuccess?.(data)
    },
    onError: (error) => {
      toastManager.add({
        type: 'error',
        title: errorTitle,
        description: errorDescription,
      })

      customOnError?.(error)
    },
  })
}

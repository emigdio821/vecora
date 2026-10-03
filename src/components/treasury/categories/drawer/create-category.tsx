import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { DrawerPrimitive } from '@/components/ui/drawer'
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
import { Form } from '@/components/ui/form'
import { toastManager } from '@/components/ui/toast'
import { type CategoryInput, categorySchema } from '@/lib/validations/treasury'
import { createCategory } from '@/server-actions/treasury'
import { TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'
import { KIND_LABEL } from '../../kind'
import { CategoryFormFields } from './category-form-fields'

const FORM_ID = 'create-category-form'

const DEFAULT_VALUES: CategoryInput = { kind: 'income', name: '' }

interface CreateCategoryDrawerProps extends React.ComponentProps<typeof Drawer> {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCategoryDrawer({ open, onOpenChange, ...props }: CreateCategoryDrawerProps) {
  const queryClient = useQueryClient()

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: DEFAULT_VALUES,
  })

  const mutation = useMutation({
    mutationFn: async (values: CategoryInput) => {
      const result = await createCategory(values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY, 'categories'] })
      toastManager.add({
        type: 'success',
        title: 'Categoría creada',
        description: `${values.name} - ${KIND_LABEL[values.kind]}`,
      })
      onOpenChange(false)
    },
    onError: (error) => {
      form.setError('root', { message: error.message })
    },
  })

  const handleOpenChange: DrawerPrimitive.Root.Props['onOpenChange'] = (nextOpen, eventDetails) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  function handleOpenChangeComplete(isOpen: boolean) {
    props.onOpenChangeComplete?.(isOpen)

    if (!isOpen) {
      form.reset(DEFAULT_VALUES)
    }
  }

  return (
    <Drawer
      position="right"
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      {...props}
    >
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>Nueva categoría</DrawerTitle>
          <DrawerDescription>
            Las categorías agrupan los movimientos, por ejemplo "Jardinería" o "Donativos".
          </DrawerDescription>
        </DrawerHeader>

        <DrawerPanel>
          <Form
            id={FORM_ID}
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <CategoryFormFields form={form} disabled={mutation.isPending} />

            {form.formState.errors.root && (
              <Alert variant="error">
                <IconAlertCircle />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
              </Alert>
            )}
          </Form>
        </DrawerPanel>

        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
            Cancelar
          </DrawerClose>
          <Button type="submit" form={FORM_ID} disabled={mutation.isPending} loading={mutation.isPending}>
            Crear
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

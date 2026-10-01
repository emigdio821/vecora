import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query'
import { CircleAlertIcon, InfoIcon } from 'lucide-react'
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
import { systemCategorySource } from '@/lib/system-categories'
import { type CategoryInput, categorySchema } from '@/lib/validations/treasury'
import { updateCategory } from '@/server-actions/treasury'
import { type CategoryQueryData, TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'
import { CategoryFormFields } from './category-form-fields'

const FORM_ID = 'edit-category-form'

interface EditCategoryDrawerProps extends React.ComponentProps<typeof Drawer> {
  category: CategoryQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type UpdateCategoryMutation = UseMutationResult<void, Error, CategoryInput>

export function EditCategoryDrawer({ category, open, onOpenChange, ...props }: EditCategoryDrawerProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: CategoryInput) => {
      const result = await updateCategory(category.id, { name: values.name })
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, values) => {
      // Movements embed the category name, so their list needs a refresh too.
      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      toastManager.add({ type: 'success', title: 'Categoría actualizada', description: values.name })
      onOpenChange(false)
    },
  })

  const handleOpenChange: DrawerPrimitive.Root.Props['onOpenChange'] = (nextOpen, eventDetails) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  return (
    <Drawer position="right" open={open} onOpenChange={handleOpenChange} {...props}>
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>Editar categoría</DrawerTitle>
          <DrawerDescription>{category.name}</DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while the drawer is open, so the form always starts
            from the current row and a refetch mid-edit can't reset it. */}
        <EditCategoryForm category={category} mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

function EditCategoryForm({
  category,
  mutation,
}: {
  category: CategoryQueryData
  mutation: UpdateCategoryMutation
}) {
  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { kind: category.kind, name: category.name },
  })
  // "Cuota de mantenimiento", "Recargo" and the terraza ones: the RPCs look them up by key.
  const { key } = category

  return (
    <>
      <DrawerPanel>
        <Form
          id={FORM_ID}
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) =>
            mutation.mutate(values, {
              // Per-call callback so the error lands in this form instance.
              onError: (error) => form.setError('root', { message: error.message }),
            }),
          )}
        >
          {key !== null && (
            <Alert variant="info">
              <InfoIcon />
              <AlertTitle>Categoría del sistema</AlertTitle>
              <AlertDescription>
                {systemCategorySource(key)} usa esta categoría. Puedes cambiarle el nombre, pero no
                desactivarla ni eliminarla.
              </AlertDescription>
            </Alert>
          )}

          <CategoryFormFields form={form} disabled={mutation.isPending} lockKind />

          {form.formState.errors.root && (
            <Alert variant="error">
              <CircleAlertIcon />
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
          Guardar
        </Button>
      </DrawerFooter>
    </>
  )
}

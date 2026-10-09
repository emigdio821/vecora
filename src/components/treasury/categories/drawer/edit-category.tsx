import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle, IconInfoCircle } from '@tabler/icons-react'
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query'
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
import { m } from '@/paraglide/messages'
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

export function EditCategoryDrawer({
  category,
  open,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: EditCategoryDrawerProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: CategoryInput) => {
      const result = await updateCategory(category.id, { name: values.name })
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, values) => {
      // Movements embed the category name, so their list needs a refresh too.
      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      toastManager.add({ type: 'success', title: m.treasury_category_updated(), description: values.name })
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
    <Drawer
      position="right"
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(isOpen) => {
        // Clears `success`, which keeps the form busy while the drawer slides out.
        if (!isOpen) {
          mutation.reset()
        }
        onOpenChangeComplete?.(isOpen)
      }}
      {...props}
    >
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>{m.treasury_edit_category()}</DrawerTitle>
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
  // The fee, late fee and common area categories: the RPCs look them up by key.
  const { key } = category

  // Still busy after a save, until the drawer has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

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
              <IconInfoCircle />
              <AlertTitle>{m.treasury_system_category()}</AlertTitle>
              <AlertDescription>
                {m.treasury_system_category_description({ source: systemCategorySource(key) })}
              </AlertDescription>
            </Alert>
          )}

          <CategoryFormFields form={form} disabled={isBusy} lockKind />

          {form.formState.errors.root && (
            <Alert variant="error">
              <IconAlertCircle />
              <AlertTitle>{m.common_error()}</AlertTitle>
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}
        </Form>
      </DrawerPanel>

      <DrawerFooter>
        <DrawerClose render={<Button variant="ghost" />} disabled={isBusy}>
          {m.common_action_cancel()}
        </DrawerClose>
        <Button type="submit" form={FORM_ID} disabled={isBusy} loading={isBusy}>
          {m.common_action_save()}
        </Button>
      </DrawerFooter>
    </>
  )
}

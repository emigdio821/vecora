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
import { type AmenityInput, amenitySchema } from '@/lib/validations/presidency'
import { m } from '@/paraglide/messages'
import { createAmenity } from '@/server-actions/presidency'
import { PRESIDENCY_QUERY_KEY } from '@/tanstack-queries/presidency'
import { AmenityFormFields } from './amenity-form-fields'

const FORM_ID = 'create-amenity-form'

const DEFAULT_VALUES: AmenityInput = { name: '', default_fee: 0 }

interface CreateAmenityDrawerProps extends React.ComponentProps<typeof Drawer> {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAmenityDrawer({ open, onOpenChange, ...props }: CreateAmenityDrawerProps) {
  const queryClient = useQueryClient()

  const form = useForm<AmenityInput>({
    resolver: zodResolver(amenitySchema),
    defaultValues: DEFAULT_VALUES,
  })

  const mutation = useMutation({
    mutationFn: async (values: AmenityInput) => {
      const result = await createAmenity(values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [PRESIDENCY_QUERY_KEY, 'amenities'] })
      toastManager.add({ type: 'success', title: m.presidency_amenity_created(), description: values.name })
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
          <DrawerTitle>{m.presidency_new_amenity()}</DrawerTitle>
          <DrawerDescription>{m.presidency_create_amenity_description()}</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel>
          <Form
            id={FORM_ID}
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <AmenityFormFields form={form} disabled={mutation.isPending} />

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
          <DrawerClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
            {m.common_action_cancel()}
          </DrawerClose>
          <Button type="submit" form={FORM_ID} disabled={mutation.isPending} loading={mutation.isPending}>
            {m.common_action_create()}
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

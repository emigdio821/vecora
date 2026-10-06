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
import { type CreateHouseInput, createHouseSchema } from '@/lib/validations/houses'
import { m } from '@/paraglide/messages'
import { createHouse } from '@/server-actions/houses'
import { HOUSES_QUERY_KEY } from '@/tanstack-queries/houses'
import { HouseFormFields } from './house-form-fields'

const FORM_ID = 'create-house-form'

const defaultValues: CreateHouseInput = {
  number: '',
  notes: '',
}

interface CreateHouseDrawerProps extends React.ComponentProps<typeof Drawer> {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateHouseDrawer({ open, onOpenChange, ...props }: CreateHouseDrawerProps) {
  const queryClient = useQueryClient()

  const form = useForm<CreateHouseInput>({
    resolver: zodResolver(createHouseSchema),
    defaultValues,
  })

  const mutation = useMutation({
    mutationFn: async (values: CreateHouseInput) => {
      const result = await createHouse(values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: m.residential_house_created(),
        description: m.residential_house_created_description({ number: values.number }),
      })
      // Not handleOpenChange: the mutation is still `pending` while onSuccess runs.
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
      form.reset(defaultValues)
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
          <DrawerTitle>{m.residential_new_house()}</DrawerTitle>
          <DrawerDescription>{m.residential_new_house_description()}</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel>
          <Form
            id={FORM_ID}
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <HouseFormFields control={form.control} />

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

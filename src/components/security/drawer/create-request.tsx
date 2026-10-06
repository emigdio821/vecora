import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
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
import { useCurrency, useFormatCurrency } from '@/hooks/use-currency'
import { ISO_DAY } from '@/lib/utils'
import { type SecurityRequestInput, securityRequestSchema } from '@/lib/validations/security'
import { m } from '@/paraglide/messages'
import { createSecurityRequest } from '@/server-actions/security'
import { SECURITY_QUERY_KEY } from '@/tanstack-queries/security'
import { RequestFormFields } from './request-form-fields'

const FORM_ID = 'create-request-form'

function defaultValues(): SecurityRequestInput {
  return {
    kind: 'other',
    title: '',
    details: '',
    // The schema wants a number; RHF/NumberField hand us null until typed.
    amount: null as unknown as number,
    requested_on: format(new Date(), ISO_DAY),
  }
}

interface CreateRequestDrawerProps extends React.ComponentProps<typeof Drawer> {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRequestDrawer({ open, onOpenChange, ...props }: CreateRequestDrawerProps) {
  const queryClient = useQueryClient()
  const currency = useCurrency()
  const formatCurrency = useFormatCurrency()

  const form = useForm<SecurityRequestInput>({
    resolver: zodResolver(securityRequestSchema),
    defaultValues: defaultValues(),
  })

  const mutation = useMutation({
    mutationFn: async (values: SecurityRequestInput) => {
      const result = await createSecurityRequest(values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [SECURITY_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: m.requests_create_success(),
        description: `${values.title} - ${formatCurrency(values.amount, currency)}`,
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
      form.reset(defaultValues())
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
          <DrawerTitle>{m.requests_new()}</DrawerTitle>
          <DrawerDescription>{m.requests_security_create_description()}</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel>
          <Form
            id={FORM_ID}
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <RequestFormFields form={form} currency={currency} disabled={mutation.isPending} />

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
            {m.requests_submit()}
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

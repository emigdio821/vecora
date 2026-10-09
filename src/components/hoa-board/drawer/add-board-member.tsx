import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ResidentsPicker } from '@/components/shared/pickers/residents-picker'
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
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { type AddBoardMemberInput, addBoardMemberSchema } from '@/lib/validations/hoa-board'
import { m } from '@/paraglide/messages'
import { addBoardMember, type InviteResult } from '@/server-actions/hoa-board'
import { boardMembersQueryOptions, HOA_BOARD_QUERY_KEY } from '@/tanstack-queries/hoa-board'
import { RESIDENTS_QUERY_KEY, residentsPickerQueryOptions } from '@/tanstack-queries/residents'
import { RolesField } from '../roles-field'

const FORM_ID = 'add-board-member-form'

const DEFAULT_VALUES: AddBoardMemberInput = { resident_id: '', roles: [] }

interface AddBoardMemberDrawerProps extends React.ComponentProps<typeof Drawer> {
  open: boolean
  onOpenChange: (open: boolean) => void
  canGrantAdmin: boolean
  /** Receives the one-time link to share once the account exists. */
  onInvited: (invite: InviteResult) => void
}

export function AddBoardMemberDrawer({
  open,
  onOpenChange,
  canGrantAdmin,
  onInvited,
  ...props
}: AddBoardMemberDrawerProps) {
  const queryClient = useQueryClient()
  const { data: residents } = useQuery(residentsPickerQueryOptions())
  const { data: members } = useQuery(boardMembersQueryOptions())

  // Hide who can't be added: already on the board, or no email for the account.
  const excludeIds = useMemo(() => {
    const onBoard = new Set((members ?? []).map((m) => m.resident?.id).filter(Boolean))
    return (residents ?? []).filter((r) => onBoard.has(r.id) || !r.email).map((r) => r.id)
  }, [residents, members])

  const form = useForm<AddBoardMemberInput>({
    resolver: zodResolver(addBoardMemberSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const mutation = useMutation({
    mutationFn: async (values: AddBoardMemberInput) => {
      const result = await addBoardMember(values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: (invite) => {
      void queryClient.invalidateQueries({ queryKey: [HOA_BOARD_QUERY_KEY] })
      // The resident now has an account: the registry shows the role badge.
      void queryClient.invalidateQueries({ queryKey: [RESIDENTS_QUERY_KEY] })
      onOpenChange(false)
      onInvited(invite)
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
      mutation.reset()
    }
  }

  // Still busy after a save, until the drawer has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

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
          <DrawerTitle>{m.board_add_member()}</DrawerTitle>
          <DrawerDescription>{m.board_add_member_description()}</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel>
          <Form
            id={FORM_ID}
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <Controller
              name="resident_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched}
                  dirty={fieldState.isDirty}
                >
                  <FieldLabel>
                    {m.board_field_resident()} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <ResidentsPicker
                    value={field.value || null}
                    onValueChange={(value) => {
                      field.onChange(value ?? '')
                    }}
                    inputRef={field.ref}
                    excludeIds={excludeIds}
                    disabled={isBusy}
                  />
                  <FieldDescription>{m.board_resident_hint()}</FieldDescription>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <RolesField form={form} name="roles" disabled={isBusy} canGrantAdmin={canGrantAdmin} />

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
            {m.board_add_submit()}
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

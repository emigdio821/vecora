import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
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
import { type UpdateBoardMemberRolesInput, updateBoardMemberRolesSchema } from '@/lib/validations/hoa-board'
import { m } from '@/paraglide/messages'
import { updateBoardMemberRoles } from '@/server-actions/hoa-board'
import { type BoardMemberQueryData, HOA_BOARD_QUERY_KEY } from '@/tanstack-queries/hoa-board'
import { RESIDENTS_QUERY_KEY } from '@/tanstack-queries/residents'
import { RolesField } from '../roles-field'

const FORM_ID = 'edit-board-member-form'

interface EditBoardMemberDrawerProps extends React.ComponentProps<typeof Drawer> {
  member: BoardMemberQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
  canGrantAdmin: boolean
}

type UpdateRolesMutation = UseMutationResult<void, Error, UpdateBoardMemberRolesInput>

export function EditBoardMemberDrawer({
  member,
  open,
  onOpenChange,
  canGrantAdmin,
  ...props
}: EditBoardMemberDrawerProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: UpdateBoardMemberRolesInput) => {
      const result = await updateBoardMemberRoles(member.id, values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [HOA_BOARD_QUERY_KEY] })
      void queryClient.invalidateQueries({ queryKey: [RESIDENTS_QUERY_KEY] })
      toastManager.add({ type: 'success', title: m.board_roles_updated(), description: member.full_name })
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
          <DrawerTitle>{m.board_edit_roles()}</DrawerTitle>
          <DrawerDescription>{member.full_name}</DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while the drawer is open, so the form always starts
            from the current row and a refetch mid-edit can't reset it. */}
        <EditBoardMemberForm member={member} mutation={mutation} canGrantAdmin={canGrantAdmin} />
      </DrawerPopup>
    </Drawer>
  )
}

function EditBoardMemberForm({
  member,
  mutation,
  canGrantAdmin,
}: {
  member: BoardMemberQueryData
  mutation: UpdateRolesMutation
  canGrantAdmin: boolean
}) {
  const form = useForm<UpdateBoardMemberRolesInput>({
    resolver: zodResolver(updateBoardMemberRolesSchema),
    defaultValues: { roles: member.user_roles.map((r) => r.role) },
  })

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
          <RolesField form={form} name="roles" disabled={mutation.isPending} canGrantAdmin={canGrantAdmin} />

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
          {m.common_action_save()}
        </Button>
      </DrawerFooter>
    </>
  )
}

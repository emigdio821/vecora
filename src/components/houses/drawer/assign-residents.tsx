import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toastManager } from '@/components/ui/toast'
import { type AssignResidentsInput, assignResidentsSchema } from '@/lib/validations/houses'
import { m } from '@/paraglide/messages'
import { assignResidents } from '@/server-actions/houses'
import { HOUSES_QUERY_KEY, type HouseQueryData } from '@/tanstack-queries/houses'
import { RESIDENTS_QUERY_KEY } from '@/tanstack-queries/residents'
import { RELATIONSHIP_ITEMS } from '../relationship'

const FORM_ID = 'assign-residents-form'

const defaultValues: AssignResidentsInput = {
  residentIds: [],
  relationship: 'owner',
}

interface AssignResidentsDrawerProps extends React.ComponentProps<typeof Drawer> {
  house: HouseQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignResidentsDrawer({ house, open, onOpenChange, ...props }: AssignResidentsDrawerProps) {
  const queryClient = useQueryClient()
  const [scope, setScope] = useState<'all' | 'unassigned'>('unassigned')

  const form = useForm<AssignResidentsInput>({
    resolver: zodResolver(assignResidentsSchema),
    defaultValues,
  })

  const mutation = useMutation({
    mutationFn: async (values: AssignResidentsInput) => {
      const result = await assignResidents(house.id, values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: ({ assigned }) => {
      // Both sides of the link show it: the house's residents and each resident's houses.
      void queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })
      void queryClient.invalidateQueries({ queryKey: [RESIDENTS_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: assigned === 1 ? m.residential_resident_assigned() : m.residential_residents_assigned(),
        description:
          assigned === 1
            ? m.residential_resident_assigned_description({ number: house.number })
            : m.residential_residents_assigned_description({ count: assigned, number: house.number }),
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
      setScope('unassigned')
    }
  }

  const currentResidentIds = house.property_residents.map((pr) => pr.resident.id)

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
          <DrawerTitle>{m.residential_assign_residents()}</DrawerTitle>
          <DrawerDescription>{m.common_house_label({ number: house.number })}</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel>
          <Form
            id={FORM_ID}
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <Controller
              name="residentIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched}
                  dirty={fieldState.isDirty}
                >
                  <FieldLabel>
                    {m.common_section_residents()} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <ResidentsPicker
                    multiple
                    scope={scope}
                    excludeIds={currentResidentIds}
                    value={field.value}
                    onValueChange={field.onChange}
                    inputRef={field.ref}
                    disabled={mutation.isPending}
                  />
                  <FieldDescription>{m.residential_residents_picker_hint()}</FieldDescription>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Label className="flex w-full items-start rounded-lg border p-3 hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50">
              <Switch
                checked={scope === 'unassigned'}
                onCheckedChange={(checked) => {
                  setScope(checked ? 'unassigned' : 'all')
                }}
              />
              <span className="grid gap-1">
                <span>{m.residential_only_unassigned()}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {m.residential_only_unassigned_hint()}
                </span>
              </span>
            </Label>

            <Controller
              name="relationship"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched}
                  dirty={fieldState.isDirty}
                >
                  <FieldLabel>
                    {m.residential_field_relationship()} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    items={RELATIONSHIP_ITEMS}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                    }}
                    disabled={mutation.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={m.residential_relationship_placeholder()} />
                    </SelectTrigger>
                    <SelectPopup>
                      {RELATIONSHIP_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                  <FieldDescription>{m.residential_relationship_applies_to_all()}</FieldDescription>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

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
            {m.residential_action_assign()}
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

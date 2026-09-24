'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleAlertIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { type ResidentsPickerScope, ResidentsPicker } from '@/components/shared/pickers/residents-picker'
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
import { type AssignResidentsInput, assignResidentsSchema, type Relationship } from '@/lib/validations/houses'
import { assignResidents } from '@/server-actions/houses'
import { HOUSES_QUERY_KEY, type HouseQueryData } from '@/tanstack-queries/houses'
import { RESIDENTS_QUERY_KEY } from '@/tanstack-queries/residents'

const FORM_ID = 'assign-residents-form'

const RELATIONSHIP_ITEMS: { value: Relationship; label: string }[] = [
  { value: 'owner', label: 'Propietario' },
  { value: 'tenant', label: 'Inquilino' },
  { value: 'family', label: 'Familiar' },
]

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
  const scopeSwitchId = useId()
  const [scope, setScope] = useState<ResidentsPickerScope>('unassigned')

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
        title: assigned === 1 ? 'Residente asignado' : 'Residentes asignados',
        description:
          assigned === 1
            ? `Se asignó a la casa ${house.number}`
            : `Se asignaron ${assigned} residentes a la casa ${house.number}`,
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
          <DrawerTitle>Asignar residentes</DrawerTitle>
          <DrawerDescription>Casa {house.number}</DrawerDescription>
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
                    Residentes <span className="text-destructive">*</span>
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
                  <FieldDescription>Quienes ya viven en esta casa no aparecen en la lista.</FieldDescription>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <div className="flex items-start gap-2">
              <Switch
                id={scopeSwitchId}
                checked={scope === 'unassigned'}
                onCheckedChange={(checked) => setScope(checked ? 'unassigned' : 'all')}
              />
              <div className="flex flex-col gap-1">
                <Label htmlFor={scopeSwitchId}>Solo residentes sin casa</Label>
                <p className="text-xs text-muted-foreground">
                  Desactívalo para incluir a quienes ya tienen otra casa asignada.
                </p>
              </div>
            </div>

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
                    Relación <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    items={RELATIONSHIP_ITEMS}
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    disabled={mutation.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una relación" />
                    </SelectTrigger>
                    <SelectPopup>
                      {RELATIONSHIP_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                  <FieldDescription>Se aplica a todos los residentes seleccionados.</FieldDescription>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

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
            Asignar
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

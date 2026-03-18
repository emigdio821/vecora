import { zodResolver } from '@hookform/resolvers/zod'
import { IconSelector } from '@tabler/icons-react'
import { addYears } from 'date-fns'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { updateHoaBoardPeriod } from '@/api/server-functions/hoa-board'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import {
  HOA_BOARD_MEMBERS_QUERY_KEY,
  HOA_BOARD_PERIODS_QUERY_KEY,
  type HoaBoardPeriodQueryData,
} from '@/api/tanstack-queries/hoa-board'
import { LoaderIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { MAX_YEAR_OFFSET } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { type UpdateHoaBoardPeriodFormData, updateHoaBoardPeriodSchema } from '@/schemas/hoa-board'

interface EditHoaPeriodSheetProps {
  period: HoaBoardPeriodQueryData
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function EditHoaPeriodSheet({ period, state }: EditHoaPeriodSheetProps) {
  const editPeriodFormId = useId()
  const { isOpen, onOpenChange } = state

  const form = useForm<UpdateHoaBoardPeriodFormData>({
    resolver: zodResolver(updateHoaBoardPeriodSchema),
    values: {
      periodId: period.id,
      startDate: new Date(period.startDate),
      endDate: new Date(period.endDate),
    },
  })

  const updatePeriodMutation = useEntityMutation({
    mutationFn: async (data: UpdateHoaBoardPeriodFormData) => {
      return await updateHoaBoardPeriod({ data })
    },
    invalidateKeys: [HOA_BOARD_PERIODS_QUERY_KEY, HOA_BOARD_MEMBERS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Periodo actualizado',
    successDescription: 'El periodo ha sido actualizado exitosamente',
    errorDescription: 'Ocurrió un error al actualizar el periodo, intenta nuevamente',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: UpdateHoaBoardPeriodFormData) {
    updatePeriodMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (updatePeriodMutation.isPending) return
    onOpenChange(open)
  }

  const startDate = form.watch('startDate', new Date(period.startDate) || new Date())

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Editar periodo</SheetTitle>
          <SheetDescription>Actualiza las fechas del periodo de mesa directiva</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={editPeriodFormId}
            aria-label="Editar periodo"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              name="startDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Fecha inicial <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          id={field.name}
                          variant="outline"
                          aria-invalid={fieldState.invalid}
                          disabled={updatePeriodMutation.isPending}
                          className="w-full justify-between pr-2"
                        >
                          <span className="font-normal">{formatDate(field.value)}</span>
                          <IconSelector className="pointer-events-none size-4 text-muted-foreground" />
                        </Button>
                      }
                    />
                    <PopoverContent className="w-auto p-1">
                      <Calendar
                        mode="single"
                        id={field.name}
                        startMonth={new Date()}
                        selected={field.value}
                        defaultMonth={field.value}
                        endMonth={addYears(new Date(), MAX_YEAR_OFFSET)}
                        onSelect={(date) => field.onChange(date || new Date())}
                        disabled={updatePeriodMutation.isPending}
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="endDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Fecha final <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          id={field.name}
                          variant="outline"
                          aria-invalid={fieldState.invalid}
                          disabled={updatePeriodMutation.isPending}
                          className="w-full justify-between pr-2"
                        >
                          <span className="font-normal">{formatDate(field.value)}</span>
                          <IconSelector className="pointer-events-none size-4 text-muted-foreground" />
                        </Button>
                      }
                    />
                    <PopoverContent className="w-auto p-1">
                      <Calendar
                        mode="single"
                        id={field.name}
                        selected={field.value}
                        defaultMonth={field.value}
                        startMonth={new Date(startDate)}
                        endMonth={addYears(startDate, MAX_YEAR_OFFSET)}
                        onSelect={(date) => field.onChange(date || new Date())}
                        disabled={
                          updatePeriodMutation.isPending || {
                            before: startDate,
                            after: addYears(startDate, MAX_YEAR_OFFSET),
                          }
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </form>
        </SheetPanel>

        <SheetFooter>
          <Button type="submit" form={editPeriodFormId} disabled={updatePeriodMutation.isPending}>
            {updatePeriodMutation.isPending && <LoaderIcon />}
            Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

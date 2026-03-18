import { zodResolver } from '@hookform/resolvers/zod'
import { IconSelector } from '@tabler/icons-react'
import { addYears } from 'date-fns'
import type React from 'react'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createHoaBoardPeriod } from '@/api/server-functions/hoa-board'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { HOA_BOARD_PERIODS_QUERY_KEY } from '@/api/tanstack-queries/hoa-board'
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
import { type CreateHoaBoardPeriodFormData, createHoaBoardPeriodSchema } from '@/schemas/hoa-board'

interface CreatePeriodSheetProps extends React.ComponentProps<typeof Sheet> {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePeriodSheet({ open, onOpenChange, ...props }: CreatePeriodSheetProps) {
  const createPeriodFormId = useId()

  const form = useForm<CreateHoaBoardPeriodFormData>({
    shouldUnregister: true,
    resolver: zodResolver(createHoaBoardPeriodSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: addYears(new Date(), 1),
    },
  })

  const createPeriodMutation = useEntityMutation({
    mutationFn: async (data: CreateHoaBoardPeriodFormData) => {
      return await createHoaBoardPeriod({ data })
    },
    invalidateKeys: [HOA_BOARD_PERIODS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Periodo creado',
    successDescription: 'El periodo ha sido creado exitosamente',
    errorDescription: 'Ocurrió un error al crear el periodo, intenta nuevamente',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: CreateHoaBoardPeriodFormData) {
    createPeriodMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (createPeriodMutation.isPending) return
    onOpenChange(open)
  }

  const startDate = form.watch('startDate', new Date())

  return (
    <Sheet open={open} onOpenChange={handleOpenChange} {...props}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Crear periodo</SheetTitle>
          <SheetDescription>Ingresa las fechas del nuevo periodo de mesa directiva</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={createPeriodFormId}
            aria-label="Crear periodo"
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
                          disabled={createPeriodMutation.isPending}
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
                        disabled={createPeriodMutation.isPending}
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
                          disabled={createPeriodMutation.isPending}
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
                          createPeriodMutation.isPending || {
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
          <Button type="submit" form={createPeriodFormId} disabled={createPeriodMutation.isPending}>
            {createPeriodMutation.isPending && <LoaderIcon />}
            Crear
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

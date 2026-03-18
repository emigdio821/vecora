import { zodResolver } from '@hookform/resolvers/zod'
import { IconSelector } from '@tabler/icons-react'
import { addMonths } from 'date-fns'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createNotification } from '@/api/server-functions/notifications'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { MY_NOTIFICATIONS_QUERY_KEY, NOTIFICATIONS_QUERY_KEY } from '@/api/tanstack-queries/notifications'
import { LoaderIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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
import { Textarea } from '@/components/ui/textarea'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { formatDate } from '@/lib/utils'
import { type CreateNotificationData, createNotificationSchema } from '@/schemas/notifications'

interface CreateNotificationSheetProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function CreateNotificationSheet({ state }: CreateNotificationSheetProps) {
  const createNotificationFormId = useId()
  const { isOpen, onOpenChange } = state

  const form = useForm<CreateNotificationData>({
    shouldUnregister: true,
    resolver: zodResolver(createNotificationSchema),
    defaultValues: {
      title: '',
      message: '',
      expiresAt: null,
    },
  })

  const createNotificationMutation = useEntityMutation({
    mutationFn: async (data: CreateNotificationData) => {
      return await createNotification({ data })
    },
    invalidateKeys: [NOTIFICATIONS_QUERY_KEY, MY_NOTIFICATIONS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Notificación creada',
    successDescription: 'La notificación ha sido enviada exitosamente.',
    errorDescription: 'Ocurrió un error al crear la notificación, intenta nuevamente.',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: CreateNotificationData) {
    createNotificationMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (createNotificationMutation.isPending) return
    onOpenChange(open)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Crear notificación</SheetTitle>
          <SheetDescription>
            Ingresa la información de la notificación. Esta será visible para todos los usuarios.
          </SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={createNotificationFormId}
            aria-label="Crear notificación"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Título <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                    disabled={createNotificationMutation.isPending}
                    placeholder="Ingresa el título"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="message"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Mensaje <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.value}
                    className="max-h-40"
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                    disabled={createNotificationMutation.isPending}
                    placeholder="Ingresa el mensaje"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="expiresAt"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Fecha de expiración</FieldLabel>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          id={field.name}
                          variant="outline"
                          aria-invalid={fieldState.invalid}
                          className="w-full justify-between pr-2"
                          disabled={createNotificationMutation.isPending}
                        >
                          <span className="font-normal">
                            {field.value ? formatDate(field.value) : 'Sin expiración'}
                          </span>
                          <IconSelector className="pointer-events-none size-4 text-muted-foreground" />
                        </Button>
                      }
                    />
                    <PopoverContent className="w-auto p-1">
                      <Calendar
                        mode="single"
                        id={field.name}
                        captionLayout="label"
                        startMonth={new Date()}
                        defaultMonth={new Date()}
                        endMonth={addMonths(new Date(), 2)}
                        selected={field.value || undefined}
                        disabled={
                          createNotificationMutation.isPending || {
                            before: new Date(),
                            after: addMonths(new Date(), 2),
                          }
                        }
                        onSelect={(date) => field.onChange(date || null)}
                      />
                    </PopoverContent>
                  </Popover>
                  <FieldDescription>
                    Si quieres que la notificación expire, selecciona una fecha.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </form>
        </SheetPanel>

        <SheetFooter>
          <Button
            type="submit"
            form={createNotificationFormId}
            disabled={createNotificationMutation.isPending}
          >
            {createNotificationMutation.isPending && <LoaderIcon />}
            Crear
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

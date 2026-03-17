import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createHoaBoardMember } from '@/api/server-functions/hoa-board'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { HOA_BOARD_MEMBERS_QUERY_KEY, HOA_BOARD_PERIODS_QUERY_KEY } from '@/api/tanstack-queries/hoa-board'
import { LoaderIcon } from '@/components/icons'
import { HoaPeriodSelector } from '@/components/shared/selectors/hoa-period-selector'
import { ProfilesSelector } from '@/components/shared/selectors/profiles-selector'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
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
import { type CreateHoaBoardMemberFormData, createHoaBoardMemberSchema } from '@/schemas/hoa-board'

interface CreateMemberSheetProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
  defaultPeriodId?: string
}

export function CreateMemberSheet({ state, defaultPeriodId }: CreateMemberSheetProps) {
  const createMemberFormId = useId()
  const { isOpen, onOpenChange } = state

  const form = useForm<CreateHoaBoardMemberFormData>({
    shouldUnregister: true,
    resolver: zodResolver(createHoaBoardMemberSchema),
    defaultValues: {
      periodId: defaultPeriodId || '',
      profileId: '',
    },
  })

  const createMemberMutation = useEntityMutation({
    mutationFn: async (data: CreateHoaBoardMemberFormData) => {
      return await createHoaBoardMember({ data })
    },
    invalidateKeys: [HOA_BOARD_PERIODS_QUERY_KEY, HOA_BOARD_MEMBERS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Miembro agregado',
    successDescription: 'El miembro ha sido agregado exitosamente.',
    errorDescription: 'Ocurrió un error al agregar el miembro, intenta nuevamente.',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: CreateHoaBoardMemberFormData) {
    createMemberMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (createMemberMutation.isPending) return
    onOpenChange(open)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Agregar miembro</SheetTitle>
          <SheetDescription>
            Selecciona el periodo y el perfil del nuevo miembro de la mesa directiva.
          </SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={createMemberFormId}
            aria-label="Agregar miembro"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              name="periodId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Periodo <span className="text-destructive">*</span>
                  </FieldLabel>
                  <HoaPeriodSelector
                    id={field.name}
                    value={field.value}
                    includeNoneOption={false}
                    invalid={fieldState.invalid}
                    onValueChange={field.onChange}
                    disabled={createMemberMutation.isPending}
                  />
                  <FieldDescription>
                    Periodo al que pertenecerá este miembro. Si no hay periodos disponibles, crea uno{' '}
                    <Button
                      variant="link"
                      nativeButton={false}
                      render={
                        <Link to="/hoa-board" search={{ tab: 'hoa-board-periods' }}>
                          aquí
                        </Link>
                      }
                    />
                    .
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="profileId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Perfil <span className="text-destructive">*</span>
                  </FieldLabel>
                  <ProfilesSelector
                    id={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={createMemberMutation.isPending}
                    invalid={fieldState.invalid}
                    includeNoneOption={false}
                    excludeWithPeriod
                  />
                  <FieldDescription>
                    Selecciona el perfil del usuario que será miembro de la mesa directiva.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </form>
        </SheetPanel>

        <SheetFooter>
          <Button type="submit" form={createMemberFormId} disabled={createMemberMutation.isPending}>
            {createMemberMutation.isPending && <LoaderIcon />}
            Agregar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

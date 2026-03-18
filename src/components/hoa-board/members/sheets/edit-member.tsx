import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import type React from 'react'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { updateHoaBoardMember } from '@/api/server-functions/hoa-board'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import {
  HOA_BOARD_MEMBERS_QUERY_KEY,
  HOA_BOARD_PERIODS_QUERY_KEY,
  type HoaBoardMemberQueryData,
} from '@/api/tanstack-queries/hoa-board'
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
import { type UpdateHoaBoardMemberFormData, updateHoaBoardMemberSchema } from '@/schemas/hoa-board'

interface EditMemberSheetProps extends React.ComponentProps<typeof Sheet> {
  member: HoaBoardMemberQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditMemberSheet({ member, open, onOpenChange, ...props }: EditMemberSheetProps) {
  const editMemberFormId = useId()

  const form = useForm<UpdateHoaBoardMemberFormData>({
    resolver: zodResolver(updateHoaBoardMemberSchema),
    values: {
      memberId: member.id,
      periodId: member.periodId,
      profileId: member.profileId || '',
    },
  })

  const updateMemberMutation = useEntityMutation({
    mutationFn: async (data: UpdateHoaBoardMemberFormData) => {
      return await updateHoaBoardMember({ data })
    },
    invalidateKeys: [HOA_BOARD_PERIODS_QUERY_KEY, HOA_BOARD_MEMBERS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Miembro actualizado',
    successDescription: 'El miembro ha sido actualizado exitosamente',
    errorDescription: 'Ocurrió un error al actualizar el miembro, intenta nuevamente',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: UpdateHoaBoardMemberFormData) {
    updateMemberMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (updateMemberMutation.isPending) return
    onOpenChange(open)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
      {...props}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) form.reset()
      }}
    >
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Editar miembro</SheetTitle>
          <SheetDescription>
            Actualiza el periodo y el perfil del miembro de la mesa directiva
          </SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={editMemberFormId}
            aria-label="Editar miembro"
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
                    disabled={updateMemberMutation.isPending}
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
                    disabled={updateMemberMutation.isPending}
                    invalid={fieldState.invalid}
                    includeNoneOption={false}
                    excludeWithPeriod
                    excludeMemberId={member.id}
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
          <Button type="submit" form={editMemberFormId} disabled={updateMemberMutation.isPending}>
            {updateMemberMutation.isPending && <LoaderIcon />}
            Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

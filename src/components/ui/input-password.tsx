import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/components/ui/tooltip'
import type { InputProps } from './input'

export function InputPassword(props: InputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <InputGroup>
      <InputGroupInput
        type={showPassword ? 'text' : 'password'}
        aria-label="Contraseña con opción de mostrar u ocultar"
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword((prev) => !prev)}
              />
            }
          >
            {showPassword ? <IconEyeOff /> : <IconEye />}
          </TooltipTrigger>
          <TooltipPopup>{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</TooltipPopup>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}

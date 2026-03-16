import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { useState } from 'react'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
            closeOnClick={false}
            render={
              <InputGroupButton
                size="icon-xs"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword((prev) => !prev)}
              />
            }
          >
            {showPassword ? <IconEyeOff /> : <IconEye />}
          </TooltipTrigger>
          <TooltipContent>{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</TooltipContent>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}

'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { login } from '@/server-actions/auth'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined)

  return (
    <CardFrame className="w-full max-w-xs mx-auto my-10">
      <CardFrameHeader>
        <CardFrameTitle>Login</CardFrameTitle>
        <CardFrameDescription>Access your account</CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <CardPanel>
          <Form action={formAction} className="flex w-full flex-col gap-4">
            <Field name="email">
              <FieldLabel>Email</FieldLabel>
              <Input placeholder="Your email" type="email" autoComplete="email" required />
              <FieldError />
            </Field>
            <Field name="password">
              <FieldLabel>Password</FieldLabel>
              <Input placeholder="Your password" type="password" autoComplete="current-password" required />
              <FieldError />
            </Field>
            {state?.error && (
              <p role="alert" className="text-destructive-foreground text-sm">
                {state.error}
              </p>
            )}
            <Button className="w-full" type="submit" disabled={pending}>
              {pending ? 'Signing in…' : 'Sign in'}
            </Button>
          </Form>
        </CardPanel>
      </Card>
    </CardFrame>
  )
}

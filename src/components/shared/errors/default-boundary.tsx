import type { ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function DefaultErrorBoundary({ error }: ErrorComponentProps) {
  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center">Error</CardTitle>
      </CardHeader>
      <CardContent>
        <code className="block w-full rounded-md bg-muted p-2 font-mono text-xs">{error.message}</code>
      </CardContent>
      <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button className="grow" onClick={() => window.location.reload()}>
          Recargar página
        </Button>
      </CardFooter>
    </Card>
  )
}

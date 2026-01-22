import { IconGhost3 } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Footer } from '../../footer'
import { Button } from '../../ui/button'

export function NotFound() {
  return (
    <>
      <section className="p-6">
        <Card className="mx-auto w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center font-extrabold text-4xl">
              <IconGhost3 className="mx-auto mb-2 size-8 text-muted-foreground" />
              404
            </CardTitle>
            <CardDescription className="text-center">Eta página no existe.</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button nativeButton={false} className="grow" render={<Link to="/">Inicio</Link>} />
          </CardFooter>
        </Card>
      </section>
      <Footer />
    </>
  )
}

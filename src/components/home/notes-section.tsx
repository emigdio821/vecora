import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function NotesSection() {
  return (
    <div className="grid @5xl/main:grid-cols-4 @xl/main:grid-cols-2 grid-cols-1 gap-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Ingresos Totales</CardDescription>
          <CardTitle className="font-semibold @[250px]/card:text-3xl text-2xl tabular-nums">
            $1,250.00
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Descripción de prueba <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Prueba</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Últimos pagos</CardDescription>
          <CardTitle className="font-semibold @[250px]/card:text-3xl text-2xl tabular-nums">0</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -10%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Descripción de prueba.
            <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Faltan 7 casas de ponerse al corriente.</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Últimas infracciones</CardDescription>
          <CardTitle className="font-semibold @[250px]/card:text-3xl text-2xl tabular-nums">8</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              47%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Descripción de prueba.
            <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">20 infracciones en este mes.</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pagos pendientes</CardDescription>
          <CardTitle className="font-semibold @[250px]/card:text-3xl text-2xl tabular-nums">7</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Descripción de prueba. <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Falta pago de guardias y jardinería.</div>
        </CardFooter>
      </Card>
    </div>
  )
}

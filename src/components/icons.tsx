import { IconLoader2 } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

type IconProps = React.SVGProps<SVGSVGElement>

export const ResidoIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...props} height={200} width={200} viewBox="32 24.5 36 51">
    <title>Resido Logo</title>
    <path
      fill="currentColor"
      d="M53.3 25.7q.84 0 1.56.78t.72 1.8-1.2 2.58q-4.68 5.76-6.18 7.26t-1.5 1.98.78.48 6.42-2.1 7.44-2.1 3.72 1.5 1.92 3.84-7.32 10.68-7.32 10.86q0 .48.36.48.6 0 2.16-.78t1.92-.78q1.32 0 1.32.96 0 3.72-5.88 7.44t-9.9 3.72-6.54-2.22-2.52-5.94 3.66-8.34 7.56-6.54 3.9-3.12q0-.36-.12-.48-5.28 2.16-8.64 2.16-6.6 0-6.6-3.84 0-4.44 7.68-11.64t12.6-8.64"
    />
  </svg>
)

export const LoaderIcon = ({ className, ...props }: IconProps) => (
  <IconLoader2 className={cn('animate-spin', className)} {...props} />
)

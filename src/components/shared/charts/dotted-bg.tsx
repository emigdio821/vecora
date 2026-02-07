import type { ChartConfig } from '@/components/ui/chart'

export function ChartDottedBackgroundPattern({ config }: { config: ChartConfig }) {
  const items = Object.fromEntries(Object.entries(config).map(([key, value]) => [key, value.color]))

  return (
    <>
      {Object.entries(items).map(([key, value]) => (
        <pattern
          key={key}
          id={`dotted-background-pattern-${key}`}
          x="0"
          y="0"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="5" cy="5" r="1.5" fill={value} opacity={0.5} />
        </pattern>
      ))}
    </>
  )
}

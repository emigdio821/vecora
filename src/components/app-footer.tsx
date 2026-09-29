export function AppFooter() {
  // oxlint-disable-next-line react/purity -- server component: renders once, never re-renders
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto flex items-center justify-center gap-2 p-4 sm:p-6">
      <span className="flex h-5 items-center gap-2 text-sm">
        <span>{year}</span>
        <div className="h-4 w-px bg-border" />
        <span className="font-medium">Vecora</span>
      </span>
    </footer>
  )
}

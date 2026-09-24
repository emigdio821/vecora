export default function ScreenSizeIndicator() {
  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="fixed top-2 right-2 z-50 rounded bg-black px-2 py-1 font-mono text-xs text-white shadow">
      <span className="block sm:hidden">default (&lt;640px)</span>
      <span className="hidden sm:block md:hidden">sm (640px+)</span>
      <span className="hidden md:block lg:hidden">md (768px+)</span>
      <span className="hidden lg:block xl:hidden">lg (1024px+)</span>
      <span className="hidden xl:block 2xl:hidden">xl (1280px+)</span>
      <span className="hidden 2xl:block">2xl (1536px+)</span>
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { m } from '@/paraglide/messages'
import { VecoraIcon } from './shared/icons'
import { SidebarTrigger } from './ui/sidebar'

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 md:hidden">
      <div className="flex w-full items-center gap-1 px-4">
        <SidebarTrigger className="-ml-2" />
        <Separator orientation="vertical" className="h-4" />
        <Button
          variant="ghost"
          className="px-2"
          render={
            <Link to="/">
              {/* opacity-100: Button dims its icons, but the brand color stays full. */}
              <VecoraIcon className="size-4 text-primary opacity-100" />
              <span className="text-base font-semibold">{m.common_app_name()}</span>
            </Link>
          }
        />
      </div>
    </header>
  )
}

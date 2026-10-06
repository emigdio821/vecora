import { IconLanguage, IconSelector } from '@tabler/icons-react'
import { LanguageMenu } from '@/components/language-menu'
import { Button } from '@/components/ui/button'
import { useToday } from '@/hooks/use-today'
import { MULTI_LANGUAGE } from '@/lib/config/i18n'
import { LANGUAGE_LABEL } from '@/lib/validations/settings'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

export function AppFooter() {
  const year = useToday().getFullYear()

  return (
    <footer className="mt-auto flex flex-col items-center justify-center gap-2 p-4 sm:p-6">
      {MULTI_LANGUAGE && (
        <LanguageMenu
          align="center"
          trigger={
            <Button
              variant="ghost"
              size="sm"
              aria-label={`${m.common_language()}: ${LANGUAGE_LABEL[getLocale()]}`}
            >
              <IconLanguage />
              {LANGUAGE_LABEL[getLocale()]}
              <IconSelector className="text-muted-foreground" />
            </Button>
          }
        />
      )}
      <span className="flex h-5 items-center gap-2 text-sm">
        <span>{year}</span>
        <div className="h-4 w-px bg-border" />
        <span className="font-medium">Vecora</span>
      </span>
    </footer>
  )
}

import { Menu, MenuPopup, MenuRadioGroup, MenuRadioItem, MenuTrigger } from '@/components/ui/menu'
import { LANGUAGE_LABEL, LANGUAGE_PICKED_COOKIE } from '@/lib/validations/settings'
import { cookieMaxAge, getLocale, type Locale, locales, setLocale } from '@/paraglide/runtime'

/**
 * The screen language of this device, like the theme. Paraglide keeps it in a
 * cookie and reloads, so the server renders the next page in it. The HOA's
 * records and the PDF stay in the HOA's language.
 */
export function pickLanguage(locale: Locale) {
  document.cookie = `${LANGUAGE_PICKED_COOKIE}=1; path=/; max-age=${cookieMaxAge}; samesite=lax`
  void setLocale(locale)
}

interface LanguageMenuProps {
  /** The button that opens it. */
  trigger: React.ReactElement
  align?: React.ComponentProps<typeof MenuPopup>['align']
}

/** For the sign-in pages; once signed in, it's in the settings dialog. */
export function LanguageMenu({ trigger, align = 'start' }: LanguageMenuProps) {
  return (
    <Menu>
      <MenuTrigger render={trigger} />
      <MenuPopup align={align}>
        <MenuRadioGroup
          value={getLocale()}
          onValueChange={(value: Locale) => {
            pickLanguage(value)
          }}
        >
          {locales.map((locale) => (
            // Each name in its own language, so anyone can find theirs.
            <MenuRadioItem key={locale} value={locale} lang={locale}>
              {LANGUAGE_LABEL[locale]}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  )
}

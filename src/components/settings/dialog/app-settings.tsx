import { pickLanguage } from '@/components/language-menu'
import { type Theme, useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter, DialogPanel } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldItem, FieldLabel } from '@/components/ui/field'
import { Fieldset, FieldsetLegend } from '@/components/ui/fieldset'
import { Radio, RadioGroup } from '@/components/ui/radio-group'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MULTI_LANGUAGE } from '@/lib/config/i18n'
import { LANGUAGE_ITEMS } from '@/lib/validations/settings'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

const THEMES: Array<{ value: Theme; label: string }> = [
  {
    value: 'system',
    get label() {
      return m.common_system()
    },
  },
  {
    value: 'light',
    get label() {
      return m.settings_theme_light()
    },
  },
  {
    value: 'dark',
    get label() {
      return m.settings_theme_dark()
    },
  },
]

/**
 * The settings dialog's "Aplicación" tab: preferences of this device, open to
 * everyone. They apply on pick, so there is nothing to save. Theme picker based
 * on coss particle p-radio-group-6.
 */
export function AppSettingsPanel() {
  const { theme, setTheme } = useTheme()

  return (
    <>
      <DialogPanel className="flex flex-col gap-6">
        <Field className="gap-4" name="theme" render={(fieldProps) => <Fieldset {...fieldProps} />}>
          <FieldsetLegend className="text-sm font-medium">{m.common_section_appearance()}</FieldsetLegend>
          <RadioGroup
            className="flex-row flex-wrap gap-4"
            value={theme}
            onValueChange={(value) => {
              setTheme(value as Theme)
            }}
          >
            {THEMES.map((item) => (
              <FieldItem key={item.value}>
                <FieldLabel className="cursor-pointer flex-col">
                  <Radio className="peer sr-only absolute" value={item.value} />
                  <span className="relative block h-17.5 w-22 overflow-hidden rounded-lg shadow-xs transition-shadow not-peer-data-checked:opacity-80 peer-data-checked:ring-2 peer-data-checked:ring-primary/48 peer-data-checked:ring-offset-1 peer-data-checked:ring-offset-background">
                    {THEME_PREVIEW[item.value]}
                  </span>
                  <span className="not-peer-data-checked:text-muted-foreground/70">{item.label}</span>
                </FieldLabel>
              </FieldItem>
            ))}
          </RadioGroup>
          <FieldDescription>{m.settings_appearance_description()}</FieldDescription>
        </Field>

        {MULTI_LANGUAGE && (
          <Field name="language">
            <FieldLabel>{m.common_language()}</FieldLabel>
            <Select
              items={LANGUAGE_ITEMS}
              value={getLocale()}
              onValueChange={(value) => {
                if (value) pickLanguage(value)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {LANGUAGE_ITEMS.map((item) => (
                  // Each name in its own language, so anyone can find theirs.
                  <SelectItem key={item.value} value={item.value} lang={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
            <FieldDescription>{m.settings_screen_language_hint()}</FieldDescription>
          </Field>
        )}
      </DialogPanel>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>{m.common_action_done()}</DialogClose>
      </DialogFooter>
    </>
  )
}

/** Miniature window per theme; decorative only, the label carries the meaning. */
const THEME_PREVIEW: Record<Theme, React.ReactNode> = {
  dark: (
    <svg aria-hidden className="size-full" fill="none" viewBox="0 0 88 70" xmlns="http://www.w3.org/2000/svg">
      <path className="fill-neutral-900" d="M0 0h88v70H0z" />
      <path className="fill-neutral-800 shadow-sm" d="M10 12a4 4 0 0 1 4-4h74v62H10V12Z" />
      <circle className="fill-neutral-600" cx="28" cy="26" r="8" />
      <rect className="fill-neutral-700" height="4" rx="2" width="58" x="20" y="42" />
      <rect className="fill-neutral-700" height="4" rx="2" width="58" x="20" y="49" />
      <rect className="fill-neutral-700" height="4" rx="2" width="29" x="20" y="56" />
    </svg>
  ),
  light: (
    <svg aria-hidden className="size-full" fill="none" viewBox="0 0 88 70" xmlns="http://www.w3.org/2000/svg">
      <path className="fill-neutral-200" d="M0 0h88v70H0z" />
      <path className="fill-white shadow-sm" d="M10 12a4 4 0 0 1 4-4h74v62H10V12Z" />
      <circle className="fill-neutral-300" cx="28" cy="26" r="8" />
      <rect className="fill-neutral-200" height="4" rx="2" width="58" x="20" y="42" />
      <rect className="fill-neutral-200" height="4" rx="2" width="58" x="20" y="49" />
      <rect className="fill-neutral-200" height="4" rx="2" width="29" x="20" y="56" />
    </svg>
  ),
  system: (
    <svg aria-hidden className="size-full" fill="none" viewBox="0 0 88 70" xmlns="http://www.w3.org/2000/svg">
      <path className="fill-neutral-200" d="M0 0h44v70H0z" />
      <path className="fill-neutral-900" d="M44 0h44v70H44z" />
      <path className="fill-white shadow-sm" d="M10 12a4 4 0 0 1 4-4h30v62H10V12Z" />
      <circle className="fill-neutral-300" cx="28" cy="26" r="8" />
      <path
        className="fill-neutral-200"
        d="M20 44a2 2 0 0 1 2-2h22v4H22a2 2 0 0 1-2-2ZM20 51a2 2 0 0 1 2-2h22v4H22a2 2 0 0 1-2-2ZM20 58a2 2 0 0 1 2-2h22v4H22a2 2 0 0 1-2-2Z"
      />
      <path className="fill-neutral-800 shadow-sm" d="M54 12a4 4 0 0 1 4-4h30v62H54V12Z" />
      <circle className="fill-neutral-600" cx="72" cy="26" r="8" />
      <path
        className="fill-neutral-700"
        d="M64 44a2 2 0 0 1 2-2h22v4H66a2 2 0 0 1-2-2ZM64 51a2 2 0 0 1 2-2h22v4H66a2 2 0 0 1-2-2ZM64 58a2 2 0 0 1 2-2h22v4H66a2 2 0 0 1-2-2Z"
      />
    </svg>
  ),
}

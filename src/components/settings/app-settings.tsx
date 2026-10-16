import { IconAccessible, IconLanguage, IconPalette } from '@tabler/icons-react'
import {
  setReduceMotion,
  setTextSize,
  type TextSize,
  useReduceMotion,
  useTextSize,
} from '@/components/accessibility-preferences'
import { pickLanguage } from '@/components/language-menu'
import { SettingsCard, SettingsGrid } from '@/components/settings/settings-card'
import { type Theme, useTheme } from '@/components/theme-provider'
import { Field, FieldDescription, FieldItem, FieldLabel } from '@/components/ui/field'
import { Fieldset, FieldsetLegend } from '@/components/ui/fieldset'
import { Label } from '@/components/ui/label'
import { Radio, RadioGroup } from '@/components/ui/radio-group'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { MULTI_LANGUAGE } from '@/lib/config/i18n'
import { cn } from '@/lib/utils'
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

/** The "Aa" in each tile grows by the same steps as the page (see globals.css). */
const TEXT_SIZES: Array<{ value: TextSize; label: string; className: string }> = [
  {
    value: 'normal',
    get label() {
      return m.settings_text_size_normal()
    },
    className: 'text-2xl',
  },
  {
    value: 'large',
    get label() {
      return m.settings_text_size_large()
    },
    className: 'text-[1.6875rem]',
  },
  {
    value: 'larger',
    get label() {
      return m.settings_text_size_larger()
    },
    className: 'text-3xl',
  },
]

/** Three options in a row; on a narrow phone with large text the tiles shrink instead of stacking. */
const PICKER_CLASS = 'grid w-fit grid-cols-[repeat(3,minmax(0,5.5rem))] gap-4'
/** A picker option's preview; the radio before it (`peer`) is visually hidden. */
const TILE_CLASS =
  'relative block aspect-88/70 w-full overflow-hidden rounded-lg shadow-xs transition-[box-shadow,opacity,scale] duration-150 ease-out not-peer-data-checked:opacity-80 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background peer-data-checked:ring-2 peer-data-checked:ring-primary/48 peer-data-checked:ring-offset-1 peer-data-checked:ring-offset-background not-peer-data-checked:hover:opacity-100 active:scale-[0.97]'
const TILE_LABEL_CLASS =
  'text-center transition-colors duration-150 not-peer-data-checked:text-muted-foreground/70'

/**
 * The settings page's "Aplicación" tab: preferences of this device, open to
 * everyone. They apply on pick, so there is nothing to save. Theme picker based
 * on coss particle p-radio-group-6.
 */
export function AppSettingsPanel() {
  const { theme, setTheme } = useTheme()
  const textSize = useTextSize()
  const reduceMotion = useReduceMotion()

  return (
    <SettingsGrid>
      <SettingsCard
        title={m.common_section_appearance()}
        description={m.settings_app_description()}
        icon={IconPalette}
      >
        <Field
          className="gap-4"
          name="theme"
          render={(fieldProps) => <Fieldset {...fieldProps} aria-label={m.common_section_appearance()} />}
        >
          <RadioGroup
            className={PICKER_CLASS}
            value={theme}
            onValueChange={(value) => {
              setTheme(value as Theme)
            }}
          >
            {THEMES.map((item) => (
              <FieldItem key={item.value}>
                <FieldLabel className="w-full min-w-0 cursor-pointer flex-col">
                  <Radio className="peer sr-only absolute" value={item.value} />
                  <span className={TILE_CLASS}>{THEME_PREVIEW[item.value]}</span>
                  <span className={TILE_LABEL_CLASS}>{item.label}</span>
                </FieldLabel>
              </FieldItem>
            ))}
          </RadioGroup>
          <FieldDescription>{m.settings_appearance_description()}</FieldDescription>
        </Field>
      </SettingsCard>

      {MULTI_LANGUAGE && (
        <SettingsCard
          title={m.common_language()}
          description={m.settings_screen_language_hint()}
          icon={IconLanguage}
        >
          <Field name="language">
            <Select
              aria-label={m.common_language()}
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
          </Field>
        </SettingsCard>
      )}

      <SettingsCard
        title={m.settings_accessibility()}
        description={m.settings_accessibility_description()}
        icon={IconAccessible}
      >
        <Field className="gap-4" name="text-size" render={(fieldProps) => <Fieldset {...fieldProps} />}>
          <FieldsetLegend className="text-sm font-medium">{m.settings_text_size()}</FieldsetLegend>
          <RadioGroup
            className={PICKER_CLASS}
            value={textSize}
            onValueChange={(value) => {
              setTextSize(value as TextSize)
            }}
          >
            {TEXT_SIZES.map((item) => (
              <FieldItem key={item.value}>
                <FieldLabel className="w-full min-w-0 cursor-pointer flex-col">
                  <Radio className="peer sr-only absolute" value={item.value} />
                  <span className={TILE_CLASS}>
                    <span
                      aria-hidden
                      className={cn(
                        'flex size-full items-center justify-center bg-muted font-semibold',
                        item.className,
                      )}
                    >
                      Aa
                    </span>
                  </span>
                  <span className={TILE_LABEL_CLASS}>{item.label}</span>
                </FieldLabel>
              </FieldItem>
            ))}
          </RadioGroup>
          <FieldDescription>{m.settings_text_size_description()}</FieldDescription>
        </Field>

        {/* Same row as the residents picker's "only unassigned" switch. */}
        <Label className="flex w-full items-start rounded-lg border p-3 hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50">
          <Switch
            checked={reduceMotion}
            onCheckedChange={(checked) => {
              setReduceMotion(checked)
            }}
          />
          <span className="grid gap-1">
            <span>{m.settings_reduce_motion()}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {m.settings_reduce_motion_description()}
            </span>
          </span>
        </Label>
      </SettingsCard>
    </SettingsGrid>
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

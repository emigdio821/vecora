import { IconChevronDown, type TablerIcon } from '@tabler/icons-react'
import type { Editor } from '@tiptap/react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Menu, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { toggleVariants } from '@/components/ui/toggle'
import { ToolbarButton } from '@/components/ui/toolbar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/** Menu and popover buttons look pressed, like the toggles, while their format is on. */
export const ACTIVE_TRIGGER_CLASS = 'data-active:bg-input/64 data-active:text-accent-foreground'

/**
 * Buttons that can be disabled are ToolbarButtons of their own, styled like a Button or a
 * Toggle, not rendering one. Rendering one, the toolbar hands it a React `disabled`, and
 * React then drops the mouse moves a tooltip's delay waits for: no tooltip on hover. It
 * keeps them focusable instead (never `:disabled`), so they're dimmed by data-disabled.
 */
const DISABLED_CLASS =
  'data-disabled:cursor-default data-disabled:opacity-64 data-disabled:hover:bg-transparent'

/**
 * A click on a toolbar button would move focus (and the selection) out of the
 * text: the next keys would land on the button. Skipping the mousedown's focus
 * keeps the cursor where it was; keyboard users still Tab into the toolbar.
 */
export function keepEditorFocus(event: React.MouseEvent) {
  event.preventDefault()
}

/** For a closing menu or popover: back to the text, where the cursor was, instead of the button. */
export function returnFocusToEditor(editor: Editor) {
  editor.commands.focus()
  return false
}

interface FormatToggleProps {
  label: string
  icon: TablerIcon
  pressed: boolean
  disabled?: boolean
  onToggle: () => void
}

export function FormatToggle({ label, icon: Icon, pressed, disabled, onToggle }: FormatToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ToolbarButton
            type="button"
            aria-label={label}
            aria-pressed={pressed}
            data-pressed={pressed ? '' : undefined}
            disabled={disabled}
            className={cn(toggleVariants({ size: 'sm' }), DISABLED_CLASS)}
            onMouseDown={(event) => {
              keepEditorFocus(event)
            }}
            onClick={() => {
              onToggle()
            }}
          />
        }
      >
        <Icon />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

interface HistoryButtonProps {
  label: string
  icon: TablerIcon
  disabled: boolean
  onClick: () => void
}

export function HistoryButton({ label, icon: Icon, disabled, onClick }: HistoryButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ToolbarButton
            type="button"
            aria-label={label}
            disabled={disabled}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), DISABLED_CLASS)}
            onMouseDown={(event) => {
              keepEditorFocus(event)
            }}
            onClick={() => {
              onClick()
            }}
          />
        }
      >
        <Icon />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

interface ToolbarMenuProps {
  editor: Editor
  label: string
  icon: TablerIcon
  isActive: boolean
  children: React.ReactNode
}

/** A toolbar button that opens a list of options (headings, lists, colors). */
export function ToolbarMenu({ editor, label, icon: Icon, isActive, children }: ToolbarMenuProps) {
  return (
    <Menu>
      <Tooltip>
        <TooltipTrigger
          render={
            <MenuTrigger
              render={
                <ToolbarButton
                  aria-label={label}
                  onMouseDown={(event) => {
                    keepEditorFocus(event)
                  }}
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      data-active={isActive || undefined}
                      className={`gap-0.5 px-1.5 ${ACTIVE_TRIGGER_CLASS}`}
                    />
                  }
                />
              }
            />
          }
        >
          <Icon />
          <IconChevronDown className="size-3" />
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <MenuPopup
        align="start"
        finalFocus={() => {
          return returnFocusToEditor(editor)
        }}
      >
        {children}
      </MenuPopup>
    </Menu>
  )
}

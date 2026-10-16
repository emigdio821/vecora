import { IconChevronDown, type TablerIcon } from '@tabler/icons-react'
import type { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Menu, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { Toggle } from '@/components/ui/toggle'
import { ToolbarButton } from '@/components/ui/toolbar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/** Menu and popover buttons look pressed, like the toggles, while their format is on. */
export const ACTIVE_TRIGGER_CLASS = 'data-active:bg-input/64 data-active:text-accent-foreground'

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
            aria-label={label}
            disabled={disabled}
            onMouseDown={(event) => {
              keepEditorFocus(event)
            }}
            render={
              <Toggle
                size="sm"
                pressed={pressed}
                onPressedChange={() => {
                  onToggle()
                }}
              />
            }
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
            aria-label={label}
            disabled={disabled}
            onMouseDown={(event) => {
              keepEditorFocus(event)
            }}
            onClick={() => {
              onClick()
            }}
            render={<Button type="button" variant="ghost" size="icon-sm" />}
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

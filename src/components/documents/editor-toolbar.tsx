import {
  IconAlignCenter,
  IconAlignJustified,
  IconAlignLeft,
  IconAlignRight,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBlockquote,
  IconBold,
  IconCheck,
  IconChevronDown,
  IconH1,
  IconH2,
  IconH3,
  IconH4,
  IconHeading,
  IconHighlight,
  IconHighlightOff,
  IconItalic,
  IconLink,
  IconLinkOff,
  IconList,
  IconListNumbers,
  IconPhoto,
  IconStrikethrough,
  IconUnderline,
  type TablerIcon,
} from '@tabler/icons-react'
import { type Editor, useEditorState } from '@tiptap/react'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from '@/components/ui/menu'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { Toggle } from '@/components/ui/toggle'
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from '@/components/ui/toolbar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  HEADING_LEVELS,
  HIGHLIGHT_COLORS,
  type HeadingLevel,
  type HighlightColor,
  imageAlign,
  normalizeLink,
  TEXT_ALIGNS,
  type TextAlign,
} from '@/lib/validations/documents'
import { m } from '@/paraglide/messages'
import { IMAGE_FILE_TYPES, insertImages } from './editor-images'

const HEADING_ICON: Record<HeadingLevel, TablerIcon> = {
  1: IconH1,
  2: IconH2,
  3: IconH3,
  4: IconH4,
}

const HIGHLIGHT_OPTIONS: { color: HighlightColor; label: () => string }[] = [
  { color: HIGHLIGHT_COLORS[0], label: () => m.documents_highlight_yellow() },
  { color: HIGHLIGHT_COLORS[1], label: () => m.documents_highlight_green() },
  { color: HIGHLIGHT_COLORS[2], label: () => m.documents_highlight_blue() },
  { color: HIGHLIGHT_COLORS[3], label: () => m.documents_highlight_pink() },
  { color: HIGHLIGHT_COLORS[4], label: () => m.documents_highlight_purple() },
]

/** Menu and popover buttons look pressed, like the toggles, while their format is on. */
const ACTIVE_TRIGGER_CLASS = 'data-active:bg-input/64 data-active:text-accent-foreground'

/**
 * A click on a toolbar button would move focus (and the selection) out of the
 * text: the next keys would land on the button. Skipping the mousedown's focus
 * keeps the cursor where it was; keyboard users still Tab into the toolbar.
 */
function keepEditorFocus(event: React.MouseEvent) {
  event.preventDefault()
}

/** For a closing menu or popover: back to the text, where the cursor was, instead of the button. */
function returnFocusToEditor(editor: Editor) {
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

function FormatToggle({ label, icon: Icon, pressed, disabled, onToggle }: FormatToggleProps) {
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

function HistoryButton({ label, icon: Icon, disabled, onClick }: HistoryButtonProps) {
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
function ToolbarMenu({ editor, label, icon: Icon, isActive, children }: ToolbarMenuProps) {
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

interface LinkPopoverProps {
  editor: Editor
  isActive: boolean
}

/** The address of the selected text's link; with nothing selected, the address becomes the text. */
function LinkPopover({ editor, isActive }: LinkPopoverProps) {
  const [open, setOpen] = useState(false)
  const [address, setAddress] = useState('')
  const [isInvalid, setInvalid] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      // Editing a link starts from its current address.
      const current: unknown = editor.getAttributes('link').href
      setAddress(typeof current === 'string' ? current : '')
      setInvalid(false)
    }
    setOpen(nextOpen)
  }

  function applyLink() {
    const href = normalizeLink(address)
    if (!href) {
      setInvalid(true)
      return
    }

    const isNothingSelected = editor.state.selection.empty
    if (isNothingSelected && !editor.isActive('link')) {
      editor
        .chain()
        .focus()
        .insertContent({ type: 'text', text: address.trim(), marks: [{ type: 'link', attrs: { href } }] })
        .run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    }
    setOpen(false)
  }

  function removeLink() {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <ToolbarButton
                  aria-label={m.documents_format_link()}
                  onMouseDown={(event) => {
                    keepEditorFocus(event)
                  }}
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      data-active={isActive || undefined}
                      className={ACTIVE_TRIGGER_CLASS}
                    />
                  }
                />
              }
            />
          }
        >
          <IconLink />
        </TooltipTrigger>
        <TooltipContent>{m.documents_format_link()}</TooltipContent>
      </Tooltip>
      <PopoverPopup
        align="start"
        className="w-80"
        initialFocus={inputRef}
        finalFocus={() => {
          return returnFocusToEditor(editor)
        }}
      >
        <div className="flex flex-col gap-3">
          <Field invalid={isInvalid}>
            <FieldLabel htmlFor={inputId}>{m.documents_link_address()}</FieldLabel>
            <Input
              id={inputId}
              ref={inputRef}
              value={address}
              autoComplete="off"
              onChange={(event) => {
                setAddress(event.currentTarget.value)
                setInvalid(false)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  // Not the document's form: Enter here only applies the link.
                  event.preventDefault()
                  applyLink()
                }
              }}
            />
            <FieldDescription>{m.documents_link_hint()}</FieldDescription>
            <FieldError match={isInvalid}>{m.documents_link_invalid()}</FieldError>
          </Field>
          <div className="flex justify-end gap-2">
            {isActive && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  removeLink()
                }}
              >
                <IconLinkOff className="size-4" />
                {m.documents_link_remove()}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => {
                applyLink()
              }}
            >
              {m.documents_link_apply()}
            </Button>
          </div>
        </div>
      </PopoverPopup>
    </Popover>
  )
}

/** Pictures from the device, added where the cursor is. */
function ImageButton({ editor }: { editor: Editor }) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <ToolbarButton
              aria-label={m.documents_format_image()}
              onMouseDown={(event) => {
                keepEditorFocus(event)
              }}
              onClick={() => {
                inputRef.current?.click()
              }}
              render={<Button type="button" variant="ghost" size="icon-sm" />}
            />
          }
        >
          <IconPhoto />
        </TooltipTrigger>
        <TooltipContent>{m.documents_format_image()}</TooltipContent>
      </Tooltip>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_FILE_TYPES.join(',')}
        multiple
        hidden
        tabIndex={-1}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? [])
          // Cleared, so picking the same picture again still counts as a change.
          event.currentTarget.value = ''
          void insertImages(editor, files)
        }}
      />
    </>
  )
}

/** What the alignment buttons show: the selected image's, or the text's. */
function currentAlignment(editor: Editor): TextAlign {
  if (editor.isActive('image')) {
    const align: unknown = editor.getAttributes('image').textAlign
    return imageAlign(TEXT_ALIGNS.find((option) => option === align))
  }
  const picked = TEXT_ALIGNS.find((align) => align !== 'left' && editor.isActive({ textAlign: align }))
  // No alignment picked yet reads as left, like the PDF.
  return picked ?? 'left'
}

/** Laid out like Tiptap's simple editor: history, blocks, inline formats, alignment, image. */
export function EditorToolbar({ editor }: { editor: Editor }) {
  // Re-renders the toolbar only when one of these changes, not on every keystroke.
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const highlight: unknown = current.getAttributes('highlight').color
      return {
        headingLevel: HEADING_LEVELS.find((level) => current.isActive('heading', { level })) ?? null,
        isBulletList: current.isActive('bulletList'),
        isOrderedList: current.isActive('orderedList'),
        isBlockquote: current.isActive('blockquote'),
        isBold: current.isActive('bold'),
        isItalic: current.isActive('italic'),
        isStrike: current.isActive('strike'),
        isUnderline: current.isActive('underline'),
        isHighlight: current.isActive('highlight'),
        highlightColor: typeof highlight === 'string' ? highlight : null,
        isLink: current.isActive('link'),
        isImage: current.isActive('image'),
        alignment: currentAlignment(current),
        canUndo: current.can().undo(),
        canRedo: current.can().redo(),
      }
    },
  })

  return (
    <Toolbar
      aria-label={m.documents_toolbar()}
      className="shrink-0 flex-wrap gap-1 rounded-none rounded-t-[calc(var(--radius-lg)-1px)] border-0 border-b bg-transparent"
    >
      <ToolbarGroup>
        <HistoryButton
          label={m.common_action_undo()}
          icon={IconArrowBackUp}
          disabled={!state.canUndo}
          onClick={() => {
            editor.chain().focus().undo().run()
          }}
        />
        <HistoryButton
          label={m.documents_redo()}
          icon={IconArrowForwardUp}
          disabled={!state.canRedo}
          onClick={() => {
            editor.chain().focus().redo().run()
          }}
        />
      </ToolbarGroup>

      <ToolbarSeparator orientation="vertical" />

      <ToolbarGroup>
        <ToolbarMenu
          editor={editor}
          label={m.documents_format_headings()}
          icon={state.headingLevel ? HEADING_ICON[state.headingLevel] : IconHeading}
          isActive={state.headingLevel !== null}
        >
          {HEADING_LEVELS.map((level) => {
            const Icon = HEADING_ICON[level]
            return (
              <MenuItem
                key={level}
                onClick={() => {
                  // Choosing the current level again turns the line back into text.
                  editor.chain().focus().toggleHeading({ level }).run()
                }}
              >
                <Icon />
                <span className="flex-1">{m.documents_heading_level({ level })}</span>
                {state.headingLevel === level && <IconCheck />}
              </MenuItem>
            )
          })}
        </ToolbarMenu>

        <ToolbarMenu
          editor={editor}
          label={m.documents_format_lists()}
          icon={state.isOrderedList ? IconListNumbers : IconList}
          isActive={state.isBulletList || state.isOrderedList}
        >
          <MenuItem
            onClick={() => {
              editor.chain().focus().toggleBulletList().run()
            }}
          >
            <IconList />
            <span className="flex-1">{m.documents_format_bullet_list()}</span>
            {state.isBulletList && <IconCheck />}
          </MenuItem>
          <MenuItem
            onClick={() => {
              editor.chain().focus().toggleOrderedList().run()
            }}
          >
            <IconListNumbers />
            <span className="flex-1">{m.documents_format_ordered_list()}</span>
            {state.isOrderedList && <IconCheck />}
          </MenuItem>
        </ToolbarMenu>

        <FormatToggle
          label={m.documents_format_blockquote()}
          icon={IconBlockquote}
          pressed={state.isBlockquote}
          onToggle={() => {
            editor.chain().focus().toggleBlockquote().run()
          }}
        />
      </ToolbarGroup>

      <ToolbarSeparator orientation="vertical" />

      <ToolbarGroup>
        <FormatToggle
          label={m.documents_format_bold()}
          icon={IconBold}
          pressed={state.isBold}
          onToggle={() => {
            editor.chain().focus().toggleBold().run()
          }}
        />
        <FormatToggle
          label={m.documents_format_italic()}
          icon={IconItalic}
          pressed={state.isItalic}
          onToggle={() => {
            editor.chain().focus().toggleItalic().run()
          }}
        />
        <FormatToggle
          label={m.documents_format_strike()}
          icon={IconStrikethrough}
          pressed={state.isStrike}
          onToggle={() => {
            editor.chain().focus().toggleStrike().run()
          }}
        />
        <FormatToggle
          label={m.documents_format_underline()}
          icon={IconUnderline}
          pressed={state.isUnderline}
          onToggle={() => {
            editor.chain().focus().toggleUnderline().run()
          }}
        />

        <ToolbarMenu
          editor={editor}
          label={m.documents_format_highlight()}
          icon={IconHighlight}
          isActive={state.isHighlight}
        >
          {HIGHLIGHT_OPTIONS.map((option) => (
            <MenuItem
              key={option.color}
              onClick={() => {
                // With only the cursor inside a highlight, the whole highlight changes color.
                editor
                  .chain()
                  .focus()
                  .extendMarkRange('highlight')
                  .setHighlight({ color: option.color })
                  .run()
              }}
            >
              <span
                aria-hidden
                className="size-4 shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: option.color }}
              />
              <span className="flex-1">{option.label()}</span>
              {state.highlightColor === option.color && <IconCheck />}
            </MenuItem>
          ))}
          <MenuSeparator />
          <MenuItem
            disabled={!state.isHighlight}
            onClick={() => {
              editor.chain().focus().extendMarkRange('highlight').unsetHighlight().run()
            }}
          >
            <IconHighlightOff />
            {m.documents_highlight_remove()}
          </MenuItem>
        </ToolbarMenu>

        <LinkPopover editor={editor} isActive={state.isLink} />
      </ToolbarGroup>

      <ToolbarSeparator orientation="vertical" />

      <ToolbarGroup>
        <FormatToggle
          label={m.documents_align_left()}
          icon={IconAlignLeft}
          pressed={state.alignment === 'left'}
          onToggle={() => {
            editor.chain().focus().setTextAlign('left').run()
          }}
        />
        <FormatToggle
          label={m.documents_align_center()}
          icon={IconAlignCenter}
          pressed={state.alignment === 'center'}
          onToggle={() => {
            editor.chain().focus().setTextAlign('center').run()
          }}
        />
        <FormatToggle
          label={m.documents_align_right()}
          icon={IconAlignRight}
          pressed={state.alignment === 'right'}
          onToggle={() => {
            editor.chain().focus().setTextAlign('right').run()
          }}
        />
        <FormatToggle
          label={m.documents_align_justify()}
          icon={IconAlignJustified}
          pressed={state.alignment === 'justify'}
          // An image can't be justified, only placed.
          disabled={state.isImage}
          onToggle={() => {
            editor.chain().focus().setTextAlign('justify').run()
          }}
        />
      </ToolbarGroup>

      <ToolbarSeparator orientation="vertical" />

      <ToolbarGroup>
        <ImageButton editor={editor} />
      </ToolbarGroup>
    </Toolbar>
  )
}

import { IconLink, IconLinkOff } from '@tabler/icons-react'
import type { Editor } from '@tiptap/react'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { ToolbarButton } from '@/components/ui/toolbar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { normalizeLink } from '@/lib/validations/documents'
import { m } from '@/paraglide/messages'
import { ACTIVE_TRIGGER_CLASS, keepEditorFocus, returnFocusToEditor } from './editor-toolbar-controls'

interface LinkPopoverProps {
  editor: Editor
  isActive: boolean
}

/** The address of the selected text's link; with nothing selected, the address becomes the text. */
export function LinkPopover({ editor, isActive }: LinkPopoverProps) {
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

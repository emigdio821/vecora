import FileHandler from '@tiptap/extension-file-handler'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { Markdown } from '@tiptap/markdown'
import { Editor, EditorContent, type JSONContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useImperativeHandle } from 'react'
import { cn } from '@/lib/utils'
import { HEADING_LEVELS, isAllowedLink } from '@/lib/validations/documents'
import { DocumentImage } from './document-image'
import { IMAGE_FILE_TYPES, insertImages, isOnlyImageHtml } from './editor-images'
import { MarkdownPaste } from './editor-markdown'
import { EditorToolbar } from './editor-toolbar'

// Only what the PDF can draw (see documentSchema): pasted code or rules come in as plain text.
const extensions = [
  StarterKit.configure({
    heading: { levels: [...HEADING_LEVELS] },
    code: false,
    codeBlock: false,
    horizontalRule: false,
    link: {
      // Clicking a link puts the cursor in it to edit it; the PDF is where it opens.
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      isAllowedUri: (url) => isAllowedLink(url),
    },
  }),
  Highlight.configure({ multicolor: true }),
  // Images too: the same buttons put a selected image on the left, center or right.
  TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
  DocumentImage,
  // A single line break stays one ("Atentamente,⏎La mesa directiva"), as the chat showed it.
  Markdown.configure({ markedOptions: { breaks: true } }),
  MarkdownPaste,
  // Pictures pasted (a screenshot) or dropped from the computer.
  FileHandler.configure({
    allowedMimeTypes: IMAGE_FILE_TYPES,
    onPaste: (editor, files, html) => {
      // Copied from Word, the text comes with a picture of itself: the text is what was meant.
      if (isOnlyImageHtml(html)) {
        void insertImages(editor, files)
      }
    },
    onDrop: (editor, files, position) => {
      void insertImages(editor, files, position)
    },
  }),
]

// The text is styled like the PDF by typeset-document (src/styles/typeset-document.css).
// flex-1: fills the scroll area below the toolbar, so a click anywhere in it starts typing.
const CONTENT_CLASS = 'typeset typeset-document min-h-72 flex-1 px-[calc(--spacing(3)-1px)] py-2 outline-none'

/**
 * Markdown as the editor's content, read the way a paste is (the templates). An editor
 * that's never shown does the parsing, so the result fits this editor exactly. Browser only.
 */
export function markdownToContent(markdown: string): JSONContent {
  const editor = new Editor({ extensions, content: markdown, contentType: 'markdown' })
  const content = editor.getJSON()
  editor.destroy()
  return content
}

export interface RichTextEditorHandle {
  focus: () => void
}

interface RichTextEditorProps {
  /** Read once, when the editor mounts; remount it (with a key) to load other content. */
  value: JSONContent
  onChange: (value: JSONContent) => void
  onBlur?: () => void
  /** react-hook-form focuses it when the content is the first invalid field. */
  ref?: React.Ref<RichTextEditorHandle>
  invalid?: boolean
  /** The id of the label naming the text box. */
  labelId: string
  className?: string
}

/**
 * Rich text with a formatting toolbar. Browser only: the page renders it inside ClientOnly.
 * The text scrolls under the toolbar once the box reaches 70% of the screen; a parent that
 * sizes it instead (max-h-none flex-1) gets the whole box.
 */
export function RichTextEditor({
  value,
  onChange,
  onBlur,
  ref,
  invalid,
  labelId,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions,
    content: value,
    immediatelyRender: true,
    onUpdate: ({ editor: updated }) => {
      onChange(updated.getJSON())
    },
    onBlur: () => {
      onBlur?.()
    },
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': labelId,
        class: CONTENT_CLASS,
      },
    },
  })

  useImperativeHandle(ref, () => ({
    focus: () => {
      editor.commands.focus()
    },
  }))

  return (
    <div
      data-invalid={invalid || undefined}
      className={cn(
        'relative flex max-h-[70vh] w-full flex-col rounded-lg border border-input bg-background text-base shadow-xs/5 ring-ring/24 transition-shadow not-dark:bg-clip-padding has-focus-visible:border-ring has-focus-visible:ring-[3px] data-invalid:border-destructive/36 has-focus-visible:data-invalid:border-destructive/64 has-focus-visible:data-invalid:ring-destructive/16 sm:text-sm dark:bg-input/32 dark:data-invalid:ring-destructive/24',
        className,
      )}
    >
      <EditorToolbar editor={editor} />

      <EditorContent
        editor={editor}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-b-[calc(var(--radius-lg)-1px)]"
      />
    </div>
  )
}

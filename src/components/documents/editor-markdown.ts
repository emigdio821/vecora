import { Extension, type JSONContent } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

/** A line only Markdown starts like that: a heading, a list item or a quote. */
const MARKDOWN_LINE = /^(#{1,6} |[-*+] |\d+[.)] |> )/m
/** Bold or a link, anywhere in the text. */
const MARKDOWN_INLINE = /\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\s]+\)/
/** The whole reply inside a code block, as some assistants answer when asked for a format. */
const FENCED_REPLY = /^\s*```(?:markdown|md)?[^\S\n]*\n([\s\S]*?)\n```\s*$/

function looksLikeMarkdown(text: string): boolean {
  return MARKDOWN_LINE.test(text) || MARKDOWN_INLINE.test(text)
}

/**
 * Without the pictures: in Markdown they're addresses on other sites, and the PDF only
 * draws the ones the document carries (see DocumentImage).
 */
function withoutImages(nodes: JSONContent[]): JSONContent[] {
  const kept: JSONContent[] = []
  for (const node of nodes) {
    if (node.type === 'image') {
      continue
    }
    if (node.content) {
      kept.push({ ...node, content: withoutImages(node.content) })
    } else {
      kept.push(node)
    }
  }
  return kept
}

/**
 * Pasted Markdown comes in formatted. An assistant's "Copy" button (ChatGPT, Gemini,
 * Claude) gives its reply as Markdown text, which would otherwise show its ## and **.
 * Only plain text: what comes with its own formatting (HTML) is pasted as usual.
 * Needs the Markdown extension, which does the parsing.
 */
export const MarkdownPaste = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    const editor = this.editor

    return [
      new Plugin({
        key: new PluginKey('markdownPaste'),
        props: {
          handlePaste: (_view, event) => {
            const html = event.clipboardData?.getData('text/html')
            let text = event.clipboardData?.getData('text/plain') ?? ''
            if (html || !editor.markdown) {
              return false
            }

            const fenced = FENCED_REPLY.exec(text)
            if (fenced) {
              text = fenced[1]
            }
            if (!looksLikeMarkdown(text)) {
              return false
            }

            const content = withoutImages(editor.markdown.parse(text).content ?? [])
            if (content.length === 0) {
              return false
            }
            editor.commands.insertContent(content)
            return true
          },
        },
      }),
    ]
  },
})

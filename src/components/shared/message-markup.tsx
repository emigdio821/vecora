import type React from 'react'

/**
 * Renderers for markup in messages, for `<ParaglideMessage markup={messageMarkup} />`.
 * `{#b}…{/b}` marks the UI label the copy points to (a section, a field, a button);
 * plain `m.key()` drops the tags, so toasts and server errors still read fine.
 */
export const messageMarkup = {
  b: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-medium text-foreground">{children}</strong>
  ),
}

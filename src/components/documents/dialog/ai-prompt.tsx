import { IconCheck, IconCopy } from '@tabler/icons-react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogPanel,
  ResponsiveDialogPopup,
  ResponsiveDialogTitle,
} from '@/components/shared/responsive-dialog'
import { Button } from '@/components/ui/button'
import { toastManager } from '@/components/ui/toast'
import { m } from '@/paraglide/messages'
import { settingsQueryOptions } from '@/tanstack-queries/session'

interface AiPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * A prompt to take to an AI assistant, so its reply only uses what the PDF can draw
 * (the editor turns the Markdown it copies into formatted text, see MarkdownPaste).
 */
export function AiPromptDialog({ open, onOpenChange }: AiPromptDialogProps) {
  const { data: settings } = useSuspenseQuery(settingsQueryOptions)
  const [copied, setCopied] = useState(false)

  const language = settings.defaultLanguage
  // In the HOA's language, like the PDF: the assistant answers in the language it's asked in.
  const prompt = m.documents_ai_prompt(
    { residential: settings.residentialName || m.documents_ai_unnamed_residential({}, { locale: language }) },
    { locale: language },
  )

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      toastManager.add({
        type: 'error',
        title: m.documents_ai_copy_failed(),
        description: m.documents_ai_copy_failed_description(),
      })
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      {/* Wider than the default dialog: the prompt reads in fewer, longer lines. md: the dialog
          only, below it's the full-width drawer. */}
      <ResponsiveDialogPopup className="md:max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{m.documents_ai_write()}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{m.documents_ai_description()}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogPanel className="flex flex-col gap-4">
          <ol className="flex list-decimal flex-col gap-1 ps-5 text-sm">
            <li>{m.documents_ai_step_copy()}</li>
            <li>{m.documents_ai_step_describe()}</li>
            <li>{m.documents_ai_step_paste()}</li>
          </ol>
          {/* Text, not a text box: nothing to edit here, and it can still be selected by hand. */}
          <figure className="flex flex-col gap-2">
            <figcaption className="text-sm font-medium">{m.documents_ai_prompt_label()}</figcaption>
            <p className="rounded-lg border bg-muted px-3 py-2 text-sm whitespace-pre-wrap">{prompt}</p>
          </figure>
        </ResponsiveDialogPanel>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose render={<Button variant="ghost" />}>
            {m.common_action_close()}
          </ResponsiveDialogClose>
          <Button
            onClick={() => {
              void copy()
            }}
          >
            {copied ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />}
            {copied ? m.documents_ai_copied() : m.documents_ai_copy()}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogPopup>
    </ResponsiveDialog>
  )
}

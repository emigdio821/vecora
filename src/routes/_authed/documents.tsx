import { useSuspenseQuery } from '@tanstack/react-query'
import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { StartOverAlertDialog } from '@/components/documents/dialog/start-over'
import { clearDraft, DocumentForm, hasWrittenDraft, saveDraft } from '@/components/documents/document-form'
import { DocumentFormSkeleton } from '@/components/documents/document-form-skeleton'
import { TemplateMenu } from '@/components/documents/template-menu'
import { type DocumentTemplate, templateDocument } from '@/components/documents/templates'
import { pageTitle } from '@/lib/metadata'
import { m } from '@/paraglide/messages'
import { settingsQueryOptions } from '@/tanstack-queries/session'

export const Route = createFileRoute('/_authed/documents')({
  head: () => ({ meta: [{ title: pageTitle(m.common_section_notices()) }] }),
  component: DocumentsPage,
})

function DocumentsPage() {
  const { data: settings } = useSuspenseQuery(settingsQueryOptions)
  // Bumped to remount the form, which loads the draft again: empty, or a template's.
  const [formKey, setFormKey] = useState(0)
  const [isStartOverOpen, setStartOverOpen] = useState(false)
  // What the confirmation replaces the document with; null for a blank one.
  const [pendingTemplate, setPendingTemplate] = useState<DocumentTemplate | null>(null)

  function startFromTemplate(template: DocumentTemplate) {
    // In the HOA's language, like the PDF it becomes.
    saveDraft(templateDocument(template, settings.defaultLanguage, new Date()))
    setFormKey(formKey + 1)
  }

  return (
    <>
      {/*
       * From md up, exactly one screen tall (the layout's section adds p-4 around it), so the
       * editor takes the space left and only the text scrolls, with the buttons always in view.
       * Phones scroll the whole page: the fields alone fill most of the screen.
       */}
      <div className="flex flex-col gap-4 md:h-[calc(100svh-(--spacing(8)))]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-base font-semibold">{m.common_section_notices()}</h1>
            <p className="text-sm text-muted-foreground">{m.documents_page_description()}</p>
          </div>
          <TemplateMenu
            onSelect={(template) => {
              // Nothing written yet: nothing to lose, so no question.
              if (!hasWrittenDraft()) {
                startFromTemplate(template)
                return
              }
              setPendingTemplate(template)
              setStartOverOpen(true)
            }}
          />
        </div>

        <ClientOnly fallback={<DocumentFormSkeleton />}>
          <DocumentForm
            key={formKey}
            onStartOver={() => {
              setPendingTemplate(null)
              setStartOverOpen(true)
            }}
          />
        </ClientOnly>
      </div>

      <StartOverAlertDialog
        open={isStartOverOpen}
        onOpenChange={setStartOverOpen}
        templateName={pendingTemplate === null ? null : pendingTemplate.name()}
        onConfirm={() => {
          if (pendingTemplate === null) {
            clearDraft()
            setFormKey(formKey + 1)
          } else {
            startFromTemplate(pendingTemplate)
          }
          setStartOverOpen(false)
        }}
      />
    </>
  )
}

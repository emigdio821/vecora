import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import { useState } from 'react'
import { StartOverAlertDialog } from '@/components/documents/dialog/start-over'
import { clearDraft, DocumentForm, hasWrittenDraft, saveDraft } from '@/components/documents/document-form'
import { DocumentFormSkeleton } from '@/components/documents/document-form-skeleton'
import { TemplateMenu } from '@/components/documents/template-menu'
import { templateDocument } from '@/components/documents/templates'
import { toastManager } from '@/components/ui/toast'
import { can } from '@/lib/auth/permissions'
import { pageTitle } from '@/lib/metadata'
import { ISO_DAY } from '@/lib/utils'
import type { DocumentInput } from '@/lib/validations/documents'
import { m } from '@/paraglide/messages'
import { templateDocumentQueryOptions } from '@/tanstack-queries/documents'
import { settingsQueryOptions } from '@/tanstack-queries/session'

export const Route = createFileRoute('/_authed/documents')({
  head: () => ({ meta: [{ title: pageTitle(m.common_section_notices()) }] }),
  component: DocumentsPage,
})

interface PendingTemplate {
  name: string
  document: DocumentInput
}

function DocumentsPage() {
  const { user } = Route.useRouteContext()
  const { data: settings } = useSuspenseQuery(settingsQueryOptions)
  const queryClient = useQueryClient()
  // Bumped to remount the form, which loads the draft again: empty, or a template's.
  const [formKey, setFormKey] = useState(0)
  const [isStartOverOpen, setStartOverOpen] = useState(false)
  // What the confirmation replaces the document with; null for a blank one.
  const [pendingTemplate, setPendingTemplate] = useState<PendingTemplate | null>(null)

  function startFrom(document: DocumentInput) {
    saveDraft(document)
    // A saved template arrives after a fetch: by then the key may have moved on.
    setFormKey((key) => key + 1)
  }

  function offerTemplate(template: PendingTemplate) {
    // Nothing written yet: nothing to lose, so no question.
    if (!hasWrittenDraft()) {
      startFrom(template.document)
      return
    }
    setPendingTemplate(template)
    setStartOverOpen(true)
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
            viewer={{ id: user.id, isAdmin: can(user.roles, { document: ['manage'] }) }}
            onSelect={(template) => {
              offerTemplate({
                name: template.name(),
                // In the HOA's language, like the PDF it becomes.
                document: templateDocument(template, settings.defaultLanguage, new Date()),
              })
            }}
            onSelectSaved={(template) => {
              queryClient.fetchQuery(templateDocumentQueryOptions(template.id)).then(
                (saved) => {
                  offerTemplate({
                    name: template.name,
                    document: { ...saved, date: format(new Date(), ISO_DAY) },
                  })
                },
                () => {
                  toastManager.add({ type: 'error', title: m.documents_template_load_failed() })
                },
              )
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
        templateName={pendingTemplate === null ? null : pendingTemplate.name}
        onConfirm={() => {
          if (pendingTemplate === null) {
            clearDraft()
            setFormKey(formKey + 1)
          } else {
            startFrom(pendingTemplate.document)
          }
          setStartOverOpen(false)
        }}
      />
    </>
  )
}

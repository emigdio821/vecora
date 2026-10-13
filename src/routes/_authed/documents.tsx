import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { StartOverAlertDialog } from '@/components/documents/dialog/start-over'
import { clearDraft, DocumentForm } from '@/components/documents/document-form'
import { DocumentFormSkeleton } from '@/components/documents/document-form-skeleton'
import { pageTitle } from '@/lib/metadata'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/_authed/documents')({
  head: () => ({ meta: [{ title: pageTitle(m.common_section_documents()) }] }),
  component: DocumentsPage,
})

function DocumentsPage() {
  // Bumped to remount the form, empty, after starting over.
  const [formKey, setFormKey] = useState(0)
  const [isStartOverOpen, setStartOverOpen] = useState(false)

  return (
    <>
      {/*
       * From md up, exactly one screen tall (the layout's section adds p-4 around it), so the
       * editor takes the space left and only the text scrolls, with the buttons always in view.
       * Phones scroll the whole page: the fields alone fill most of the screen.
       */}
      <div className="flex flex-col gap-4 md:h-[calc(100svh-(--spacing(8)))]">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-base font-semibold">{m.common_section_documents()}</h1>
          <p className="text-sm text-muted-foreground">{m.documents_page_description()}</p>
        </div>

        <ClientOnly fallback={<DocumentFormSkeleton />}>
          <DocumentForm
            key={formKey}
            onStartOver={() => {
              setStartOverOpen(true)
            }}
          />
        </ClientOnly>
      </div>

      <StartOverAlertDialog
        open={isStartOverOpen}
        onOpenChange={setStartOverOpen}
        onConfirm={() => {
          clearDraft()
          setFormKey(formKey + 1)
          setStartOverOpen(false)
        }}
      />
    </>
  )
}

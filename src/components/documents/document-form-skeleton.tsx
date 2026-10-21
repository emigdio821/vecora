import { Fragment } from 'react'
import { Card, CardFrame, CardFrameFooter, CardFrameHeader, CardPanel } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { m } from '@/paraglide/messages'

/**
 * The editor toolbar's groups, in order (editor-toolbar.tsx: change one, change the other).
 * A menu has a chevron, so it's wider than a button.
 */
const TOOLBAR_GROUPS: ('button' | 'menu')[][] = [
  ['button', 'button'],
  ['menu', 'menu', 'button'],
  ['button', 'button', 'button', 'button', 'menu', 'button'],
  ['button', 'button', 'button', 'button'],
  ['button'],
]

/** A FieldLabel, with the required mark: fixed copy, so it shows as it will be. */
function LabelSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-base/4.5 font-medium text-foreground sm:text-sm/4">
      {children} <span className="text-destructive">*</span>
    </span>
  )
}

/** A FieldDescription; the real text, so it wraps where the form's does. */
function DescriptionSkeleton({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>
}

/** An Input's box, as a block like the buttons'. */
function InputSkeleton() {
  return <Skeleton className="h-9 w-full rounded-lg sm:h-8" />
}

function ToolbarSkeleton() {
  return (
    <div className="flex shrink-0 flex-wrap gap-1 border-b p-1">
      {TOOLBAR_GROUPS.map((group, groupIndex) => (
        <Fragment key={groupIndex}>
          {/* Between groups, like the toolbar's: on a phone it ends a row, it doesn't start one. */}
          {groupIndex > 0 && <div className="my-1.5 w-px self-stretch bg-border" />}
          <div className="flex items-center gap-1">
            {group.map((item, itemIndex) => {
              if (item === 'menu') {
                return (
                  <div key={itemIndex} className="flex h-8 w-9.5 items-center justify-center sm:h-7 sm:w-9">
                    <Skeleton className="h-4 w-6" />
                  </div>
                )
              }
              return (
                <div key={itemIndex} className="flex size-8 items-center justify-center sm:size-7">
                  <Skeleton className="size-4" />
                </div>
              )
            })}
          </div>
        </Fragment>
      ))}
    </div>
  )
}

/** A few lines of a document: a heading, then paragraphs of uneven length. */
function ContentSkeleton() {
  return (
    <div className="flex min-h-72 flex-1 flex-col gap-2.5 overflow-hidden px-[calc(--spacing(3)-1px)] py-3">
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="mt-1.5 h-3 w-full" />
      <Skeleton className="h-3 w-11/12" />
      <Skeleton className="h-3 w-3/5" />
      <Skeleton className="mt-3 h-4 w-1/3" />
      <Skeleton className="mt-1.5 h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/5" />
    </div>
  )
}

/** A Button's box; full width on phones, like the form's stacked buttons. */
function ButtonSkeleton({ className }: { className: string }) {
  return <Skeleton className={cn('h-9 w-full rounded-lg sm:h-8', className)} />
}

/**
 * The form's layout, field for field, while the browser takes over (the draft lives in
 * localStorage). Labels and hints are fixed copy, so they show as they are; only what
 * the draft fills in is a bar. Every box keeps its size and place: nothing moves when
 * the form appears.
 */
export function DocumentFormSkeleton() {
  return (
    <CardFrame aria-busy className="md:min-h-0 md:flex-1">
      <CardFrameHeader className="flex flex-col items-stretch gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <LabelSkeleton>{m.documents_field_header_title()}</LabelSkeleton>
            <InputSkeleton />
            <DescriptionSkeleton>{m.documents_header_title_description()}</DescriptionSkeleton>
          </div>
          <div className="flex flex-col gap-2">
            <LabelSkeleton>{m.common_field_date()}</LabelSkeleton>
            <InputSkeleton />
            <DescriptionSkeleton>{m.documents_date_description()}</DescriptionSkeleton>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <LabelSkeleton>{m.documents_field_title()}</LabelSkeleton>
          <InputSkeleton />
        </div>
      </CardFrameHeader>

      <Card className="md:min-h-0 md:flex-1">
        <CardPanel className="flex flex-col md:min-h-0">
          <div className="flex flex-col gap-2 md:min-h-0 md:flex-1">
            <div className="flex items-center justify-between gap-2">
              <LabelSkeleton>{m.documents_field_content()}</LabelSkeleton>
              {/* The "text for your AI" button, as tall as the label's line like the real one. */}
              <Skeleton className="-my-1.25 h-7 w-32 rounded-md sm:-my-1 sm:h-6 sm:w-30" />
            </div>
            <div className="flex max-h-[70vh] w-full flex-col overflow-hidden rounded-lg border border-input bg-background not-dark:bg-clip-padding md:max-h-none md:min-h-0 md:flex-1 dark:bg-input/32">
              <ToolbarSkeleton />
              <ContentSkeleton />
            </div>
            <DescriptionSkeleton>{m.documents_draft_hint()}</DescriptionSkeleton>
          </div>
        </CardPanel>
      </Card>

      <CardFrameFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <ButtonSkeleton className="sm:w-42" />
        <ButtonSkeleton className="sm:w-36" />
      </CardFrameFooter>
    </CardFrame>
  )
}

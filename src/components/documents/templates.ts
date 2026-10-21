import { format } from 'date-fns'
import { ISO_DAY } from '@/lib/utils'
import { type DocumentInput, documentContentSchema } from '@/lib/validations/documents'
import { m } from '@/paraglide/messages'
import type { Locale } from '@/paraglide/runtime'
import { markdownToContent } from './rich-text-editor'

/**
 * A starting point for a document. Its text is in the HOA's language, like the PDF; the
 * content is Markdown (in messages/documents), with what to fill in between brackets.
 */
export interface DocumentTemplate {
  id: string
  /** In the screen's language, for the menu. */
  name: () => string
  description: () => string
  headerTitle: (locale: Locale) => string
  title: (locale: Locale) => string
  content: (locale: Locale) => string
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'notice',
    name: () => m.documents_template_notice_name(),
    description: () => m.documents_template_notice_description(),
    headerTitle: (locale) => m.documents_template_notice_header({}, { locale }),
    title: (locale) => m.documents_template_notice_title({}, { locale }),
    content: (locale) => m.documents_template_notice_content({}, { locale }),
  },
  {
    id: 'meeting-call',
    name: () => m.documents_template_meeting_call_name(),
    description: () => m.documents_template_meeting_call_description(),
    headerTitle: (locale) => m.documents_template_meeting_call_header({}, { locale }),
    title: (locale) => m.documents_template_meeting_call_title({}, { locale }),
    content: (locale) => m.documents_template_meeting_call_content({}, { locale }),
  },
  {
    id: 'proxy',
    name: () => m.documents_template_proxy_name(),
    description: () => m.documents_template_proxy_description(),
    headerTitle: (locale) => m.documents_template_proxy_header({}, { locale }),
    title: (locale) => m.documents_template_proxy_title({}, { locale }),
    content: (locale) => m.documents_template_proxy_content({}, { locale }),
  },
  {
    id: 'minutes',
    name: () => m.documents_template_minutes_name(),
    description: () => m.documents_template_minutes_description(),
    headerTitle: (locale) => m.documents_template_minutes_header({}, { locale }),
    title: (locale) => m.documents_template_minutes_title({}, { locale }),
    content: (locale) => m.documents_template_minutes_content({}, { locale }),
  },
  {
    id: 'fee-reminder',
    name: () => m.documents_template_fee_reminder_name(),
    description: () => m.documents_template_fee_reminder_description(),
    headerTitle: (locale) => m.documents_template_fee_reminder_header({}, { locale }),
    title: (locale) => m.documents_template_fee_reminder_title({}, { locale }),
    content: (locale) => m.documents_template_fee_reminder_content({}, { locale }),
  },
  {
    id: 'board-report',
    name: () => m.documents_template_board_report_name(),
    description: () => m.documents_template_board_report_description(),
    headerTitle: (locale) => m.documents_template_board_report_header({}, { locale }),
    title: (locale) => m.documents_template_board_report_title({}, { locale }),
    content: (locale) => m.documents_template_board_report_content({}, { locale }),
  },
  {
    id: 'amenity-rules',
    name: () => m.documents_template_amenity_rules_name(),
    description: () => m.documents_template_amenity_rules_description(),
    headerTitle: (locale) => m.documents_template_amenity_rules_header({}, { locale }),
    title: (locale) => m.documents_template_amenity_rules_title({}, { locale }),
    content: (locale) => m.documents_template_amenity_rules_content({}, { locale }),
  },
]

/** The document a template starts, dated today. Browser only (see markdownToContent). */
export function templateDocument(template: DocumentTemplate, locale: Locale, today: Date): DocumentInput {
  return {
    header_title: template.headerTitle(locale),
    date: format(today, ISO_DAY),
    title: template.title(locale),
    // Checked like any document: a template the PDF couldn't draw fails here, not later.
    content: documentContentSchema.parse(markdownToContent(template.content(locale))),
  }
}

import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { addMonths, endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import type { CurrencyTotals, FinancialReport } from '@/lib/supabase/financial-report'
import {
  type CurrencyCode,
  capitalize,
  dateLocale,
  formatCurrency,
  formatDay,
  formatMonth,
  ISO_DAY,
  intlLocale,
} from '@/lib/utils'
import { m } from '@/paraglide/messages'
import type { Locale } from '@/paraglide/runtime'
import geistRegularUrl from '../../../../assets/fonts/Geist-Regular.ttf?inline'
import geistSemiBoldUrl from '../../../../assets/fonts/Geist-SemiBold.ttf?inline'

// Rendered on the server by /reports/pdf. Only react-pdf primitives here: no
// DOM, no Tailwind.

// Geist, like the app. The app's fontsource package only ships woff2, so the
// TTFs live in assets/fonts, bundled as data URLs; react-pdf embeds just the
// glyphs the report uses.
Font.register({
  family: 'Geist',
  fonts: [
    { src: geistRegularUrl, fontWeight: 400 },
    { src: geistSemiBoldUrl, fontWeight: 600 },
  ],
})

// The built-in hyphenation is English ("mantenimien-to"); wrap whole words.
Font.registerHyphenationCallback((word) => [word])

const COLOR = {
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  panel: '#f9fafb',
  income: '#15803d',
  expense: '#b91c1c',
  /** A balance below zero, like the app's balance. */
  destructive: '#b91c1c',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 84,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontFamily: 'Geist',
    fontSize: 9,
    color: COLOR.text,
  },
  header: {
    position: 'absolute',
    top: 32,
    left: 40,
    right: 40,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // Fixed height, width from the image's own proportions (capped for wide
  // wordmarks), so the name sits right next to it whatever the shape.
  logo: { height: 32, maxWidth: 120, objectFit: 'contain', objectPosition: 'left' },
  residential: { fontSize: 13, fontWeight: 600 },
  headerSubtitle: { fontSize: 9, color: COLOR.muted, marginTop: 2 },
  headerRange: { fontSize: 10, fontWeight: 600, textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: COLOR.muted,
  },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 11, fontWeight: 600, marginBottom: 6 },
  sectionHint: { fontSize: 8, color: COLOR.muted, marginBottom: 6 },
  summary: { flexDirection: 'row', gap: 8 },
  summaryBox: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: COLOR.border,
    borderRadius: 4,
    backgroundColor: COLOR.panel,
  },
  summaryLabel: { fontSize: 8, color: COLOR.muted, marginBottom: 3 },
  summaryValue: { fontSize: 12, fontWeight: 600 },
  columns: { flexDirection: 'row', gap: 12 },
  column: { flex: 1 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLOR.text,
    paddingBottom: 3,
    fontWeight: 600,
    fontSize: 8,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.border,
    paddingVertical: 3,
  },
  totalRow: { flexDirection: 'row', paddingTop: 3, fontWeight: 600 },
  cell: { paddingRight: 4 },
  empty: { color: COLOR.muted, paddingVertical: 4 },
  note: { fontSize: 7.5, color: COLOR.muted, marginTop: 4 },
})

interface Column<T> {
  label: string
  /** Fixed width in points; columns without one share what's left. */
  width?: number
  align?: 'left' | 'right'
  value: (row: T) => string
}

interface TableProps<T> {
  columns: Column<T>[]
  rows: T[]
  emptyText: string
  total?: { label: string; value: string }
  /** Repeat the header on every page the table spans. */
  repeatHeader?: boolean
}

function cellStyle<T>(column: Column<T>) {
  return [
    styles.cell,
    column.width ? { width: column.width } : { flex: 1 },
    { textAlign: column.align ?? 'left' },
  ]
}

function Table<T>({ columns, rows, emptyText, total, repeatHeader }: TableProps<T>) {
  if (!rows.length) return <Text style={styles.empty}>{emptyText}</Text>

  return (
    <View>
      <View style={styles.tableHeader} fixed={repeatHeader}>
        {columns.map((column) => (
          <Text key={column.label} style={cellStyle(column)}>
            {column.label}
          </Text>
        ))}
      </View>
      {rows.map((row, index) => (
        // Rows never split across pages.
        <View key={index} style={styles.row} wrap={false}>
          {columns.map((column) => (
            <Text key={column.label} style={cellStyle(column)}>
              {column.value(row)}
            </Text>
          ))}
        </View>
      ))}
      {total && (
        <View style={styles.totalRow}>
          <Text style={[styles.cell, { flex: 1 }]}>{total.label}</Text>
          <Text style={[styles.cell, { textAlign: 'right' }]}>{total.value}</Text>
        </View>
      )}
    </View>
  )
}

/** The range covers exactly one calendar month, e.g. 2026-08-01 to 2026-08-31. */
export function isWholeMonth(from: string, to: string): boolean {
  const start = parseISO(from)
  return from === format(startOfMonth(start), ISO_DAY) && to === format(endOfMonth(start), ISO_DAY)
}

/** "Agosto 2026" for a whole month, "1 ago 2026 – 15 ago 2026" otherwise. */
export function rangeLabel(from: string, to: string, language?: Locale): string {
  if (isWholeMonth(from, to)) return formatMonth(from, language)
  if (from === to) return formatDay(from, language)
  return `${formatDay(from, language)} – ${formatDay(to, language)}`
}

/**
 * "2 de Octubre de 2026 a las 3:15 p.m.", months capitalized like the rest of
 * the app. Intl puts a narrow no-break space (U+202F) before "p.m.", which the
 * PDF font has no glyph for, so every space becomes a plain one.
 */
function formatGeneratedAt(date: Date, language: Locale): string {
  // The server may run in UTC; the report is read in the residential's time.
  return new Intl.DateTimeFormat(intlLocale(language), {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  })
    .formatToParts(date)
    .map((part) => (part.type === 'month' ? capitalize(part.value) : part.value))
    .join('')
    .replace(/\s/g, ' ')
}

function byHouse(a: string, b: string): number {
  return a.localeCompare(b, 'es', { numeric: true })
}

type Category = CurrencyTotals['categories'][number]
type PendingHouse = FinancialReport['fee_status']['pending'][number]

function categoryColumns(money: (value: number) => string, language: Locale): Column<Category>[] {
  const locale = { locale: language }
  return [
    { label: m.common_field_category({}, locale), value: (c) => c.name },
    {
      label: m.common_section_transactions({}, locale),
      width: 64,
      align: 'right',
      value: (c) => String(c.movements),
    },
    { label: m.common_field_total({}, locale), width: 72, align: 'right', value: (c) => money(c.total) },
  ]
}

/**
 * Sorted fee months as runs: "Enero – Julio 2026, Septiembre 2026" instead of
 * nine month names in a row.
 */
function monthRuns(months: string[], language: Locale): string {
  const runs: { first: string; last: string }[] = []
  for (const month of months) {
    const run = runs.at(-1)
    if (run && format(addMonths(parseISO(run.last), 1), ISO_DAY) === month) {
      run.last = month
    } else {
      runs.push({ first: month, last: month })
    }
  }

  return runs
    .map(({ first, last }) => {
      if (first === last) return formatMonth(first, language)
      const firstLabel =
        first.slice(0, 4) === last.slice(0, 4)
          ? format(parseISO(first), 'MMMM', { locale: dateLocale(language) })
          : formatMonth(first, language)
      return `${firstLabel} – ${formatMonth(last, language)}`
    })
    .join(', ')
}

function pendingColumns(language: Locale): Column<PendingHouse>[] {
  const locale = { locale: language }
  return [
    { label: m.common_field_house({}, locale), width: 56, value: (p) => p.house },
    {
      label: m.reports_pdf_column_months({}, locale),
      width: 44,
      align: 'right',
      value: (p) => String(p.months.length),
    },
    { label: m.reports_pdf_column_unpaid({}, locale), value: (p) => monthRuns(p.months, language) },
  ]
}

interface FinancialReportDocumentProps {
  report: FinancialReport
  residentialName: string
  /** The HOA's current one; amounts in any other carry their code. */
  currency: CurrencyCode
  /** The HOA's default language, whoever downloads the report. */
  language: Locale
  /** PNG bytes; without it the header shows only the name. */
  logo: Buffer | null
  generatedBy: string
  generatedAt: Date
}

export function FinancialReportDocument({
  report,
  residentialName,
  currency,
  language,
  logo,
  generatedBy,
  generatedAt,
}: FinancialReportDocumentProps) {
  const locale = { locale: language }
  const range = rangeLabel(report.from, report.to, language)
  const isMultiCurrency = report.currencies.length > 1
  const { fee_status: fees } = report
  const pending = [...fees.pending].sort((a, b) => byHouse(a.house, b.house))

  return (
    <Document
      title={m.reports_pdf_document_title({ range }, locale)}
      author={residentialName}
      creator="Vecora"
      producer="Vecora"
      language={intlLocale(language)}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.brand}>
            {logo && <Image style={styles.logo} src={{ data: logo, format: 'png' }} />}
            <View>
              <Text style={styles.residential}>{residentialName}</Text>
              <Text style={styles.headerSubtitle}>{m.common_section_financial_report({}, locale)}</Text>
            </View>
          </View>
          <Text style={styles.headerRange}>{range}</Text>
        </View>

        {report.currencies.map((totals) => (
          <CurrencySection
            key={totals.currency}
            totals={totals}
            from={report.from}
            language={language}
            // The headings name the currency (so the amounts don't have to) unless
            // it's the only one and the HOA's current one.
            suffix={isMultiCurrency || totals.currency !== currency ? ` (${totals.currency})` : ''}
          />
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{m.reports_pdf_fees_title({}, locale)}</Text>
          {fees.months ? (
            <>
              <Text style={styles.sectionHint}>
                {m.reports_pdf_fees_up_to_date(
                  {
                    upToDate: fees.up_to_date,
                    houses: fees.houses,
                    months: m.reports_pdf_months_considered({ count: fees.months }, locale),
                  },
                  locale,
                )}
              </Text>
              <Table
                columns={pendingColumns(language)}
                rows={pending}
                emptyText={m.reports_pdf_all_up_to_date({}, locale)}
                repeatHeader
              />
            </>
          ) : (
            <Text style={styles.empty}>{m.reports_pdf_no_fees({}, locale)}</Text>
          )}
        </View>

        <Text style={styles.note}>
          {m.reports_pdf_dates_note({ date: formatDay(report.to, language) }, locale)}
        </Text>

        <View style={styles.footer} fixed>
          <Text>
            {m.reports_pdf_generated(
              { date: formatGeneratedAt(generatedAt, language), name: generatedBy },
              locale,
            )}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              m.reports_pdf_page({ page: pageNumber, total: totalPages }, locale)
            }
          />
        </View>
      </Page>
    </Document>
  )
}

interface CurrencySectionProps {
  totals: CurrencyTotals
  from: string
  language: Locale
  suffix: string
}

/** Summary and per-category tables of one currency. */
function CurrencySection({ totals, from, language, suffix }: CurrencySectionProps) {
  const locale = { locale: language }
  const money = (value: number) => formatCurrency(value, totals.currency, locale)
  const columns = categoryColumns(money, language)
  const income = totals.categories.filter((c) => c.kind === 'income')
  const expense = totals.categories.filter((c) => c.kind === 'expense')

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{m.reports_pdf_summary({ suffix }, locale)}</Text>
        <View style={styles.summary}>
          <SummaryBox
            label={m.reports_pdf_opening_balance({}, locale)}
            value={money(totals.opening_balance)}
          />
          <SummaryBox
            label={m.common_income({}, locale)}
            value={money(totals.total_income)}
            color={COLOR.income}
          />
          <SummaryBox
            label={m.common_expense({}, locale)}
            value={money(totals.total_expense)}
            color={COLOR.expense}
          />
          <SummaryBox
            label={m.reports_pdf_closing_balance({}, locale)}
            value={money(totals.closing_balance)}
            color={totals.closing_balance < 0 ? COLOR.destructive : undefined}
          />
        </View>
        <Text style={styles.note}>
          {m.reports_pdf_balance_note({ date: formatDay(from, language) }, locale)}
        </Text>
      </View>

      <View style={[styles.section, styles.columns]}>
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>{m.reports_pdf_income_by_category({ suffix }, locale)}</Text>
          <Table
            columns={columns}
            rows={income}
            emptyText={m.reports_pdf_no_income({}, locale)}
            total={{ label: m.common_field_total({}, locale), value: money(totals.total_income) }}
          />
        </View>
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>{m.reports_pdf_expense_by_category({ suffix }, locale)}</Text>
          <Table
            columns={columns}
            rows={expense}
            emptyText={m.reports_pdf_no_expense({}, locale)}
            total={{ label: m.common_field_total({}, locale), value: money(totals.total_expense) }}
          />
        </View>
      </View>
    </>
  )
}

function SummaryBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, color ? { color } : {}]}>{value}</Text>
    </View>
  )
}

import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { addMonths, endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import type { FinancialReport } from '@/lib/supabase/financial-report'
import { formatCurrency, formatDay, formatMonth, ISO_DAY } from '@/lib/utils'

// Rendered on the server by /reports/pdf. Only react-pdf primitives here: no
// DOM, no Tailwind. Helvetica is built into every PDF reader and covers the
// Spanish accents, so there are no fonts to ship. Not every symbol, though: a
// math minus sign comes out blank, so stick to a plain hyphen.

// The built-in hyphenation is English ("mantenimien-to"); wrap whole words.
Font.registerHyphenationCallback((word) => [word])

const COLOR = {
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  panel: '#f9fafb',
  income: '#15803d',
  expense: '#b91c1c',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 84,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
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
  residential: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  headerSubtitle: { fontSize: 9, color: COLOR.muted, marginTop: 2 },
  headerRange: { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
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
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
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
  summaryValue: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  columns: { flexDirection: 'row', gap: 12 },
  column: { flex: 1 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLOR.text,
    paddingBottom: 3,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.border,
    paddingVertical: 3,
  },
  totalRow: { flexDirection: 'row', paddingTop: 3, fontFamily: 'Helvetica-Bold' },
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

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** The range covers exactly one calendar month, e.g. 2026-08-01 to 2026-08-31. */
export function isWholeMonth(from: string, to: string): boolean {
  const start = parseISO(from)
  return from === format(startOfMonth(start), ISO_DAY) && to === format(endOfMonth(start), ISO_DAY)
}

/** "Agosto 2026" for a whole month, "1 ago 2026 – 15 ago 2026" otherwise. */
export function rangeLabel(from: string, to: string): string {
  if (isWholeMonth(from, to)) return capitalize(formatMonth(from))
  if (from === to) return formatDay(from)
  return `${formatDay(from)} – ${formatDay(to)}`
}

// The server may run in UTC; the report is read in the residential's time.
const generatedAtFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'America/Mexico_City',
})

function byHouse(a: string, b: string): number {
  return a.localeCompare(b, 'es', { numeric: true })
}

type Category = FinancialReport['categories'][number]
type PendingHouse = FinancialReport['fee_status']['pending'][number]

const CATEGORY_COLUMNS: Column<Category>[] = [
  { label: 'Categoría', value: (c) => c.name },
  { label: 'Movimientos', width: 64, align: 'right', value: (c) => String(c.movements) },
  { label: 'Total', width: 72, align: 'right', value: (c) => formatCurrency(c.total) },
]

/**
 * Sorted fee months as runs: "Enero – Julio 2026, Septiembre 2026" instead of
 * nine month names in a row.
 */
function monthRuns(months: string[]): string {
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
      if (first === last) return capitalize(formatMonth(first))
      const firstLabel =
        first.slice(0, 4) === last.slice(0, 4)
          ? format(parseISO(first), 'MMMM', { locale: es })
          : formatMonth(first)
      return `${capitalize(firstLabel)} – ${capitalize(formatMonth(last))}`
    })
    .join(', ')
}

const PENDING_COLUMNS: Column<PendingHouse>[] = [
  { label: 'Casa', width: 56, value: (p) => p.house },
  { label: 'Meses', width: 44, align: 'right', value: (p) => String(p.months.length) },
  { label: 'Sin pagar', value: (p) => monthRuns(p.months) },
]

interface FinancialReportDocumentProps {
  report: FinancialReport
  residentialName: string
  generatedBy: string
  generatedAt: Date
}

export function FinancialReportDocument({
  report,
  residentialName,
  generatedBy,
  generatedAt,
}: FinancialReportDocumentProps) {
  const range = rangeLabel(report.from, report.to)
  const income = report.categories.filter((c) => c.kind === 'income')
  const expense = report.categories.filter((c) => c.kind === 'expense')
  const { fee_status: fees } = report
  const pending = [...fees.pending].sort((a, b) => byHouse(a.house, b.house))

  return (
    <Document
      title={`Reporte financiero - ${range}`}
      author={residentialName}
      creator="Resido"
      producer="Resido"
      language="es-MX"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.residential}>{residentialName}</Text>
            <Text style={styles.headerSubtitle}>Reporte financiero</Text>
          </View>
          <Text style={styles.headerRange}>{range}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.summary}>
            <SummaryBox label="Saldo inicial" value={report.opening_balance} />
            <SummaryBox label="Ingresos" value={report.total_income} color={COLOR.income} />
            <SummaryBox label="Egresos" value={report.total_expense} color={COLOR.expense} />
            <SummaryBox label="Saldo final" value={report.closing_balance} />
          </View>
          <Text style={styles.note}>
            Saldo inicial: todo lo registrado antes del {formatDay(report.from)}. Saldo final = saldo inicial
            + ingresos - egresos.
          </Text>
        </View>

        <View style={[styles.section, styles.columns]}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Ingresos por categoría</Text>
            <Table
              columns={CATEGORY_COLUMNS}
              rows={income}
              emptyText="Sin ingresos en este periodo."
              total={{ label: 'Total', value: formatCurrency(report.total_income) }}
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Egresos por categoría</Text>
            <Table
              columns={CATEGORY_COLUMNS}
              rows={expense}
              emptyText="Sin egresos en este periodo."
              total={{ label: 'Total', value: formatCurrency(report.total_expense) }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuotas de mantenimiento</Text>
          {fees.months ? (
            <>
              <Text style={styles.sectionHint}>
                {fees.up_to_date} de {fees.houses} casas al corriente -{' '}
                {fees.months === 1 ? '1 mes considerado' : `${fees.months} meses considerados`}
              </Text>
              <Table
                columns={PENDING_COLUMNS}
                rows={pending}
                emptyText="Todas las casas están al corriente."
                repeatHeader
              />
            </>
          ) : (
            <Text style={styles.empty}>No hay cuotas por cobrar en estas fechas.</Text>
          )}
        </View>

        <Text style={styles.note}>
          Ingresos y egresos se cuentan por la fecha en que ocurrieron. Una cuota cuenta como pagada si su
          pago se registró a más tardar el {formatDay(report.to)}.
        </Text>

        <View style={styles.footer} fixed>
          <Text>
            Generado el {generatedAtFormatter.format(generatedAt)} por {generatedBy}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

function SummaryBox({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, color ? { color } : {}]}>{formatCurrency(value)}</Text>
    </View>
  )
}

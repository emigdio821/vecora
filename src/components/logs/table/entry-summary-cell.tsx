'use client'

import type { Table } from '@tanstack/react-table'
import { useState } from 'react'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Button } from '@/components/ui/button'
import type { LogEntryQueryData } from '@/tanstack-queries/logs'
import { EntryDetailsDrawer } from '../drawer/entry-details'
import { entrySummary } from '../entry'

interface EntrySummaryCellProps {
  entry: LogEntryQueryData
  table: Table<DataTableFeatures, LogEntryQueryData>
}

export function EntrySummaryCell({ entry, table }: EntrySummaryCellProps) {
  const [isDetailsOpen, setDetailsOpen] = useState(false)

  // Other rows written by the same action (e.g. the expense behind a paid request).
  const related = table
    .getCoreRowModel()
    .rows.map((row) => row.original)
    .filter((other) => other.txid === entry.txid && other.id !== entry.id)

  return (
    <>
      <EntryDetailsDrawer
        entry={entry}
        related={related}
        open={isDetailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <Button
        variant="ghost"
        className="max-w-full justify-start"
        onClick={() => {
          setDetailsOpen(true)
        }}
      >
        <span className="truncate">{entrySummary(entry)}</span>
      </Button>
    </>
  )
}

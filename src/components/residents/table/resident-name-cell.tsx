'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ResidentQueryData } from '@/tanstack-queries/residents'
import { ResidentDetailsDrawer } from '../drawer/resident-details'

interface ResidentNameCellProps {
  resident: ResidentQueryData
}

export function ResidentNameCell({ resident }: ResidentNameCellProps) {
  const [isDetailsOpen, setDetailsOpen] = useState(false)
  const fullName = `${resident.first_name} ${resident.last_name}`

  return (
    <>
      <ResidentDetailsDrawer resident={resident} open={isDetailsOpen} onOpenChange={setDetailsOpen} />

      <Button
        variant="ghost"
        className="max-w-full justify-start"
        onClick={() => {
          setDetailsOpen(true)
        }}
      >
        <span className="truncate">{fullName}</span>
      </Button>
    </>
  )
}

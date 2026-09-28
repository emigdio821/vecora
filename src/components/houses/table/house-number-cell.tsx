'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { HouseQueryData } from '@/tanstack-queries/houses'
import { HouseDetailsDrawer } from '../drawer/house-details'

interface HouseNumberCellProps {
  house: HouseQueryData
}

export function HouseNumberCell({ house }: HouseNumberCellProps) {
  const [isDetailsOpen, setDetailsOpen] = useState(false)

  return (
    <>
      <HouseDetailsDrawer house={house} open={isDetailsOpen} onOpenChange={setDetailsOpen} />

      <Button
        variant="ghost"
        className="max-w-full justify-start"
        onClick={() => {
          setDetailsOpen(true)
        }}
      >
        <span className="truncate">{house.number}</span>
      </Button>
    </>
  )
}

import type { Table } from '@tanstack/react-table'
import { InfoIcon, ListFilterIcon, SearchIcon, XIcon } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { LogEntryQueryData } from '@/tanstack-queries/logs'
import { ACTION_LABEL, ACTIONS, identityName, SECTION_LABEL, SECTIONS } from '../entry'
import {
  type ActionFilter,
  type SectionFilter,
  useActionFilter,
  useIdentityFilter,
  useRangeFilter,
  useSectionFilter,
} from './filters'
import { RangePicker } from './range-picker'

const SECTION_FILTER_ITEMS: { value: SectionFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  ...SECTIONS.map((section) => ({ value: section as SectionFilter, label: SECTION_LABEL[section] })),
]

const ACTION_FILTER_ITEMS: { value: ActionFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  ...ACTIONS.map((action) => ({ value: action as ActionFilter, label: ACTION_LABEL[action] })),
]

interface LogsDataTableHeaderProps {
  table: Table<DataTableFeatures, LogEntryQueryData>
}

export function LogsDataTableHeader({ table }: LogsDataTableHeaderProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-logs', parseAsString.withDefault(''))
  const [range, setRange] = useRangeFilter()
  const [section, setSection] = useSectionFilter()
  const [action, setAction] = useActionFilter()
  const [identity, setIdentity] = useIdentityFilter()
  const coreRows = table.getCoreRowModel().rows
  const tableRowsLength = coreRows.length

  // Whoever shows up in the loaded range, so the list never offers an empty filter.
  const identityItems = useMemo(
    () =>
      [...new Set(coreRows.map((row) => identityName(row.original)))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [coreRows],
  )

  const activeFilterLabels = [
    section !== 'all' && SECTION_LABEL[section],
    action !== 'all' && ACTION_LABEL[action],
    identity !== 'all' && identity,
  ].filter(Boolean)
  const isFiltered = activeFilterLabels.length > 0
  const filtersLabel = isFiltered ? `Filtros: ${activeFilterLabels.join(', ')}` : 'Filtros'

  useEffect(() => {
    table.getColumn('summary')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <div className="flex flex-col items-start justify-between gap-2 sm:flex-row">
      <InputGroup className="w-full bg-background sm:w-2xs md:w-xs xl:w-sm">
        <InputGroupInput
          type="search"
          value={searchQuery}
          aria-label="Buscar"
          placeholder="Buscar"
          ref={searchInputRef}
          name="search-logs"
          disabled={tableRowsLength === 0}
          onChange={(e) => {
            void setSearchQuery(e.target.value)
          }}
        />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>

        {searchQuery && (
          <InputGroupAddon align="inline-end">
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Limpiar búsqueda"
              onClick={() => {
                searchInputRef.current?.focus()
                void setSearchQuery('')
              }}
            >
              <XIcon aria-hidden />
            </Button>
          </InputGroupAddon>
        )}

        <InputGroupAddon align="inline-end">
          <Tooltip open={isSearchTooltipOpen} onOpenChange={setSearchTooltipOpen}>
            <TooltipTrigger
              closeOnClick={false}
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="cursor-default"
                  onClick={() => {
                    setSearchTooltipOpen(true)
                  }}
                >
                  <InfoIcon className="size-4" />
                </Button>
              }
            />
            <TooltipContent>Buscar por resumen, identidad o sección</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>

      <div className="flex flex-wrap justify-end gap-2">
        <RangePicker value={range} onChange={setRange} />

        <Menu>
          <Tooltip>
            <TooltipTrigger
              closeOnClick={false}
              render={
                <MenuTrigger
                  render={
                    <Button size="icon" variant="outline" className="relative" aria-label={filtersLabel}>
                      <ListFilterIcon className="size-4" />
                      {/* The list is narrowed; don't let that go unnoticed. */}
                      {isFiltered && (
                        <span
                          aria-hidden
                          className="absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-background bg-primary"
                        />
                      )}
                    </Button>
                  }
                />
              }
            />
            <TooltipContent>{filtersLabel}</TooltipContent>
          </Tooltip>

          <MenuPopup align="end" className="max-h-[70vh] overflow-y-auto">
            <MenuGroup>
              <MenuGroupLabel>Sección</MenuGroupLabel>
              <MenuRadioGroup
                value={section}
                onValueChange={(value: SectionFilter) => {
                  void setSection(value)
                }}
              >
                {SECTION_FILTER_ITEMS.map((item) => (
                  <MenuRadioItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuGroup>

            <MenuSeparator />

            <MenuGroup>
              <MenuGroupLabel>Acción</MenuGroupLabel>
              <MenuRadioGroup
                value={action}
                onValueChange={(value: ActionFilter) => {
                  void setAction(value)
                }}
              >
                {ACTION_FILTER_ITEMS.map((item) => (
                  <MenuRadioItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuGroup>

            <MenuSeparator />

            <MenuGroup>
              <MenuGroupLabel>Identidad</MenuGroupLabel>
              <MenuRadioGroup
                value={identity}
                onValueChange={(value: string) => {
                  void setIdentity(value)
                }}
              >
                <MenuRadioItem value="all">Todos</MenuRadioItem>
                {identityItems.map((name) => (
                  <MenuRadioItem key={name} value={name}>
                    {name}
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuGroup>
          </MenuPopup>
        </Menu>
      </div>
    </div>
  )
}

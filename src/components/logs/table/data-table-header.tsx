import { IconFilter2 } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { useMemo } from 'react'
import { RangePicker } from '@/components/shared/range-picker'
import { DataTableSearch } from '@/components/shared/table/data-table-search'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Button } from '@/components/ui/button'
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
import { m } from '@/paraglide/messages'
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

const SECTION_FILTER_ITEMS: { value: SectionFilter; label: string }[] = [
  {
    value: 'all',
    get label() {
      return m.common_all_feminine()
    },
  },
  ...SECTIONS.map((section) => ({
    value: section as SectionFilter,
    get label() {
      return SECTION_LABEL[section]
    },
  })),
]

const ACTION_FILTER_ITEMS: { value: ActionFilter; label: string }[] = [
  {
    value: 'all',
    get label() {
      return m.common_all_feminine()
    },
  },
  ...ACTIONS.map((action) => ({
    value: action as ActionFilter,
    get label() {
      return ACTION_LABEL[action]
    },
  })),
]

interface LogsDataTableHeaderProps {
  table: Table<DataTableFeatures, LogEntryQueryData>
}

export function LogsDataTableHeader({ table }: LogsDataTableHeaderProps) {
  const [range, setRange] = useRangeFilter()
  const [section, setSection] = useSectionFilter()
  const [action, setAction] = useActionFilter()
  const [identity, setIdentity] = useIdentityFilter()
  const coreRows = table.getCoreRowModel().rows

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
  const filtersLabel = isFiltered
    ? m.logs_filters_active({ filters: activeFilterLabels.join(', ') })
    : m.common_filters()

  return (
    <div className="flex flex-col justify-between gap-2 sm:flex-row">
      <div className="flex gap-2">
        <DataTableSearch table={table} columnId="summary" param="search-logs" hint={m.logs_search_hint()} />

        <Menu>
          <Tooltip>
            <TooltipTrigger
              closeOnClick={false}
              render={
                <MenuTrigger
                  render={
                    <Button size="icon" variant="outline" className="relative" aria-label={filtersLabel}>
                      <IconFilter2 className="size-4" />
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
              <MenuGroupLabel>{m.logs_section()}</MenuGroupLabel>
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
              <MenuGroupLabel>{m.logs_action()}</MenuGroupLabel>
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
              <MenuGroupLabel>{m.logs_who()}</MenuGroupLabel>
              <MenuRadioGroup
                value={identity}
                onValueChange={(value: string) => {
                  void setIdentity(value)
                }}
              >
                <MenuRadioItem value="all">{m.common_all_masculine()}</MenuRadioItem>
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

      <div className="self-end">
        <RangePicker value={range} onChange={setRange} />
      </div>
    </div>
  )
}

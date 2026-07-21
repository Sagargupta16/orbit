import { useMemo, useState, type ReactNode } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { ChevronUpDownIcon } from '@/components/icons'

export interface Column<T> {
  key: string
  header: string
  /** Renders the cell for desktop rows and the value in mobile cards. */
  render: (row: T) => ReactNode
  /** Value used for sorting; omit to make the column non-sortable. */
  sortValue?: (row: T) => string | number
  /** Label shown beside the value in the mobile card layout. */
  mobileLabel?: string
  /** When true, this column is the card's headline (larger, no label). */
  mobilePrimary?: boolean
  align?: 'left' | 'right'
  headerClassName?: string
}

interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  selectable?: boolean
  selectedIds?: Set<string>
  onToggleRow?: (id: string) => void
  onToggleAll?: (checked: boolean) => void
  emptyMessage?: string
}

type SortDir = 'asc' | 'desc'

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  selectable = false,
  selectedIds,
  onToggleRow,
  onToggleAll,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  const isMobile = useIsMobile()
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.sortValue) return rows
    const getVal = col.sortValue
    const dir = sortDir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = getVal(a)
      const bv = getVal(b)
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
  }, [rows, columns, sortKey, sortDir])

  function handleSort(col: Column<T>) {
    if (!col.sortValue) return
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      // Text columns feel natural ascending; numeric first-click descending.
      setSortDir(typeof col.sortValue(sortedRows[0]) === 'number' ? 'desc' : 'asc')
    }
  }

  const allSelected =
    selectable && sortedRows.length > 0 && selectedIds
      ? sortedRows.every((r) => selectedIds.has(rowKey(r)))
      : false

  if (sortedRows.length === 0) {
    return (
      <div className="rounded-card bg-surface px-6 py-16 text-center text-sm text-text-secondary">
        {emptyMessage}
      </div>
    )
  }

  // --- Mobile: stacked cards ---
  if (isMobile) {
    const primary = columns.find((c) => c.mobilePrimary)
    const rest = columns.filter((c) => !c.mobilePrimary)
    return (
      <div className="flex flex-col gap-3">
        {sortedRows.map((row) => {
          const id = rowKey(row)
          return (
            <div key={id} className="rounded-card bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 font-semibold text-text-primary">
                  {primary ? primary.render(row) : null}
                </div>
                {selectable && selectedIds ? (
                  <input
                    type="checkbox"
                    className="size-4 accent-brand-500"
                    checked={selectedIds.has(id)}
                    onChange={() => onToggleRow?.(id)}
                    aria-label="Select row"
                  />
                ) : null}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {rest.map((col) => (
                  <div key={col.key} className="flex flex-col gap-0.5">
                    <dt className="text-xs text-text-secondary">
                      {col.mobileLabel ?? col.header}
                    </dt>
                    <dd className="text-sm text-text-primary">{col.render(row)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )
        })}
      </div>
    )
  }

  // --- Desktop: table ---
  return (
    <div className="overflow-hidden rounded-card bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border-hairline">
              {selectable ? (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    className="size-4 accent-brand-500"
                    checked={allSelected}
                    onChange={(e) => onToggleAll?.(e.target.checked)}
                    aria-label="Select all rows"
                  />
                </th>
              ) : null}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium text-text-secondary ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${col.headerClassName ?? ''}`}
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col)}
                      className="inline-flex items-center gap-1 hover:text-text-primary"
                    >
                      {col.header}
                      <ChevronUpDownIcon
                        width={12}
                        height={12}
                        className={sortKey === col.key ? 'text-brand-500' : 'text-text-placeholder'}
                      />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const id = rowKey(row)
              return (
                <tr
                  key={id}
                  className="border-b border-border-hairline last:border-0 transition-colors hover:bg-surface-subtle"
                >
                  {selectable && selectedIds ? (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        className="size-4 accent-brand-500"
                        checked={selectedIds.has(id)}
                        onChange={() => onToggleRow?.(id)}
                        aria-label="Select row"
                      />
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-4 text-text-primary ${
                        col.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

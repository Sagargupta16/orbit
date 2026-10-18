// Date helpers. The API sends datetimes as ISO UTC ("...Z") and dates as
// "YYYY-MM-DD". Dates are calendar days, so they are parsed as local dates,
// never through `new Date("YYYY-MM-DD")` (which would read them as UTC).

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Local calendar date as YYYY-MM-DD. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Today's local date as YYYY-MM-DD. */
export function todayISO(): string {
  return toISODate(new Date())
}

/** Parse YYYY-MM-DD as a local date at midnight. */
export function parseISODate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Add days to a YYYY-MM-DD date. */
export function addDaysISO(value: string, days: number): string {
  const d = parseISODate(value)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Whole days from today to a YYYY-MM-DD date (negative when it is in the past). */
export function daysFromToday(value: string): number {
  const ms = parseISODate(value).getTime() - parseISODate(todayISO()).getTime()
  return Math.round(ms / 86_400_000)
}

/** "Oct 18, 2026" for a date or datetime string. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '-'
  const d = value.length <= 10 ? parseISODate(value) : new Date(value)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

/** "Oct 18" without the year, for birthdays and near dates. */
export function formatMonthDay(value: string): string {
  const d = value.length <= 10 ? parseISODate(value) : new Date(value)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** "Oct 18, 2026, 3:20 PM" in local time. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  const d = new Date(value)
  const h = d.getHours()
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${formatDate(value)}, ${hour12}:${pad(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`
}

/** "just now", "5 min ago", "3 hours ago", "yesterday", "4 days ago", or a date. */
export function relativeTime(value: string | null | undefined): string {
  if (!value) return 'Never'
  const diff = Date.now() - new Date(value).getTime()
  const min = Math.round(diff / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hours = Math.round(min / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  return formatDate(value)
}

/** "today", "tomorrow", "in 3 days", "2 days overdue" for a YYYY-MM-DD date. */
export function dueLabel(value: string): string {
  const days = daysFromToday(value)
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days > 1) return `in ${days} days`
  if (days === -1) return '1 day overdue'
  return `${-days} days overdue`
}

/** Value for <input type="datetime-local"> from an ISO string (local time). */
export function toLocalInputValue(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return `${toISODate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** ISO UTC string from an <input type="datetime-local"> value. */
export function fromLocalInputValue(value: string): string {
  return new Date(value).toISOString()
}

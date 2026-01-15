/**
 * Date key utilities for habit tracking.
 * Uses YYYY-MM-DD format for lexicographic ordering.
 */

export type DateKey = string // YYYY-MM-DD format

/**
 * Get the current date key considering timezone and grace period.
 * The grace period shifts the day boundary forward (e.g., 3am instead of midnight).
 */
export function toDateKey({
  nowMs = Date.now(),
  timeZone,
  graceMinutes = 0,
}: {
  nowMs?: number
  timeZone: string
  graceMinutes?: number
}): DateKey {
  // Subtract grace minutes to shift the day boundary
  const adjustedMs = nowMs - graceMinutes * 60 * 1000
  const date = new Date(adjustedMs)

  // Format in the specified timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(date) // Returns YYYY-MM-DD
}

/**
 * Parse a date key into year, month, day components.
 */
export function parseDateKey(dateKey: DateKey): {
  year: number
  month: number // 1-12
  day: number // 1-31
} {
  const [year, month, day] = dateKey.split('-').map(Number)
  return { year, month, day }
}

/**
 * Create a date key from components.
 */
export function formatDateKey(year: number, month: number, day: number): DateKey {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Get the day of week for a date key (0 = Sunday, 6 = Saturday).
 */
export function getDayOfWeek(dateKey: DateKey): number {
  const { year, month, day } = parseDateKey(dateKey)
  return new Date(year, month - 1, day).getDay()
}

/**
 * Subtract days from a date key.
 */
export function subtractDays(dateKey: DateKey, days: number): DateKey {
  const { year, month, day } = parseDateKey(dateKey)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() - days)
  return formatDateKey(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  )
}

/**
 * Add days to a date key.
 */
export function addDays(dateKey: DateKey, days: number): DateKey {
  return subtractDays(dateKey, -days)
}

/**
 * Generate a range of date keys (inclusive).
 */
export function dateKeyRange(startDateKey: DateKey, endDateKey: DateKey): DateKey[] {
  const result: DateKey[] = []
  let current = startDateKey

  while (current <= endDateKey) {
    result.push(current)
    current = addDays(current, 1)
  }

  return result
}

/**
 * Get the difference in days between two date keys.
 */
export function daysBetween(startDateKey: DateKey, endDateKey: DateKey): number {
  const start = parseDateKey(startDateKey)
  const end = parseDateKey(endDateKey)
  const startDate = new Date(start.year, start.month - 1, start.day)
  const endDate = new Date(end.year, end.month - 1, end.day)
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Check if a date key is today or in the past.
 */
export function isPastOrToday(
  dateKey: DateKey,
  todayDateKey: DateKey
): boolean {
  return dateKey <= todayDateKey
}

/**
 * Get month name for a date key.
 */
export function getMonthName(dateKey: DateKey): string {
  const { year, month, day } = parseDateKey(dateKey)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
  })
}

/**
 * Format date key for display.
 */
export function formatDateKeyForDisplay(dateKey: DateKey): string {
  const { year, month, day } = parseDateKey(dateKey)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

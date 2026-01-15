/**
 * Schedule evaluation utilities for habit tracking.
 */

import {
  type DateKey,
  parseDateKey,
  getDayOfWeek,
  dateKeyRange,
} from './dateKey'

// Schedule rule types matching the Convex schema
export type ScheduleRule =
  | { kind: 'daily' }
  | { kind: 'weekly'; weekdays: number[] } // 0-6 = Sun-Sat
  | { kind: 'monthly'; daysOfMonth: number[] } // 1-31
  | { kind: 'yearly'; month: number; day: number } // 1-12, 1-31

/**
 * Check if a single schedule rule applies on a given date.
 */
export function occursOn(dateKey: DateKey, rule: ScheduleRule): boolean {
  const { month, day } = parseDateKey(dateKey)
  const dayOfWeek = getDayOfWeek(dateKey)

  switch (rule.kind) {
    case 'daily':
      return true
    case 'weekly':
      return rule.weekdays.includes(dayOfWeek)
    case 'monthly':
      return rule.daysOfMonth.includes(day)
    case 'yearly':
      return rule.month === month && rule.day === day
    default:
      return false
  }
}

/**
 * Check if any of the schedule rules apply on a given date.
 */
export function isDueOn(dateKey: DateKey, scheduleRules: ScheduleRule[]): boolean {
  return scheduleRules.some((rule) => occursOn(dateKey, rule))
}

/**
 * Get all scheduled date keys within a range.
 */
export function getScheduledDateKeysInRange(
  scheduleRules: ScheduleRule[],
  startDateKey: DateKey,
  endDateKey: DateKey
): DateKey[] {
  const allDates = dateKeyRange(startDateKey, endDateKey)
  return allDates.filter((dateKey) => isDueOn(dateKey, scheduleRules))
}

/**
 * Format a schedule rule for human-readable display.
 */
export function formatScheduleRule(rule: ScheduleRule): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]

  switch (rule.kind) {
    case 'daily':
      return 'Every day'
    case 'weekly':
      if (rule.weekdays.length === 7) return 'Every day'
      if (rule.weekdays.length === 5 && 
          !rule.weekdays.includes(0) && 
          !rule.weekdays.includes(6)) {
        return 'Weekdays'
      }
      if (rule.weekdays.length === 2 && 
          rule.weekdays.includes(0) && 
          rule.weekdays.includes(6)) {
        return 'Weekends'
      }
      return rule.weekdays.map((d) => dayNames[d]).join(', ')
    case 'monthly':
      const ordinal = (n: number) => {
        const s = ['th', 'st', 'nd', 'rd']
        const v = n % 100
        return n + (s[(v - 20) % 10] || s[v] || s[0])
      }
      return `Monthly on ${rule.daysOfMonth.map(ordinal).join(', ')}`
    case 'yearly':
      return `Yearly on ${monthNames[rule.month - 1]} ${rule.day}`
    default:
      return 'Unknown schedule'
  }
}

/**
 * Format an array of schedule rules for display.
 */
export function formatScheduleRules(rules: ScheduleRule[]): string {
  if (rules.length === 0) return 'No schedule'
  if (rules.length === 1) return formatScheduleRule(rules[0])
  return rules.map(formatScheduleRule).join(' + ')
}

/**
 * Calculate the current streak for a habit.
 * 
 * Streak counts consecutive scheduled occurrences completed.
 * A missed scheduled occurrence (past its deadline) resets the streak to 0.
 * 
 * @param scheduledDates - All dates when the habit was due (sorted ascending)
 * @param completedDates - Set of date keys when the habit was completed
 * @param todayDateKey - Today's date key
 * @returns The current streak count
 */
export function calculateStreak(
  scheduledDates: DateKey[],
  completedDates: Set<DateKey>,
  todayDateKey: DateKey
): number {
  // Filter to only past and today scheduled dates
  const pastScheduled = scheduledDates.filter((d) => d <= todayDateKey)

  if (pastScheduled.length === 0) return 0

  let streak = 0

  // Work backwards from the most recent scheduled date
  for (let i = pastScheduled.length - 1; i >= 0; i--) {
    const dateKey = pastScheduled[i]
    
    // Skip today if it's scheduled but not completed yet (don't break streak for today)
    if (dateKey === todayDateKey && !completedDates.has(dateKey)) {
      continue
    }

    if (completedDates.has(dateKey)) {
      streak++
    } else {
      // Missed a scheduled date - streak broken
      break
    }
  }

  return streak
}

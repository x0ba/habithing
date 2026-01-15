import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// Schedule rule validators - typesafe and extensible
export const scheduleRuleValidator = v.union(
  v.object({ kind: v.literal('daily') }),
  v.object({ kind: v.literal('weekly'), weekdays: v.array(v.number()) }), // 0-6 = Sun-Sat
  v.object({
    kind: v.literal('monthly'),
    daysOfMonth: v.array(v.number()),
  }), // 1-31
  v.object({ kind: v.literal('yearly'), month: v.number(), day: v.number() }) // 1-12, 1-31
)

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    timeZone: v.string(), // IANA, e.g. "America/New_York"
    graceMinutes: v.number(), // e.g. 180 for 3am cutoff
  }).index('by_token', ['tokenIdentifier']),

  habits: defineTable({
    userId: v.id('users'),
    title: v.string(),
    notes: v.optional(v.string()),
    color: v.string(),
    schedule: v.array(scheduleRuleValidator),
    archivedAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_user_archived', ['userId', 'archivedAt']),

  habitCompletions: defineTable({
    userId: v.id('users'),
    habitId: v.id('habits'),
    dateKey: v.string(), // YYYY-MM-DD
    completedAt: v.number(), // ms timestamp
  })
    .index('by_habit_date', ['habitId', 'dateKey'])
    .index('by_user_date', ['userId', 'dateKey']),
})

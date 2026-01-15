import { query } from './_generated/server'
import { v } from 'convex/values'

/**
 * Get dashboard data including today's habits and overall heatmap data.
 */
export const getDashboard = query({
  args: {
    todayDateKey: v.string(),
    heatmapStartDateKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    if (!user) {
      return null
    }

    // Get all non-archived habits
    const habits = await ctx.db
      .query('habits')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    const activeHabits = habits.filter((h) => !h.archivedAt)

    // Get all completions in the heatmap range
    const completions = await ctx.db
      .query('habitCompletions')
      .withIndex('by_user_date', (q) => q.eq('userId', user._id))
      .collect()

    const filteredCompletions = completions.filter(
      (c) =>
        c.dateKey >= args.heatmapStartDateKey && c.dateKey <= args.todayDateKey
    )

    // Build completion maps
    const completionsByHabitAndDate = new Map<string, Set<string>>()
    const completionsByDate = new Map<string, number>()

    for (const completion of filteredCompletions) {
      // Per-habit completions
      const habitKey = completion.habitId
      if (!completionsByHabitAndDate.has(habitKey)) {
        completionsByHabitAndDate.set(habitKey, new Set())
      }
      completionsByHabitAndDate.get(habitKey)!.add(completion.dateKey)

      // Overall completions per date
      completionsByDate.set(
        completion.dateKey,
        (completionsByDate.get(completion.dateKey) || 0) + 1
      )
    }

    // Process habits with their today status
    const habitsWithStatus = activeHabits.map((habit) => {
      const habitCompletions = completionsByHabitAndDate.get(habit._id) || new Set()
      const isCompletedToday = habitCompletions.has(args.todayDateKey)

      return {
        ...habit,
        isCompletedToday,
      }
    })

    // Convert completions by date to array for heatmap
    const heatmapData = Array.from(completionsByDate.entries()).map(
      ([dateKey, count]) => ({
        dateKey,
        count,
      })
    )

    return {
      user: {
        _id: user._id,
        name: user.name,
        timeZone: user.timeZone,
        graceMinutes: user.graceMinutes,
      },
      todayDateKey: args.todayDateKey,
      habits: habitsWithStatus,
      heatmapData,
    }
  },
})

/**
 * Get detailed data for a single habit including its completion history and streak.
 */
export const getHabitDetail = query({
  args: {
    habitId: v.id('habits'),
    todayDateKey: v.string(),
    historyStartDateKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    if (!user) {
      return null
    }

    // Get the habit
    const habit = await ctx.db.get(args.habitId)
    if (!habit || habit.userId !== user._id) {
      return null
    }

    // Get all completions for this habit in the range
    const completions = await ctx.db
      .query('habitCompletions')
      .withIndex('by_habit_date', (q) => q.eq('habitId', args.habitId))
      .collect()

    const filteredCompletions = completions.filter(
      (c) =>
        c.dateKey >= args.historyStartDateKey && c.dateKey <= args.todayDateKey
    )

    // Build completion set
    const completedDates = new Set(filteredCompletions.map((c) => c.dateKey))

    // Completion data for heatmap
    const heatmapData = filteredCompletions.map((c) => ({
      dateKey: c.dateKey,
      completedAt: c.completedAt,
    }))

    return {
      habit,
      completedDates: Array.from(completedDates),
      heatmapData,
      user: {
        timeZone: user.timeZone,
        graceMinutes: user.graceMinutes,
      },
    }
  },
})

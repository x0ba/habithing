import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

/**
 * Helper to get the current user or throw.
 */
async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('Not authenticated')
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_token', (q: any) =>
      q.eq('tokenIdentifier', identity.tokenIdentifier)
    )
    .unique()

  if (!user) {
    throw new Error('User not found - please sign in again')
  }

  return user
}

/**
 * Toggle completion for a habit on a specific date.
 * If completed, removes the completion. If not completed, creates one.
 */
export const toggleForDate = mutation({
  args: {
    habitId: v.id('habits'),
    dateKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Verify ownership of the habit
    const habit = await ctx.db.get(args.habitId)
    if (!habit || habit.userId !== user._id) {
      throw new Error('Habit not found')
    }

    // Check if already completed
    const existing = await ctx.db
      .query('habitCompletions')
      .withIndex('by_habit_date', (q) =>
        q.eq('habitId', args.habitId).eq('dateKey', args.dateKey)
      )
      .unique()

    if (existing) {
      // Remove the completion
      await ctx.db.delete(existing._id)
      return { completed: false }
    } else {
      // Create a completion
      await ctx.db.insert('habitCompletions', {
        userId: user._id,
        habitId: args.habitId,
        dateKey: args.dateKey,
        completedAt: Date.now(),
      })
      return { completed: true }
    }
  },
})

/**
 * Get completions for a habit within a date range.
 */
export const getForHabitInRange = query({
  args: {
    habitId: v.id('habits'),
    startDateKey: v.string(),
    endDateKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    if (!user) {
      return []
    }

    // Verify ownership
    const habit = await ctx.db.get(args.habitId)
    if (!habit || habit.userId !== user._id) {
      return []
    }

    // Get all completions for this habit and filter by date range
    const completions = await ctx.db
      .query('habitCompletions')
      .withIndex('by_habit_date', (q) => q.eq('habitId', args.habitId))
      .collect()

    return completions.filter(
      (c) => c.dateKey >= args.startDateKey && c.dateKey <= args.endDateKey
    )
  },
})

/**
 * Get all completions for the current user within a date range (for overall heatmap).
 */
export const getForUserInRange = query({
  args: {
    startDateKey: v.string(),
    endDateKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    if (!user) {
      return []
    }

    const completions = await ctx.db
      .query('habitCompletions')
      .withIndex('by_user_date', (q) => q.eq('userId', user._id))
      .collect()

    return completions.filter(
      (c) => c.dateKey >= args.startDateKey && c.dateKey <= args.endDateKey
    )
  },
})

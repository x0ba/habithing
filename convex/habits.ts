import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { scheduleRuleValidator } from './schema'

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
 * List all non-archived habits for the current user.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
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

    const habits = await ctx.db
      .query('habits')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    // Filter out archived habits
    return habits.filter((h) => !h.archivedAt)
  },
})

/**
 * Get a single habit by ID (with ownership check).
 */
export const get = query({
  args: { habitId: v.id('habits') },
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

    const habit = await ctx.db.get(args.habitId)
    if (!habit || habit.userId !== user._id) {
      return null
    }

    return habit
  },
})

/**
 * Create a new habit.
 */
export const create = mutation({
  args: {
    title: v.string(),
    notes: v.optional(v.string()),
    color: v.string(),
    schedule: v.array(scheduleRuleValidator),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    return await ctx.db.insert('habits', {
      userId: user._id,
      title: args.title,
      notes: args.notes,
      color: args.color,
      schedule: args.schedule,
    })
  },
})

/**
 * Update an existing habit.
 */
export const update = mutation({
  args: {
    habitId: v.id('habits'),
    title: v.optional(v.string()),
    notes: v.optional(v.string()),
    color: v.optional(v.string()),
    schedule: v.optional(v.array(scheduleRuleValidator)),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const habit = await ctx.db.get(args.habitId)
    if (!habit || habit.userId !== user._id) {
      throw new Error('Habit not found')
    }

    const updates: {
      title?: string
      notes?: string
      color?: string
      schedule?: typeof args.schedule
    } = {}

    if (args.title !== undefined) updates.title = args.title
    if (args.notes !== undefined) updates.notes = args.notes
    if (args.color !== undefined) updates.color = args.color
    if (args.schedule !== undefined) updates.schedule = args.schedule

    await ctx.db.patch(args.habitId, updates)
    return args.habitId
  },
})

/**
 * Archive a habit (soft delete).
 */
export const archive = mutation({
  args: { habitId: v.id('habits') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const habit = await ctx.db.get(args.habitId)
    if (!habit || habit.userId !== user._id) {
      throw new Error('Habit not found')
    }

    await ctx.db.patch(args.habitId, { archivedAt: Date.now() })
    return args.habitId
  },
})

/**
 * Unarchive a habit.
 */
export const unarchive = mutation({
  args: { habitId: v.id('habits') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const habit = await ctx.db.get(args.habitId)
    if (!habit || habit.userId !== user._id) {
      throw new Error('Habit not found')
    }

    await ctx.db.patch(args.habitId, { archivedAt: undefined })
    return args.habitId
  },
})

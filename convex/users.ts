import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

/**
 * Store or update the current user based on their Clerk identity.
 * Creates a new user if they don't exist, or updates their name if changed.
 */
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Called store without authentication present')
    }

    // Check if we've already stored this identity before
    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    if (user !== null) {
      // If we've seen this identity before but the name has changed, patch it
      if (user.name !== identity.name) {
        await ctx.db.patch(user._id, { name: identity.name ?? 'Anonymous' })
      }
      return user._id
    }

    // If it's a new identity, create a new user with default settings
    return await ctx.db.insert('users', {
      name: identity.name ?? 'Anonymous',
      tokenIdentifier: identity.tokenIdentifier,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      graceMinutes: 180, // Default 3am cutoff
    })
  },
})

/**
 * Get the current authenticated user
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    return await ctx.db
      .query('users')
      .withIndex('by_token', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier)
      )
      .unique()
  },
})

/**
 * Update user settings (timezone, grace minutes)
 */
export const updateSettings = mutation({
  args: {
    timeZone: v.optional(v.string()),
    graceMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Not authenticated')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) =>
        q.eq('tokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    const updates: { timeZone?: string; graceMinutes?: number } = {}
    if (args.timeZone !== undefined) updates.timeZone = args.timeZone
    if (args.graceMinutes !== undefined) updates.graceMinutes = args.graceMinutes

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates)
    }

    return user._id
  },
})

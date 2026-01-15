# Habit Tracker

A modern habit tracking application built with TanStack Start, Convex, and Clerk.

## Features

- **Habit Tracking**: Create and track daily, weekly, or monthly habits
- **Flexible Schedules**: Support for specific weekdays (e.g., Mon/Wed/Fri) or days of the month
- **Streaks**: Track consecutive completions with smart streak calculation
- **Grace Period**: 3am day boundary (configurable) - completions before 3am count for the previous day
- **Heatmaps**: Visualize your progress with GitHub-style contribution heatmaps
- **Dark/Light Theme**: Dynamic theme with system preference detection
- **Real-time Sync**: Powered by Convex for instant updates across devices

## Tech Stack

- **Frontend**: React 19, TanStack Start, TanStack Router, TanStack Form
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Backend**: Convex (real-time database + serverless functions)
- **Authentication**: Clerk
- **Type Safety**: TypeScript end-to-end

## Getting Started

### Prerequisites

- Node.js 20+
- Bun (or npm/pnpm)
- A Convex account (free at convex.dev)
- A Clerk account (free at clerk.com)

### Environment Variables

Create a `.env.local` file with:

```env
VITE_CONVEX_URL=your_convex_deployment_url
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Start Convex development server:
   ```bash
   bunx convex dev
   ```

3. In a separate terminal, start the app:
   ```bash
   bun run dev
   ```

4. Open http://localhost:3000

## Project Structure

```
├── convex/                 # Convex backend
│   ├── schema.ts          # Database schema
│   ├── users.ts           # User mutations/queries
│   ├── habits.ts          # Habit CRUD operations
│   ├── completions.ts     # Completion tracking
│   └── dashboard.ts       # Dashboard queries
├── src/
│   ├── components/        # React components
│   │   ├── Heatmap.tsx   # Contribution heatmap
│   │   ├── HabitCard.tsx # Habit display card
│   │   ├── HabitForm.tsx # Create/edit habit form
│   │   ├── HabitList.tsx # Habits list component
│   │   ├── ThemeProvider.tsx
│   │   └── ThemeToggle.tsx
│   ├── hooks/
│   │   └── useStoreUser.ts # Clerk-Convex user sync
│   ├── lib/
│   │   ├── dateKey.ts    # Date utilities with timezone support
│   │   └── schedule.ts   # Schedule evaluation & streak calculation
│   ├── routes/
│   │   ├── index.tsx     # Dashboard
│   │   ├── habits.new.tsx
│   │   └── habits.$habitId.tsx
│   └── integrations/
│       ├── clerk/        # Clerk auth provider
│       └── convex/       # Convex with Clerk integration
```

## Schedule Types

- **Daily**: Every day
- **Weekly**: Specific days of the week (e.g., Mon, Wed, Fri)
- **Monthly**: Specific days of the month (e.g., 1st and 15th)
- **Yearly**: Specific date each year

## License

MIT

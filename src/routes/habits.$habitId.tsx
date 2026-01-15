import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useMemo, useState } from 'react'
import { ArrowLeft, Trash2, Edit2, Archive } from 'lucide-react'
import { useStoreUser } from '../hooks/useStoreUser'
import { toDateKey, subtractDays } from '../lib/dateKey'
import { Heatmap } from '../components/Heatmap'
import { HabitForm } from '../components/HabitForm'
import {
  formatScheduleRules,
  calculateStreak,
  getScheduledDateKeysInRange,
  type ScheduleRule,
} from '../lib/schedule'
import type { Id } from '../../convex/_generated/dataModel'

export const Route = createFileRoute('/habits/$habitId')({
  component: HabitDetail,
})

function HabitDetail() {
  const { habitId } = Route.useParams()
  const { isLoading: isUserLoading, isAuthenticated } = useStoreUser()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  // Calculate date keys
  const { todayDateKey, historyStartDateKey } = useMemo(() => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const today = toDateKey({ timeZone: userTimeZone, graceMinutes: 180 })
    const start = subtractDays(today, 365) // 1 year of history
    return { todayDateKey: today, historyStartDateKey: start }
  }, [])

  const habitDetail = useQuery(
    api.dashboard.getHabitDetail,
    isAuthenticated
      ? {
          habitId: habitId as Id<'habits'>,
          todayDateKey,
          historyStartDateKey,
        }
      : 'skip'
  )

  const updateHabit = useMutation(api.habits.update)
  const archiveHabit = useMutation(api.habits.archive)
  const toggleCompletion = useMutation(api.completions.toggleForDate)

  // Calculate streak
  const streak = useMemo(() => {
    if (!habitDetail?.habit || !habitDetail.completedDates) return 0
    const schedule = habitDetail.habit.schedule as ScheduleRule[]
    const scheduledDates = getScheduledDateKeysInRange(
      schedule,
      historyStartDateKey,
      todayDateKey
    )
    const completedSet = new Set(habitDetail.completedDates)
    return calculateStreak(scheduledDates, completedSet, todayDateKey)
  }, [habitDetail, historyStartDateKey, todayDateKey])

  // Build heatmap data
  const heatmapData = useMemo(() => {
    if (!habitDetail?.heatmapData) return new Map()
    return new Map(habitDetail.heatmapData.map((d) => [d.dateKey, 1]))
  }, [habitDetail?.heatmapData])

  const handleUpdate = async (data: {
    title: string
    notes?: string
    color: string
    schedule: ScheduleRule[]
  }) => {
    await updateHabit({
      habitId: habitId as Id<'habits'>,
      title: data.title,
      notes: data.notes,
      color: data.color,
      schedule: data.schedule,
    })
    setIsEditing(false)
  }

  const handleArchive = async () => {
    await archiveHabit({ habitId: habitId as Id<'habits'> })
    navigate({ to: '/' })
  }

  const handleCellClick = async (dateKey: string) => {
    await toggleCompletion({
      habitId: habitId as Id<'habits'>,
      dateKey,
    })
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view habits</p>
          <Link to="/" className="text-primary hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!habitDetail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading habit...</div>
      </div>
    )
  }

  if (!habitDetail.habit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Habit not found</p>
          <Link to="/" className="text-primary hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const { habit } = habitDetail
  const scheduleText = formatScheduleRules(habit.schedule as ScheduleRule[])

  if (isEditing) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setIsEditing(false)}
              className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Cancel editing"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg">Edit Habit</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <HabitForm
            initialValues={{
              title: habit.title,
              notes: habit.notes || '',
              color: habit.color,
              schedule: habit.schedule as ScheduleRule[],
            }}
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: habit.color }}
              />
              <h1 className="font-bold text-lg">{habit.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Edit habit"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              aria-label="Archive habit"
            >
              <Archive className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="text-sm text-muted-foreground mb-1">Current Streak</div>
            <div className="text-3xl font-bold">
              {streak}
              <span className="text-lg font-normal text-muted-foreground ml-1">
                day{streak !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Completions</div>
            <div className="text-3xl font-bold">
              {habitDetail.completedDates.length}
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="bg-card rounded-xl border border-border p-4">
          <div className="text-sm text-muted-foreground mb-1">Schedule</div>
          <div className="font-medium">{scheduleText}</div>
          {habit.notes && (
            <p className="text-sm text-muted-foreground mt-2">{habit.notes}</p>
          )}
        </section>

        {/* Heatmap */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold mb-4">Completion History</h2>
          <Heatmap
            todayDateKey={todayDateKey}
            data={heatmapData}
            weeks="auto"
            minWeeks={8}
            maxWeeks={52}
            onCellClick={handleCellClick}
            maxValue={1}
            colorScale={(intensity) =>
              intensity > 0 ? habit.color : 'var(--muted)'
            }
          />
        </section>
      </main>

      {/* Archive confirmation modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">Archive Habit?</h3>
            <p className="text-muted-foreground mb-6">
              This will hide the habit from your dashboard. You can unarchive it later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

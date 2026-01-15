import type { Doc } from '../../convex/_generated/dataModel'
import type { DateKey } from '../lib/dateKey'
import { HabitCard } from './HabitCard'
import { isDueOn, type ScheduleRule } from '../lib/schedule'

interface HabitListProps {
  habits: (Doc<'habits'> & { isCompletedToday: boolean })[]
  todayDateKey: DateKey
  showAll?: boolean
}

export function HabitList({ habits, todayDateKey, showAll = false }: HabitListProps) {
  // Separate habits into due today and others
  const dueToday = habits.filter((h) => isDueOn(todayDateKey, h.schedule as ScheduleRule[]))
  const notDueToday = habits.filter((h) => !isDueOn(todayDateKey, h.schedule as ScheduleRule[]))

  // Sort: incomplete first, then alphabetically
  const sortHabits = (a: typeof habits[0], b: typeof habits[0]) => {
    if (a.isCompletedToday !== b.isCompletedToday) {
      return a.isCompletedToday ? 1 : -1
    }
    return a.title.localeCompare(b.title)
  }

  const sortedDueToday = [...dueToday].sort(sortHabits)
  const sortedNotDueToday = [...notDueToday].sort(sortHabits)

  const completedCount = dueToday.filter((h) => h.isCompletedToday).length
  const totalDueCount = dueToday.length

  return (
    <div className="space-y-6">
      {/* Today's habits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Today's Habits</h2>
          {totalDueCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalDueCount} done
            </span>
          )}
        </div>

        {sortedDueToday.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No habits scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDueToday.map((habit) => (
              <HabitCard key={habit._id} habit={habit} todayDateKey={todayDateKey} />
            ))}
          </div>
        )}
      </div>

      {/* Other habits (not due today) */}
      {showAll && sortedNotDueToday.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Other Habits</h2>
          <div className="space-y-3 opacity-75">
            {sortedNotDueToday.map((habit) => (
              <HabitCard key={habit._id} habit={habit} todayDateKey={todayDateKey} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

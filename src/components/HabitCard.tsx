import { Link } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Check, ChevronRight } from 'lucide-react'
import type { Doc, Id } from '../../convex/_generated/dataModel'
import { formatScheduleRules, type ScheduleRule, isDueOn } from '../lib/schedule'
import type { DateKey } from '../lib/dateKey'

interface HabitCardProps {
  habit: Doc<'habits'> & { isCompletedToday: boolean }
  todayDateKey: DateKey
}

export function HabitCard({ habit, todayDateKey }: HabitCardProps) {
  const toggleCompletion = useMutation(api.completions.toggleForDate)

  const isDueToday = isDueOn(todayDateKey, habit.schedule as ScheduleRule[])
  const scheduleText = formatScheduleRules(habit.schedule as ScheduleRule[])

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await toggleCompletion({
      habitId: habit._id as Id<'habits'>,
      dateKey: todayDateKey,
    })
  }

  return (
    <Link
      to="/habits/$habitId"
      params={{ habitId: habit._id }}
      className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200"
    >
      {/* Completion button */}
      <button
        onClick={handleToggle}
        className={`
          flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center
          transition-all duration-200
          ${
            habit.isCompletedToday
              ? 'border-transparent text-white'
              : 'border-muted-foreground/30 hover:border-primary/50'
          }
        `}
        style={{
          backgroundColor: habit.isCompletedToday ? habit.color : 'transparent',
        }}
        aria-label={habit.isCompletedToday ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {habit.isCompletedToday && <Check className="w-5 h-5" />}
      </button>

      {/* Habit info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: habit.color }}
          />
          <h3
            className={`font-medium truncate ${
              habit.isCompletedToday ? 'line-through text-muted-foreground' : ''
            }`}
          >
            {habit.title}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{scheduleText}</p>
        {!isDueToday && !habit.isCompletedToday && (
          <p className="text-xs text-muted-foreground/70 mt-1">Not scheduled for today</p>
        )}
      </div>

      {/* Arrow indicator */}
      <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
    </Link>
  )
}

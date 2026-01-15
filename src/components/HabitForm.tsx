import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import type { ScheduleRule } from '../lib/schedule'

interface HabitFormProps {
  initialValues?: {
    title: string
    notes: string
    color: string
    schedule: ScheduleRule[]
  }
  onSubmit: (data: {
    title: string
    notes?: string
    color: string
    schedule: ScheduleRule[]
  }) => Promise<void>
  submitLabel?: string
}

const PRESET_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
]

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

export function HabitForm({
  initialValues,
  onSubmit,
  submitLabel = 'Create Habit',
}: HabitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'monthly'>(() => {
    if (!initialValues?.schedule.length) return 'daily'
    const first = initialValues.schedule[0]
    return first.kind === 'monthly' ? 'monthly' : first.kind === 'weekly' ? 'weekly' : 'daily'
  })
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(() => {
    if (!initialValues?.schedule.length) return [1, 2, 3, 4, 5] // Weekdays default
    const weekly = initialValues.schedule.find((s) => s.kind === 'weekly')
    return weekly && weekly.kind === 'weekly' ? weekly.weekdays : [1, 2, 3, 4, 5]
  })
  const [selectedDaysOfMonth, setSelectedDaysOfMonth] = useState<number[]>(() => {
    if (!initialValues?.schedule.length) return [1, 15]
    const monthly = initialValues.schedule.find((s) => s.kind === 'monthly')
    return monthly && monthly.kind === 'monthly' ? monthly.daysOfMonth : [1, 15]
  })

  const form = useForm({
    defaultValues: {
      title: initialValues?.title || '',
      notes: initialValues?.notes || '',
      color: initialValues?.color || PRESET_COLORS[0],
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        let schedule: ScheduleRule[]
        switch (scheduleType) {
          case 'daily':
            schedule = [{ kind: 'daily' }]
            break
          case 'weekly':
            schedule = [{ kind: 'weekly', weekdays: selectedWeekdays }]
            break
          case 'monthly':
            schedule = [{ kind: 'monthly', daysOfMonth: selectedDaysOfMonth }]
            break
        }

        await onSubmit({
          title: value.title,
          notes: value.notes || undefined,
          color: value.color,
          schedule,
        })
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const toggleDayOfMonth = (day: number) => {
    setSelectedDaysOfMonth((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-2">Habit Name</label>
        <form.Field name="title">
          {(field) => (
            <input
              type="text"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="e.g., Morning meditation"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          )}
        </form.Field>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <form.Field name="notes">
          {(field) => (
            <textarea
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Add any notes or reminders..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          )}
        </form.Field>
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium mb-3">Color</label>
        <form.Field name="color">
          {(field) => (
            <div className="flex flex-wrap gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => field.handleChange(color)}
                  className={`w-10 h-10 rounded-full transition-all ${
                    field.state.value === color
                      ? 'ring-2 ring-offset-2 ring-ring ring-offset-background scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          )}
        </form.Field>
      </div>

      {/* Schedule */}
      <div>
        <label className="block text-sm font-medium mb-3">Schedule</label>

        {/* Schedule type tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
          {(['daily', 'weekly', 'monthly'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setScheduleType(type)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                scheduleType === type
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Weekly options */}
        {scheduleType === 'weekly' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Select days of the week:</p>
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleWeekday(day.value)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    selectedWeekdays.includes(day.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {selectedWeekdays.length === 0 && (
              <p className="text-sm text-destructive">Select at least one day</p>
            )}
          </div>
        )}

        {/* Monthly options */}
        {scheduleType === 'monthly' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Select days of the month:</p>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDayOfMonth(day)}
                  className={`h-10 rounded-lg text-sm font-medium transition-all ${
                    selectedDaysOfMonth.includes(day)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            {selectedDaysOfMonth.length === 0 && (
              <p className="text-sm text-destructive">Select at least one day</p>
            )}
          </div>
        )}

        {/* Daily message */}
        {scheduleType === 'daily' && (
          <p className="text-sm text-muted-foreground">This habit will be due every day.</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={
          isSubmitting ||
          (scheduleType === 'weekly' && selectedWeekdays.length === 0) ||
          (scheduleType === 'monthly' && selectedDaysOfMonth.length === 0)
        }
        className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}

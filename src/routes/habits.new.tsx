import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { HabitForm } from '../components/HabitForm'
import { ArrowLeft } from 'lucide-react'
import { useStoreUser } from '../hooks/useStoreUser'
import type { ScheduleRule } from '../lib/schedule'

export const Route = createFileRoute('/habits/new')({ component: NewHabit })

function NewHabit() {
  const { isLoading, isAuthenticated } = useStoreUser()
  const navigate = useNavigate()
  const createHabit = useMutation(api.habits.create)

  const handleSubmit = async (data: {
    title: string
    notes?: string
    color: string
    schedule: ScheduleRule[]
  }) => {
    await createHabit({
      title: data.title,
      notes: data.notes,
      color: data.color,
      schedule: data.schedule,
    })
    navigate({ to: '/' })
  }

  if (isLoading) {
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
          <p className="text-muted-foreground mb-4">Please sign in to create habits</p>
          <Link to="/" className="text-primary hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/"
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-lg">New Habit</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <HabitForm onSubmit={handleSubmit} />
      </main>
    </div>
  )
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useMemo, useState, useEffect } from 'react'
import { Plus, ListChecks } from 'lucide-react'
import { useStoreUser } from '../hooks/useStoreUser'
import { toDateKey, subtractDays } from '../lib/dateKey'
import { Heatmap } from '../components/Heatmap'
import { HabitList } from '../components/HabitList'
import { ThemeToggle } from '../components/ThemeToggle'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

export const Route = createFileRoute('/')({ component: Dashboard })

function Dashboard() {
  const { isLoading, isAuthenticated } = useStoreUser()
  const [showAllHabits, setShowAllHabits] = useState(false)

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/c2ddf3bc-d56b-4bf3-aaed-1ce933513c00',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.tsx:20',message:'Dashboard useStoreUser state',data:{isLoading,isAuthenticated},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
  }, [isLoading, isAuthenticated]);
  // #endregion

  // Calculate date keys
  // Query enough data to cover max weeks (52) so auto-sizing can show as many as fit
  const { todayDateKey, heatmapStartDateKey } = useMemo(() => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const today = toDateKey({ timeZone: userTimeZone, graceMinutes: 180 })
    const start = subtractDays(today, 52 * 7) // Query up to 52 weeks of history
    return { todayDateKey: today, heatmapStartDateKey: start }
  }, [])

  const dashboardData = useQuery(
    api.dashboard.getDashboard,
    isAuthenticated
      ? { todayDateKey, heatmapStartDateKey }
      : 'skip'
  )

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/c2ddf3bc-d56b-4bf3-aaed-1ce933513c00',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.tsx:38',message:'Dashboard query state',data:{isAuthenticated,dashboardDataExists:!!dashboardData,dashboardUserName:dashboardData?.user?.name},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D'})}).catch(()=>{});
  }, [isAuthenticated, dashboardData]);
  // #endregion

  // Build heatmap data
  const heatmapData = useMemo(() => {
    if (!dashboardData?.heatmapData) return new Map()
    return new Map(dashboardData.heatmapData.map((d) => [d.dateKey, d.count]))
  }, [dashboardData?.heatmapData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <ListChecks className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Habit Tracker</h1>
              <SignedIn>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.user?.name || 'Loading...'}
                </p>
              </SignedIn>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <SignedIn>
              <Link
                to="/habits/new"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Habit</span>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <SignedOut>
          <div className="text-center py-16 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <ListChecks className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Build Better Habits</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Track your daily habits, build streaks, and visualize your progress
                with beautiful heatmaps.
              </p>
            </div>
            <SignInButton mode="modal">
              <button className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">
                Get Started
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {!dashboardData ? (
            <div className="text-center py-16 text-muted-foreground">
              Loading your dashboard...
            </div>
          ) : (
            <div className="space-y-8">
              {/* Overall Heatmap */}
              <section className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-semibold mb-4">Activity Overview</h2>
                <Heatmap
                  todayDateKey={todayDateKey}
                  data={heatmapData}
                  weeks="auto"
                  minWeeks={8}
                  maxWeeks={52}
                />
              </section>

              {/* Habits List */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowAllHabits(!showAllHabits)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showAllHabits ? 'Show due only' : 'Show all habits'}
                    </button>
                  </div>
                </div>

                {dashboardData.habits.length === 0 ? (
                  <div className="text-center py-16 space-y-4 bg-card rounded-2xl border border-border">
                    <div className="w-16 h-16 mx-auto rounded-xl bg-muted flex items-center justify-center">
                      <Plus className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">No habits yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Create your first habit to start tracking
                      </p>
                    </div>
                    <Link
                      to="/habits/new"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Create Habit
                    </Link>
                  </div>
                ) : (
                  <HabitList
                    habits={dashboardData.habits}
                    todayDateKey={todayDateKey}
                    showAll={showAllHabits}
                  />
                )}
              </section>
            </div>
          )}
        </SignedIn>
      </main>
    </div>
  )
}

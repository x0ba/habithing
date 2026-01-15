import { useMemo, useState, useRef, useEffect } from 'react'
import {
  type DateKey,
  subtractDays,
  getDayOfWeek,
  addDays,
  parseDateKey,
  formatDateKeyForDisplay,
} from '../lib/dateKey'

interface HeatmapProps {
  /** Today's date key (rightmost column) */
  todayDateKey: DateKey
  /** Map of dateKey to count/value */
  data: Map<DateKey, number>
  /** Number of weeks to display, or 'auto' to compute from container width */
  weeks?: number | 'auto'
  /** Minimum weeks when using 'auto' mode (default: 8) */
  minWeeks?: number
  /** Maximum weeks when using 'auto' mode (default: 52) */
  maxWeeks?: number
  /** Optional click handler for cells */
  onCellClick?: (dateKey: DateKey) => void
  /** Color scale function (0-1) -> CSS color */
  colorScale?: (intensity: number) => string
  /** Max value for normalization (if not provided, uses max from data) */
  maxValue?: number
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const DEFAULT_COLOR_SCALE = (intensity: number): string => {
  if (intensity === 0) return 'var(--muted)'
  // Green scale matching GitHub's contribution graph
  const colors = [
    'oklch(0.85 0.15 145)', // lightest green
    'oklch(0.75 0.18 145)',
    'oklch(0.60 0.20 145)',
    'oklch(0.45 0.20 145)', // darkest green
  ]
  const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1)
  return colors[index]
}

export function Heatmap({
  todayDateKey,
  data,
  weeks = 16,
  minWeeks = 8,
  maxWeeks = 52,
  onCellClick,
  colorScale = DEFAULT_COLOR_SCALE,
  maxValue,
}: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<DateKey | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Measure container width for responsive sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    updateWidth()
    const resizeObserver = new ResizeObserver(updateWidth)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Compute effective weeks from container width when weeks === 'auto'
  const effectiveWeeks = useMemo(() => {
    if (weeks !== 'auto') {
      return weeks
    }

    if (!containerWidth) {
      return minWeeks // Default fallback
    }

    // Fixed design constants
    const cellSize = 12
    const gap = 2
    const dayLabelWidth = 32 // 2rem = 32px
    const padding = 0 // No extra padding needed, containerWidth already accounts for available space

    // Calculate available width for columns
    const availableWidth = containerWidth - dayLabelWidth - padding

    // Calculate how many columns fit
    // Formula: availableWidth >= numColumns * cellSize + (numColumns - 1) * gap
    // availableWidth >= numColumns * (cellSize + gap) - gap
    // numColumns <= (availableWidth + gap) / (cellSize + gap)
    // Use floor, but be more aggressive - allow a small amount of overflow to fill space
    const numColumnsFit = Math.floor((availableWidth + gap) / (cellSize + gap))
    
    // If there's significant remaining space (more than half a column), add one more column
    // This helps fill the container better
    const remainingSpace = availableWidth - (numColumnsFit * (cellSize + gap) - gap)
    const adjustedColumns = remainingSpace > (cellSize + gap) / 2 ? numColumnsFit + 1 : numColumnsFit

    // Convert columns to weeks
    // The grid builds columns based on: ceil((weeks * 7 + todayDayOfWeek) / 7)
    // If today is Sunday (day 0): numColumns = weeks
    // If today is not Sunday: numColumns = weeks + 1
    // So to reverse: weeks = numColumns - (todayDayOfWeek > 0 ? 1 : 0)
    const todayDayOfWeek = getDayOfWeek(todayDateKey)
    let computedWeeks = adjustedColumns
    if (todayDayOfWeek > 0) {
      computedWeeks = Math.max(1, adjustedColumns - 1)
    }

    // Clamp to min/max bounds
    return Math.max(minWeeks, Math.min(maxWeeks, computedWeeks))
  }, [weeks, containerWidth, todayDateKey, minWeeks, maxWeeks])

  const { grid, months, normalizedMax, numColumns } = useMemo(() => {
    // Calculate the start date (align to start of week)
    const totalDays = effectiveWeeks * 7
    const rawStartDate = subtractDays(todayDateKey, totalDays - 1)
    const startDayOfWeek = getDayOfWeek(rawStartDate)
    const startDate = subtractDays(rawStartDate, startDayOfWeek) // Align to Sunday

    // Calculate actual total days after alignment
    const todayDayOfWeek = getDayOfWeek(todayDateKey)
    const actualTotalDays = effectiveWeeks * 7 + todayDayOfWeek

    // Build the grid (7 rows x N columns)
    const grid: (DateKey | null)[][] = Array.from({ length: 7 }, () => [])
    const monthLabels: { month: string; column: number }[] = []
    let lastMonth = ''

    let currentDate = startDate
    for (let col = 0; col < Math.ceil(actualTotalDays / 7); col++) {
      for (let row = 0; row < 7; row++) {
        const dayOfWeek = getDayOfWeek(currentDate)
        if (dayOfWeek === row) {
          // Track month changes
          const { month, year } = parseDateKey(currentDate)
          const monthKey = `${year}-${month}`
          if (monthKey !== lastMonth) {
            lastMonth = monthKey
            const monthName = new Date(year, month - 1).toLocaleDateString('en-US', {
              month: 'short',
            })
            monthLabels.push({ month: monthName, column: col })
          }

          // Only add dates up to today
          if (currentDate <= todayDateKey) {
            grid[row].push(currentDate)
          } else {
            grid[row].push(null)
          }
          currentDate = addDays(currentDate, 1)
        } else {
          grid[row].push(null)
        }
      }
    }

    // Calculate max value for normalization
    const values = Array.from(data.values())
    const normalizedMax = maxValue ?? Math.max(...values, 1)

    const numColumns = grid[0].length

    return { grid, months: monthLabels, normalizedMax, numColumns }
  }, [todayDateKey, data, effectiveWeeks, maxValue])

  // Calculate responsive cell size
  // When using auto weeks, use fixed cell size/gap; otherwise scale to fit
  const { cellSize, gap, columnWidth } = useMemo(() => {
    if (!containerWidth || numColumns === 0) {
      // Default fallback sizes
      return { cellSize: 12, gap: 2, columnWidth: 14 }
    }

    // Reserve space for day labels (2rem) and padding
    const dayLabelWidth = 32 // 2rem = 32px
    const availableWidth = containerWidth - dayLabelWidth - 8 // 8px for margins
    
    if (weeks === 'auto') {
      // Use fixed cell size and gap when auto-sizing weeks
      const fixedCellSize = 12
      const fixedGap = 2
      return {
        cellSize: fixedCellSize,
        gap: fixedGap,
        columnWidth: fixedCellSize + fixedGap,
      }
    }
    
    // For fixed weeks, scale cell size to fit available width
    // Calculate cell size: (availableWidth - (numColumns - 1) * gap) / numColumns
    // We want gap to be proportional to cell size (roughly 1/6 of cell size)
    // So: availableWidth = numColumns * cellSize + (numColumns - 1) * (cellSize / 6)
    // availableWidth = cellSize * (numColumns + (numColumns - 1) / 6)
    // availableWidth = cellSize * (7 * numColumns - 1) / 6
    // cellSize = availableWidth * 6 / (7 * numColumns - 1)
    
    const calculatedCellSize = Math.max(
      8, // Minimum cell size
      Math.min(
        16, // Maximum cell size
        (availableWidth * 6) / (7 * numColumns - 1)
      )
    )
    
    const calculatedGap = Math.max(1, calculatedCellSize / 6)
    const calculatedColumnWidth = calculatedCellSize + calculatedGap

    return {
      cellSize: calculatedCellSize,
      gap: calculatedGap,
      columnWidth: calculatedColumnWidth,
    }
  }, [containerWidth, numColumns, weeks])

  // Filter out overlapping month labels
  const visibleMonths = useMemo(() => {
    if (months.length === 0) return []
    
    const filtered: typeof months = [months[0]]
    
    // Minimum spacing based on cell size (roughly 2-3 characters worth)
    const minSpacing = Math.max(20, columnWidth * 1.5)
    
    for (let i = 1; i < months.length; i++) {
      const prev = filtered[filtered.length - 1]
      const curr = months[i]
      
      const spacing = (curr.column - prev.column) * columnWidth
      
      if (spacing >= minSpacing) {
        filtered.push(curr)
      }
    }
    
    return filtered
  }, [months, columnWidth])

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Month labels */}
      <div className="flex mb-1 ml-8 text-xs text-muted-foreground relative" style={{ height: `${cellSize}px` }}>
        {visibleMonths.map(({ month, column }, i) => (
          <div
            key={i}
            className="absolute"
            style={{ left: `calc(2rem + ${column * columnWidth}px)` }}
          >
            {month}
          </div>
        ))}
      </div>

      <div className="flex mt-5 w-full">
        {/* Day labels */}
        <div 
          className="flex flex-col text-xs text-muted-foreground mr-2 shrink-0"
          style={{ gap: `${gap}px`, width: '2rem' }}
        >
          {DAYS_OF_WEEK.map((day, i) => (
            <div
              key={day}
              className="leading-none flex items-center"
              style={{ 
                height: `${cellSize}px`,
                visibility: i % 2 === 1 ? 'visible' : 'hidden' 
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex flex-1 min-w-0" style={{ gap: `${gap}px` }}>
          {grid[0].map((_, colIndex) => (
            <div key={colIndex} className="flex flex-col shrink-0" style={{ gap: `${gap}px` }}>
              {grid.map((row, rowIndex) => {
                const dateKey = row[colIndex]
                if (!dateKey) {
                  return (
                    <div
                      key={rowIndex}
                      className="rounded-sm"
                      style={{ 
                        width: `${cellSize}px`, 
                        height: `${cellSize}px`,
                        minWidth: `${cellSize}px`,
                        minHeight: `${cellSize}px`
                      }}
                    />
                  )
                }

                const value = data.get(dateKey) || 0
                const intensity = normalizedMax > 0 ? value / normalizedMax : 0
                const color = colorScale(intensity)

                return (
                  <div
                    key={rowIndex}
                    className="rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-ring focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ 
                      backgroundColor: color,
                      width: `${cellSize}px`, 
                      height: `${cellSize}px`,
                      minWidth: `${cellSize}px`,
                      minHeight: `${cellSize}px`
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${formatDateKeyForDisplay(dateKey)}: ${value} completion${value !== 1 ? 's' : ''}`}
                    onClick={() => onCellClick?.(dateKey)}
                    onMouseEnter={() => setHoveredCell(dateKey)}
                    onMouseLeave={() => setHoveredCell(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onCellClick?.(dateKey)
                      }
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg border border-border whitespace-nowrap z-10">
          <div className="font-medium">{formatDateKeyForDisplay(hoveredCell)}</div>
          <div className="text-muted-foreground">
            {data.get(hoveredCell) || 0} completion
            {(data.get(hoveredCell) || 0) !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}

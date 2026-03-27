import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, parseISO, addDays } from 'date-fns'
import { getTasks, getLogsForRange } from '../lib/db'

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [currentMonth])

  async function load() {
    setLoading(true)
    try {
      const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
      const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
      const [allTasks, rangeLogs] = await Promise.all([getTasks(), getLogsForRange(from, to)])
      setTasks(allTasks)
      setLogs(rangeLogs)
    } finally {
      setLoading(false)
    }
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startPad = startOfMonth(currentMonth).getDay()

  function getLogsForDay(date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return logs.filter((l) => l.date === dateStr)
  }

  function getDayStatus(date) {
    const dayLogs = getLogsForDay(date)
    if (!dayLogs.length) return 'empty'
    const done = dayLogs.filter((l) => l.status === 'done').length
    const total = dayLogs.length
    if (done === total) return 'full'
    if (done > 0) return 'partial'
    return 'empty'
  }

  // Upcoming scheduled tasks
  const today = new Date()
  const upcoming = tasks
    .filter((t) => t.task_type === 'scheduled' && t.next_due_date)
    .filter((t) => parseISO(t.next_due_date) >= today)
    .sort((a, b) => parseISO(a.next_due_date) - parseISO(b.next_due_date))
    .slice(0, 8)

  const selectedLogs = selectedDate ? getLogsForDay(selectedDate) : []
  const selectedTaskIds = selectedLogs.map((l) => l.task_id)
  const selectedTaskDetails = selectedLogs.map((log) => ({
    log,
    task: tasks.find((t) => t.id === log.task_id),
  })).filter((x) => x.task)

  return (
    <div className="page-content">
      <div className="px-4 pt-14 pb-4">
        <h1 className="text-2xl font-bold text-slate-100 mb-6">Calendar</h1>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-base font-semibold text-slate-200">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-xs text-slate-500 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const status = getDayStatus(day)
            const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
            const todayDay = isToday(day)
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-colors relative
                  ${isSelected ? 'bg-green-400 text-slate-900' : todayDay ? 'bg-slate-700 text-green-400' : 'text-slate-400'}
                `}
              >
                {format(day, 'd')}
                {status !== 'empty' && !isSelected && (
                  <div className={`absolute bottom-1 w-1 h-1 rounded-full ${status === 'full' ? 'bg-green-400' : 'bg-amber-400'}`} />
                )}
              </button>
            )
          })}
        </div>

        {/* Selected date detail */}
        {selectedDate && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">
              {format(selectedDate, 'EEEE, MMMM d')}
            </h3>
            {selectedTaskDetails.length === 0 ? (
              <p className="text-slate-500 text-sm">No activity recorded.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedTaskDetails.map(({ log, task }) => (
                  <div key={log.task_id} className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
                    <span className="text-slate-200 text-sm">{task.name}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${
                      log.status === 'done' ? 'bg-green-400/15 text-green-400' :
                      log.status === 'skipped' ? 'bg-slate-700 text-slate-400' :
                      'bg-amber-400/15 text-amber-400'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upcoming scheduled */}
        {upcoming.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Upcoming Scheduled</h3>
            <div className="flex flex-col gap-2">
              {upcoming.map((task) => (
                <div key={task.id} className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
                  <span className="text-slate-200 text-sm">{task.name}</span>
                  <span className="text-xs text-slate-400">
                    {format(parseISO(task.next_due_date), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

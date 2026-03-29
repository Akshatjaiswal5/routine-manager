import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, parseISO } from 'date-fns'
import { getTasks, getLogsForRange } from '../lib/db'

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [currentMonth])

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
    return logs.filter((l) => l.date === format(date, 'yyyy-MM-dd'))
  }

  function getDayStatus(date) {
    const dayLogs = getLogsForDay(date)
    if (!dayLogs.length) return 'empty'
    const done = dayLogs.filter((l) => l.status === 'done').length
    if (done === dayLogs.length) return 'full'
    if (done > 0) return 'partial'
    return 'empty'
  }

  const upcoming = tasks
    .filter((t) => t.task_type === 'scheduled' && t.next_due_date)
    .filter((t) => parseISO(t.next_due_date) >= new Date())
    .sort((a, b) => parseISO(a.next_due_date) - parseISO(b.next_due_date))
    .slice(0, 8)

  const selectedLogs = selectedDate ? getLogsForDay(selectedDate) : []
  const selectedTaskDetails = selectedLogs.map((log) => ({
    log, task: tasks.find((t) => t.id === log.task_id),
  })).filter((x) => x.task)

  return (
    <div className="page-content">
      <div className="px-6 pt-14 pb-4">
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5, color: '#000', marginBottom: 20 }}>Calendar</h1>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="w-9 h-9 flex items-center justify-center rounded-xl card" style={{ color: '#636366' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[17px] font-semibold" style={{ color: '#000' }}>{format(currentMonth, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="w-9 h-9 flex items-center justify-center rounded-xl card" style={{ color: '#636366' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-center section-label py-1">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-0.5 mb-6">
          {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}
          {days.map((day) => {
            const status = getDayStatus(day)
            const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
            const todayDay = isToday(day)
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className="aspect-square rounded-xl flex flex-col items-center justify-center text-[13px] font-medium relative transition-all"
                style={
                  isSelected
                    ? { backgroundColor: '#30D158', color: '#000' }
                    : todayDay
                    ? { backgroundColor: '#E8F8ED', color: '#166534', fontWeight: 700 }
                    : { color: '#000' }
                }
              >
                {format(day, 'd')}
                {status !== 'empty' && !isSelected && (
                  <span
                    className="absolute bottom-[3px] w-1 h-1 rounded-full"
                    style={{ backgroundColor: status === 'full' ? '#30D158' : '#ff9500' }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Selected day */}
        {selectedDate && (
          <div className="mb-6">
            <p className="section-label mb-3">{format(selectedDate, 'EEEE, MMMM d')}</p>
            {selectedTaskDetails.length === 0 ? (
              <p className="text-[15px]" style={{ color: '#636366' }}>No activity recorded.</p>
            ) : (
              <div className="card overflow-hidden">
                {selectedTaskDetails.map(({ log, task }, i) => (
                  <div key={log.task_id} className="flex items-center justify-between px-4 py-3" style={i > 0 ? { borderTop: '1px solid #f2f2f7' } : {}}>
                    <span className="text-[15px]" style={{ color: '#000' }}>{task.name}</span>
                    <span
                      className="text-[12px] font-semibold px-2.5 py-1 rounded-lg"
                      style={
                        log.status === 'done'
                          ? { backgroundColor: '#E8F8ED', color: '#166534' }
                          : log.status === 'skipped'
                          ? { backgroundColor: '#f2f2f7', color: '#636366' }
                          : { backgroundColor: '#fff3e0', color: '#ff9500' }
                      }
                    >
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
            <p className="section-label mb-3">Upcoming</p>
            <div className="card overflow-hidden">
              {upcoming.map((task, i) => (
                <div key={task.id} className="flex items-center justify-between px-4 py-3" style={i > 0 ? { borderTop: '1px solid #f2f2f7' } : {}}>
                  <span className="text-[15px]" style={{ color: '#000' }}>{task.name}</span>
                  <span className="text-[13px] font-medium" style={{ color: '#636366' }}>{format(parseISO(task.next_due_date), 'MMM d')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

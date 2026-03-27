import { useEffect, useState } from 'react'
import { format, addDays } from 'date-fns'
import { getModules, getTasks, getLogsForDate, upsertLog, postponeTask, completeScheduledTask } from '../lib/db'
import { scheduleAllNotifications } from '../lib/notifications'
import ModuleSection from '../components/ModuleSection'

const today = () => format(new Date(), 'yyyy-MM-dd')
const dayOfWeek = () => new Date().getDay() // 0=Sun, 6=Sat

function isTaskDueToday(task) {
  if (task.task_type === 'daily') return true
  if (task.task_type === 'scheduled') {
    return task.next_due_date === today()
  }
  return false
}

function getSlotLabel(slot) {
  if (slot === 'morning') return 'Morning'
  if (slot === 'night') return 'Night'
  return null
}

export default function Today() {
  const [modules, setModules] = useState([])
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const dateStr = today()
  const dateLabel = format(new Date(), 'EEEE, MMM d')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const [mods, allTasks, todayLogs] = await Promise.all([
        getModules(),
        getTasks(),
        getLogsForDate(dateStr),
      ])
      setModules(mods)
      setTasks(allTasks)
      setLogs(todayLogs)
      scheduleAllNotifications(allTasks.filter((t) => isTaskDueToday(t)))
    } finally {
      setLoading(false)
    }
  }

  async function handleDone(task) {
    if (task.task_type === 'scheduled') {
      await completeScheduledTask(task.id, task.interval_days || 3)
    } else {
      await upsertLog(task.id, dateStr, 'done')
    }
    setLogs((prev) => {
      const existing = prev.findIndex((l) => l.task_id === task.id)
      const entry = { task_id: task.id, date: dateStr, status: 'done' }
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = entry
        return next
      }
      return [...prev, entry]
    })
  }

  async function handleSkip(task) {
    await upsertLog(task.id, dateStr, 'skipped')
    setLogs((prev) => {
      const existing = prev.findIndex((l) => l.task_id === task.id)
      const entry = { task_id: task.id, date: dateStr, status: 'skipped' }
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = entry
        return next
      }
      return [...prev, entry]
    })
  }

  async function handlePostpone(task, days) {
    const hoursToAdd = days * 24
    const newDate = format(addDays(new Date(), Math.ceil(days)), 'yyyy-MM-dd')
    await postponeTask(task.id, newDate)
    // Remove task from today's view
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
  }

  const dueTasks = tasks.filter(isTaskDueToday)

  // Group by module, then by slot for daily tasks
  const morningTasks = dueTasks.filter((t) => t.task_type === 'daily' && (t.slot === 'morning' || t.slot === 'both'))
  const nightTasks = dueTasks.filter((t) => t.task_type === 'daily' && (t.slot === 'night' || t.slot === 'both'))
  const scheduledTasks = dueTasks.filter((t) => t.task_type === 'scheduled')

  const totalDue = dueTasks.length
  const totalDone = logs.filter((l) => l.status === 'done' && dueTasks.find((t) => t.id === l.task_id)).length
  const allDone = totalDue > 0 && totalDone === totalDue

  function getModuleForTask(task) {
    return modules.find((m) => m.id === task.module_id) || { name: 'Other', icon: '✦', color: '#94a3b8' }
  }

  // Group scheduled tasks by module
  const scheduledByModule = modules.map((mod) => ({
    module: mod,
    tasks: scheduledTasks.filter((t) => t.module_id === mod.id),
  })).filter((g) => g.tasks.length > 0)

  // Group morning/night by module
  const morningByModule = modules.map((mod) => ({
    module: mod,
    tasks: morningTasks.filter((t) => t.module_id === mod.id),
  })).filter((g) => g.tasks.length > 0)

  const nightByModule = modules.map((mod) => ({
    module: mod,
    tasks: nightTasks.filter((t) => t.module_id === mod.id),
  })).filter((g) => g.tasks.length > 0)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="px-4 pt-14 pb-4">
        {/* Header */}
        <div className="mb-6">
          <p className="text-slate-400 text-sm">{dateLabel}</p>
          <h1 className="text-2xl font-bold text-slate-100 mt-0.5">
            {allDone ? 'All done for today ' : "Today's Routine"}
          </h1>
          {totalDue > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{totalDone} of {totalDue} complete</span>
                <span>{Math.round((totalDone / totalDue) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${(totalDone / totalDue) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {totalDue === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✦</p>
            <p className="text-slate-400">No tasks for today.</p>
            <p className="text-slate-500 text-sm mt-1">Add some in Manage.</p>
          </div>
        )}

        {/* Morning */}
        {morningByModule.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">🌅</span>
              <h2 className="text-base font-semibold text-slate-300">Morning</h2>
            </div>
            {morningByModule.map(({ module, tasks }) => (
              <ModuleSection
                key={module.id}
                module={module}
                tasks={tasks}
                logs={logs}
                onDone={handleDone}
                onSkip={handleSkip}
                onPostpone={handlePostpone}
              />
            ))}
          </section>
        )}

        {/* Night */}
        {nightByModule.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">🌙</span>
              <h2 className="text-base font-semibold text-slate-300">Night</h2>
            </div>
            {nightByModule.map(({ module, tasks }) => (
              <ModuleSection
                key={module.id}
                module={module}
                tasks={tasks}
                logs={logs}
                onDone={handleDone}
                onSkip={handleSkip}
                onPostpone={handlePostpone}
              />
            ))}
          </section>
        )}

        {/* Scheduled (haircare, medicines etc) */}
        {scheduledByModule.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">📅</span>
              <h2 className="text-base font-semibold text-slate-300">Scheduled</h2>
            </div>
            {scheduledByModule.map(({ module, tasks }) => (
              <ModuleSection
                key={module.id}
                module={module}
                tasks={tasks}
                logs={logs}
                onDone={handleDone}
                onSkip={handleSkip}
                onPostpone={handlePostpone}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

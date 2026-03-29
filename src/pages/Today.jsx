import { useEffect, useState } from 'react'
import { format, addDays } from 'date-fns'
import { getModules, getTasks, getLogsForDate, upsertLog, postponeTask, completeScheduledTask } from '../lib/db'
import { scheduleAllNotifications } from '../lib/notifications'
import ModuleSection from '../components/ModuleSection'

const today = () => format(new Date(), 'yyyy-MM-dd')

function isTaskDueToday(task) {
  if (task.task_type === 'daily') return true
  if (task.task_type === 'scheduled') return task.next_due_date === today()
  return false
}

export default function Today() {
  const [modules, setModules] = useState([])
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const dateStr = today()

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [mods, allTasks, todayLogs] = await Promise.all([
        getModules(), getTasks(), getLogsForDate(dateStr),
      ])
      setModules(mods)
      setTasks(allTasks)
      setLogs(todayLogs)
      scheduleAllNotifications(allTasks.filter(isTaskDueToday))
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
    setLogs((prev) => upsertLocal(prev, task.id, dateStr, 'done'))
  }

  async function handleSkip(task) {
    await upsertLog(task.id, dateStr, 'skipped')
    setLogs((prev) => upsertLocal(prev, task.id, dateStr, 'skipped'))
  }

  async function handlePostpone(task, days) {
    const newDate = format(addDays(new Date(), Math.ceil(days)), 'yyyy-MM-dd')
    await postponeTask(task.id, newDate)
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
  }

  const dueTasks = tasks.filter(isTaskDueToday)
  const morningTasks = dueTasks.filter((t) => t.task_type === 'daily' && (t.slot === 'morning' || t.slot === 'both'))
  const nightTasks = dueTasks.filter((t) => t.task_type === 'daily' && (t.slot === 'night' || t.slot === 'both'))
  const scheduledTasks = dueTasks.filter((t) => t.task_type === 'scheduled')

  const totalDue = dueTasks.length
  const totalDone = logs.filter((l) => l.status === 'done' && dueTasks.find((t) => t.id === l.task_id)).length
  const pct = totalDue > 0 ? Math.round((totalDone / totalDue) * 100) : 0
  const allDone = totalDue > 0 && totalDone === totalDue

  const morningByModule = groupByModule(modules, morningTasks)
  const nightByModule = groupByModule(modules, nightTasks)
  const scheduledByModule = groupByModule(modules, scheduledTasks)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#30D158', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="px-6 pt-14 pb-2">
        {/* Header */}
        <p className="text-[13px] font-medium mb-1" style={{ color: '#636366' }}>
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5, color: '#000', lineHeight: 1.1 }}>
          {allDone ? 'All Done ✓' : 'Today'}
        </h1>

        {/* Progress */}
        {totalDue > 0 && (
          <div className="mt-4 mb-2">
            <div className="flex justify-between mb-1.5">
              <span className="section-label">{totalDone} of {totalDue} complete</span>
              <span className="text-[12px] font-semibold" style={{ color: '#30D158' }}>{pct}%</span>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 4, backgroundColor: '#e5e5ea' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: '#30D158' }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        {totalDue === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🌿</p>
            <p className="text-[17px] font-medium" style={{ color: '#636366' }}>No tasks for today</p>
            <p className="text-[14px] mt-1" style={{ color: '#c7c7cc' }}>Add some in Manage</p>
          </div>
        )}

        {morningByModule.length > 0 && (
          <section className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <span>🌅</span>
              <h2 className="text-[17px] font-semibold" style={{ color: '#000' }}>Morning</h2>
            </div>
            {morningByModule.map(({ module, tasks }) => (
              <ModuleSection key={module.id} module={module} tasks={tasks} logs={logs} onDone={handleDone} onSkip={handleSkip} onPostpone={handlePostpone} />
            ))}
          </section>
        )}

        {nightByModule.length > 0 && (
          <section className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <span>🌙</span>
              <h2 className="text-[17px] font-semibold" style={{ color: '#000' }}>Night</h2>
            </div>
            {nightByModule.map(({ module, tasks }) => (
              <ModuleSection key={module.id} module={module} tasks={tasks} logs={logs} onDone={handleDone} onSkip={handleSkip} onPostpone={handlePostpone} />
            ))}
          </section>
        )}

        {scheduledByModule.length > 0 && (
          <section className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <span>📅</span>
              <h2 className="text-[17px] font-semibold" style={{ color: '#000' }}>Scheduled</h2>
            </div>
            {scheduledByModule.map(({ module, tasks }) => (
              <ModuleSection key={module.id} module={module} tasks={tasks} logs={logs} onDone={handleDone} onSkip={handleSkip} onPostpone={handlePostpone} />
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

function groupByModule(modules, tasks) {
  return modules.map((mod) => ({
    module: mod,
    tasks: tasks.filter((t) => t.module_id === mod.id),
  })).filter((g) => g.tasks.length > 0)
}

function upsertLocal(prev, taskId, date, status) {
  const existing = prev.findIndex((l) => l.task_id === taskId)
  const entry = { task_id: taskId, date, status }
  if (existing >= 0) { const next = [...prev]; next[existing] = entry; return next }
  return [...prev, entry]
}

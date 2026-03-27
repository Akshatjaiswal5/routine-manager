import { useEffect, useState } from 'react'
import { getModules, createModule, updateModule, deleteModule, getTasks, createTask, updateTask, deleteTask } from '../lib/db'

const MODULE_ICONS = ['🧴', '💆', '🦷', '🛁', '💊', '🧘', '💪', '🌿', '✨', '🫧', '🪥', '🌙', '☀️', '💅', '🧖']
const MODULE_COLORS = ['#4ade80', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#34d399', '#fbbf24', '#f87171']

const DEFAULT_MODULES = [
  { name: 'Skincare', icon: '🧴', color: '#f472b6', sort_order: 0 },
  { name: 'Haircare', icon: '💆', color: '#a78bfa', sort_order: 1 },
  { name: 'Oral Care', icon: '🦷', color: '#60a5fa', sort_order: 2 },
  { name: 'Body', icon: '🛁', color: '#34d399', sort_order: 3 },
  { name: 'Medicines', icon: '💊', color: '#fb923c', sort_order: 4 },
  { name: 'Mind', icon: '🧘', color: '#4ade80', sort_order: 5 },
]

export default function Manage() {
  const [modules, setModules] = useState([])
  const [tasks, setTasks] = useState([])
  const [activeModule, setActiveModule] = useState(null)
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingModule, setEditingModule] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [mods, allTasks] = await Promise.all([getModules(), getTasks()])
    setModules(mods)
    setTasks(allTasks)
    setLoading(false)
  }

  async function handleSeedDefaults() {
    for (const mod of DEFAULT_MODULES) {
      await createModule(mod)
    }
    load()
  }

  async function handleSaveModule(data) {
    if (editingModule) {
      await updateModule(editingModule.id, data)
    } else {
      await createModule({ ...data, sort_order: modules.length })
    }
    setShowModuleForm(false)
    setEditingModule(null)
    load()
  }

  async function handleDeleteModule(mod) {
    if (!confirm(`Delete "${mod.name}" and all its tasks?`)) return
    await deleteModule(mod.id)
    if (activeModule?.id === mod.id) setActiveModule(null)
    load()
  }

  async function handleSaveTask(data) {
    if (editingTask) {
      await updateTask(editingTask.id, data)
    } else {
      const count = tasks.filter((t) => t.module_id === activeModule.id).length
      await createTask({ ...data, module_id: activeModule.id, sort_order: count })
    }
    setShowTaskForm(false)
    setEditingTask(null)
    load()
  }

  async function handleDeleteTask(task) {
    if (!confirm(`Delete "${task.name}"?`)) return
    await deleteTask(task.id)
    load()
  }

  const moduleTasks = activeModule ? tasks.filter((t) => t.module_id === activeModule.id) : []

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
        <h1 className="text-2xl font-bold text-slate-100 mb-6">Manage</h1>

        {/* Modules list */}
        {!activeModule && (
          <>
            {modules.length === 0 && (
              <div className="text-center py-8 mb-6">
                <p className="text-slate-400 mb-4">No modules yet.</p>
                <button onClick={handleSeedDefaults} className="text-green-400 text-sm bg-green-400/10 px-4 py-2 rounded-xl font-medium">
                  Add default modules
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2 mb-4">
              {modules.map((mod) => (
                <div key={mod.id} className="flex items-center gap-3 bg-slate-800 rounded-2xl px-4 py-3">
                  <button onClick={() => setActiveModule(mod)} className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl">{mod.icon}</span>
                    <span className="font-medium text-slate-100 truncate">{mod.name}</span>
                    <span className="text-xs text-slate-500 ml-auto">
                      {tasks.filter((t) => t.module_id === mod.id).length} tasks
                    </span>
                  </button>
                  <button onClick={() => { setEditingModule(mod); setShowModuleForm(true) }} className="text-slate-500 p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDeleteModule(mod)} className="text-red-400/60 p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setEditingModule(null); setShowModuleForm(true) }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-slate-700 text-slate-400 text-sm font-medium"
            >
              + Add Module
            </button>
          </>
        )}

        {/* Module detail — tasks */}
        {activeModule && !showTaskForm && (
          <>
            <button onClick={() => setActiveModule(null)} className="flex items-center gap-1 text-slate-400 text-sm mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">{activeModule.icon}</span>
              <h2 className="text-lg font-semibold text-slate-100">{activeModule.name}</h2>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              {moduleTasks.map((task) => (
                <div key={task.id} className="bg-slate-800 rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-100">{task.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {task.task_type === 'daily'
                          ? `Daily · ${task.slot}`
                          : `Every ${task.interval_days} days${task.next_due_date ? ` · next: ${task.next_due_date}` : ''}`}
                        {task.deadline_time ? ` · by ${formatTime(task.deadline_time)}` : ''}
                        {task.is_reschedulable ? ' · reschedulable' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { setEditingTask(task); setShowTaskForm(true) }}
                        className="text-slate-500 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDeleteTask(task)} className="text-red-400/60 p-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setEditingTask(null); setShowTaskForm(true) }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-slate-700 text-slate-400 text-sm font-medium"
            >
              + Add Task
            </button>
          </>
        )}

        {/* Module form */}
        {showModuleForm && (
          <ModuleForm
            initial={editingModule}
            onSave={handleSaveModule}
            onCancel={() => { setShowModuleForm(false); setEditingModule(null) }}
          />
        )}

        {/* Task form */}
        {showTaskForm && activeModule && (
          <TaskForm
            initial={editingTask}
            onSave={handleSaveTask}
            onCancel={() => { setShowTaskForm(false); setEditingTask(null) }}
            onBack={() => { setShowTaskForm(false); setEditingTask(null) }}
          />
        )}
      </div>
    </div>
  )
}

function ModuleForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [icon, setIcon] = useState(initial?.icon || MODULE_ICONS[0])
  const [color, setColor] = useState(initial?.color || MODULE_COLORS[0])

  return (
    <div>
      <button onClick={onCancel} className="flex items-center gap-1 text-slate-400 text-sm mb-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <h2 className="text-lg font-semibold text-slate-100 mb-5">{initial ? 'Edit Module' : 'New Module'}</h2>

      <label className="block mb-4">
        <span className="text-xs text-slate-400 uppercase tracking-wide">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full bg-slate-800 rounded-xl px-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-green-400"
          placeholder="e.g. Skincare"
        />
      </label>

      <label className="block mb-4">
        <span className="text-xs text-slate-400 uppercase tracking-wide">Icon</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {MODULE_ICONS.map((ic) => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center ${icon === ic ? 'bg-green-400/20 ring-2 ring-green-400' : 'bg-slate-800'}`}
            >
              {ic}
            </button>
          ))}
        </div>
      </label>

      <label className="block mb-6">
        <span className="text-xs text-slate-400 uppercase tracking-wide">Color</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {MODULE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </label>

      <button
        onClick={() => onSave({ name, icon, color })}
        disabled={!name.trim()}
        className="w-full py-3 bg-green-400 text-slate-900 font-semibold rounded-2xl disabled:opacity-40"
      >
        Save Module
      </button>
    </div>
  )
}

function TaskForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [taskType, setTaskType] = useState(initial?.task_type || 'daily')
  const [slot, setSlot] = useState(initial?.slot || 'morning')
  const [intervalDays, setIntervalDays] = useState(initial?.interval_days || 3)
  const [nextDueDate, setNextDueDate] = useState(initial?.next_due_date || format(new Date(), 'yyyy-MM-dd'))
  const [deadlineTime, setDeadlineTime] = useState(initial?.deadline_time || '')
  const [isReschedulable, setIsReschedulable] = useState(initial?.is_reschedulable || false)

  function format(date, fmt) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return (
    <div>
      <button onClick={onCancel} className="flex items-center gap-1 text-slate-400 text-sm mb-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <h2 className="text-lg font-semibold text-slate-100 mb-5">{initial ? 'Edit Task' : 'New Task'}</h2>

      <label className="block mb-4">
        <span className="text-xs text-slate-400 uppercase tracking-wide">Task Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full bg-slate-800 rounded-xl px-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-green-400"
          placeholder="e.g. Apply moisturizer"
        />
      </label>

      <label className="block mb-4">
        <span className="text-xs text-slate-400 uppercase tracking-wide">Type</span>
        <div className="mt-2 flex gap-2">
          {['daily', 'scheduled'].map((t) => (
            <button
              key={t}
              onClick={() => setTaskType(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize ${
                taskType === t ? 'bg-green-400 text-slate-900' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </label>

      {taskType === 'daily' && (
        <label className="block mb-4">
          <span className="text-xs text-slate-400 uppercase tracking-wide">Time Slot</span>
          <div className="mt-2 flex gap-2">
            {['morning', 'night', 'both'].map((s) => (
              <button
                key={s}
                onClick={() => setSlot(s)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize ${
                  slot === s ? 'bg-green-400 text-slate-900' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </label>
      )}

      {taskType === 'scheduled' && (
        <>
          <label className="block mb-4">
            <span className="text-xs text-slate-400 uppercase tracking-wide">Repeat every (days)</span>
            <input
              type="number"
              min="1"
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
              className="mt-1 w-full bg-slate-800 rounded-xl px-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-green-400"
            />
          </label>

          <label className="block mb-4">
            <span className="text-xs text-slate-400 uppercase tracking-wide">First due date</span>
            <input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="mt-1 w-full bg-slate-800 rounded-xl px-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-green-400"
            />
          </label>

          <label className="flex items-center gap-3 mb-4 cursor-pointer">
            <div
              onClick={() => setIsReschedulable(!isReschedulable)}
              className={`w-11 h-6 rounded-full transition-colors ${isReschedulable ? 'bg-green-400' : 'bg-slate-700'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white m-0.5 transition-transform ${isReschedulable ? 'translate-x-5' : ''}`} />
            </div>
            <span className="text-slate-300 text-sm">Reschedulable (can postpone)</span>
          </label>
        </>
      )}

      <label className="block mb-6">
        <span className="text-xs text-slate-400 uppercase tracking-wide">Deadline time (optional)</span>
        <input
          type="time"
          value={deadlineTime}
          onChange={(e) => setDeadlineTime(e.target.value)}
          className="mt-1 w-full bg-slate-800 rounded-xl px-4 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-green-400"
        />
      </label>

      <button
        onClick={() =>
          onSave({
            name,
            task_type: taskType,
            slot: taskType === 'daily' ? slot : null,
            interval_days: taskType === 'scheduled' ? intervalDays : null,
            next_due_date: taskType === 'scheduled' ? nextDueDate : null,
            deadline_time: deadlineTime || null,
            is_reschedulable: taskType === 'scheduled' ? isReschedulable : false,
          })
        }
        disabled={!name.trim()}
        className="w-full py-3 bg-green-400 text-slate-900 font-semibold rounded-2xl disabled:opacity-40"
      >
        Save Task
      </button>
    </div>
  )
}

function formatTime(time) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

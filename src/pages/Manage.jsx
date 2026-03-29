import { useEffect, useState } from 'react'
import { getModules, createModule, updateModule, deleteModule, getTasks, createTask, updateTask, deleteTask } from '../lib/db'

const MODULE_ICONS = ['🧴','💆','🦷','🛁','💊','🧘','💪','🌿','✨','🫧','🪥','🌙','☀️','💅','🧖']
const MODULE_COLORS = ['#22c55e','#3b82f6','#ec4899','#f97316','#a855f7','#10b981','#f59e0b','#ef4444']
const DEFAULT_MODULES = [
  { name: 'Skincare', icon: '🧴', color: '#ec4899', sort_order: 0 },
  { name: 'Haircare', icon: '💆', color: '#a855f7', sort_order: 1 },
  { name: 'Oral Care', icon: '🦷', color: '#3b82f6', sort_order: 2 },
  { name: 'Body', icon: '🛁', color: '#10b981', sort_order: 3 },
  { name: 'Medicines', icon: '💊', color: '#f97316', sort_order: 4 },
  { name: 'Mind', icon: '🧘', color: '#22c55e', sort_order: 5 },
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

  useEffect(() => { load() }, [])

  async function load() {
    const [mods, allTasks] = await Promise.all([getModules(), getTasks()])
    setModules(mods); setTasks(allTasks); setLoading(false)
  }

  async function handleSeedDefaults() {
    for (const mod of DEFAULT_MODULES) await createModule(mod)
    load()
  }

  async function handleSaveModule(data) {
    if (editingModule) await updateModule(editingModule.id, data)
    else await createModule({ ...data, sort_order: modules.length })
    setShowModuleForm(false); setEditingModule(null); load()
  }

  async function handleDeleteModule(mod) {
    if (!confirm(`Delete "${mod.name}" and all its tasks?`)) return
    await deleteModule(mod.id)
    if (activeModule?.id === mod.id) setActiveModule(null)
    load()
  }

  async function handleSaveTask(data) {
    if (editingTask) await updateTask(editingTask.id, data)
    else await createTask({ ...data, module_id: activeModule.id, sort_order: tasks.filter((t) => t.module_id === activeModule.id).length })
    setShowTaskForm(false); setEditingTask(null); load()
  }

  async function handleDeleteTask(task) {
    if (!confirm(`Delete "${task.name}"?`)) return
    await deleteTask(task.id); load()
  }

  const moduleTasks = activeModule ? tasks.filter((t) => t.module_id === activeModule.id) : []

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#30D158', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="page-content">
      <div className="px-6 pt-14 pb-4">
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5, color: '#000', marginBottom: 20 }}>Manage</h1>

        {!activeModule && !showModuleForm && (
          <>
            {modules.length === 0 && (
              <div className="text-center py-10 mb-4">
                <p className="text-[15px] mb-4" style={{ color: '#636366' }}>No modules yet.</p>
                <button onClick={handleSeedDefaults} className="text-[15px] font-semibold px-5 py-2.5 rounded-xl" style={{ backgroundColor: '#30D158', color: '#ffffff' }}>
                  Add default modules
                </button>
              </div>
            )}

            {modules.length > 0 && (
              <div className="card overflow-hidden mb-4">
                {modules.map((mod, i) => (
                  <div key={mod.id} className="flex items-center gap-3 px-4 py-3" style={i > 0 ? { borderTop: '1px solid #f2f2f7' } : {}}>
                    <button onClick={() => setActiveModule(mod)} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: mod.color + '20' }}>
                        {mod.icon}
                      </div>
                      <span className="text-[15px] font-medium truncate" style={{ color: '#000' }}>{mod.name}</span>
                      <span className="text-[13px] ml-auto mr-1 shrink-0" style={{ color: '#c7c7cc' }}>
                        {tasks.filter((t) => t.module_id === mod.id).length}
                      </span>
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: '#c7c7cc' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button onClick={() => { setEditingModule(mod); setShowModuleForm(true) }} className="p-1.5" style={{ color: '#c7c7cc' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDeleteModule(mod)} className="p-1.5" style={{ color: '#ff3b30' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => { setEditingModule(null); setShowModuleForm(true) }}
              className="w-full py-3.5 rounded-xl text-[15px] font-semibold"
              style={{ backgroundColor: '#e5f1ff', color: '#007aff' }}
            >
              + New Module
            </button>
          </>
        )}

        {activeModule && !showTaskForm && (
          <>
            <BackButton onClick={() => setActiveModule(null)} />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: activeModule.color + '20' }}>
                {activeModule.icon}
              </div>
              <h2 className="text-[22px] font-bold" style={{ color: '#000' }}>{activeModule.name}</h2>
            </div>

            {moduleTasks.length > 0 && (
              <div className="card overflow-hidden mb-4">
                {moduleTasks.map((task, i) => (
                  <div key={task.id} className="flex items-center justify-between px-4 py-3" style={i > 0 ? { borderTop: '1px solid #f2f2f7' } : {}}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium" style={{ color: '#000' }}>{task.name}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: '#636366' }}>
                        {task.task_type === 'daily' ? `Daily · ${task.slot}` : `Every ${task.interval_days}d`}
                        {task.deadline_time ? ` · by ${formatTime(task.deadline_time)}` : ''}
                        {task.is_reschedulable ? ' · reschedulable' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setEditingTask(task); setShowTaskForm(true) }} className="p-1.5" style={{ color: '#c7c7cc' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDeleteTask(task)} className="p-1.5" style={{ color: '#ff3b30' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => { setEditingTask(null); setShowTaskForm(true) }}
              className="w-full py-3.5 rounded-xl text-[15px] font-semibold"
              style={{ backgroundColor: '#e5f1ff', color: '#007aff' }}
            >
              + New Task
            </button>
          </>
        )}

        {showModuleForm && (
          <ModuleForm initial={editingModule} onSave={handleSaveModule} onCancel={() => { setShowModuleForm(false); setEditingModule(null) }} />
        )}
        {showTaskForm && activeModule && (
          <TaskForm initial={editingTask} onSave={handleSaveTask} onCancel={() => { setShowTaskForm(false); setEditingTask(null) }} />
        )}
      </div>
    </div>
  )
}

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 mb-4 -mt-1 text-[15px] font-medium" style={{ color: '#007aff' }}>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  )
}

function Field({ label, children }) {
  return (
    <div className="mb-5">
      <p className="section-label mb-2">{label}</p>
      {children}
    </div>
  )
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#e5e5ea' }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="flex-1 py-2 rounded-lg text-[13px] font-semibold capitalize transition-all"
          style={value === opt ? { backgroundColor: '#30D158', color: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' } : { color: '#636366' }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function Input({ type = 'text', value, onChange, placeholder, min }) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder} min={min}
      className="w-full rounded-xl px-4 py-3 text-[16px] outline-none transition-colors"
      style={{ backgroundColor: '#f2f2f7', color: '#000' }}
      onFocus={(e) => e.target.style.backgroundColor = '#e5e5ea'}
      onBlur={(e) => e.target.style.backgroundColor = '#f2f2f7'}
    />
  )
}

function ModuleForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [icon, setIcon] = useState(initial?.icon || MODULE_ICONS[0])
  const [color, setColor] = useState(initial?.color || MODULE_COLORS[0])

  return (
    <div>
      <BackButton onClick={onCancel} />
      <h2 className="text-[22px] font-bold mb-5" style={{ color: '#000' }}>{initial ? 'Edit Module' : 'New Module'}</h2>

      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Skincare" />
      </Field>

      <Field label="Icon">
        <div className="flex flex-wrap gap-2">
          {MODULE_ICONS.map((ic) => (
            <button key={ic} onClick={() => setIcon(ic)}
              className="w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all"
              style={icon === ic ? { backgroundColor: '#E8F8ED', outline: '2px solid #30D158' } : { backgroundColor: '#f2f2f7' }}
            >{ic}</button>
          ))}
        </div>
      </Field>

      <Field label="Color">
        <div className="flex flex-wrap gap-3">
          {MODULE_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              className="w-9 h-9 rounded-full transition-all"
              style={{ backgroundColor: c, outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }}
            />
          ))}
        </div>
      </Field>

      <button onClick={() => onSave({ name, icon, color })} disabled={!name.trim()}
        className="w-full py-3.5 rounded-xl text-[15px] font-semibold mt-2 disabled:opacity-40"
        style={{ backgroundColor: '#30D158', color: '#ffffff' }}
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
  const [nextDueDate, setNextDueDate] = useState(initial?.next_due_date || fmtDate(new Date()))
  const [deadlineTime, setDeadlineTime] = useState(initial?.deadline_time || '')
  const [isReschedulable, setIsReschedulable] = useState(initial?.is_reschedulable || false)

  function fmtDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  return (
    <div>
      <BackButton onClick={onCancel} />
      <h2 className="text-[22px] font-bold mb-5" style={{ color: '#000' }}>{initial ? 'Edit Task' : 'New Task'}</h2>

      <Field label="Task Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apply moisturizer" />
      </Field>

      <Field label="Type">
        <SegmentedControl options={['daily', 'scheduled']} value={taskType} onChange={setTaskType} />
      </Field>

      {taskType === 'daily' && (
        <Field label="Time Slot">
          <SegmentedControl options={['morning', 'night', 'both']} value={slot} onChange={setSlot} />
        </Field>
      )}

      {taskType === 'scheduled' && (
        <>
          <Field label="Repeat every (days)">
            <Input type="number" min="1" value={intervalDays} onChange={(e) => setIntervalDays(Number(e.target.value))} />
          </Field>
          <Field label="First due date">
            <Input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
          </Field>
          <div className="flex items-center justify-between card px-4 py-3.5 mb-5 cursor-pointer" onClick={() => setIsReschedulable(!isReschedulable)}>
            <span className="text-[15px] font-medium" style={{ color: '#000' }}>Reschedulable</span>
            <div className="w-12 h-7 rounded-full relative transition-colors shrink-0" style={{ backgroundColor: isReschedulable ? '#30D158' : '#e5e5ea' }}>
              <div className={`w-6 h-6 rounded-full bg-white shadow absolute top-0.5 transition-transform ${isReschedulable ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </div>
        </>
      )}

      <Field label="Deadline time (optional)">
        <Input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} />
      </Field>

      <button
        onClick={() => onSave({ name, task_type: taskType, slot: taskType==='daily'?slot:null, interval_days: taskType==='scheduled'?intervalDays:null, next_due_date: taskType==='scheduled'?nextDueDate:null, deadline_time: deadlineTime||null, is_reschedulable: taskType==='scheduled'?isReschedulable:false })}
        disabled={!name.trim()}
        className="w-full py-3.5 rounded-xl text-[15px] font-semibold mt-2 disabled:opacity-40"
        style={{ backgroundColor: '#30D158', color: '#ffffff' }}
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

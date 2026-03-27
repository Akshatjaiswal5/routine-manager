import TaskCard from './TaskCard'

export default function ModuleSection({ module, tasks, logs, onDone, onSkip, onPostpone }) {
  if (!tasks.length) return null

  const logsMap = Object.fromEntries(logs.map((l) => [l.task_id, l]))
  const doneCount = tasks.filter((t) => logsMap[t.id]?.status === 'done').length

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-lg">{module.icon}</span>
        <h2 className="font-semibold text-slate-200 text-sm tracking-wide uppercase">
          {module.name}
        </h2>
        <span className="ml-auto text-xs text-slate-500">
          {doneCount}/{tasks.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            log={logsMap[task.id]}
            onDone={onDone}
            onSkip={onSkip}
            onPostpone={onPostpone}
          />
        ))}
      </div>
    </div>
  )
}

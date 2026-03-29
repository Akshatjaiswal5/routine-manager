import { useState } from 'react'

export default function TaskCard({ task, log, onDone, onSkip, onPostpone }) {
  const [showPostpone, setShowPostpone] = useState(false)
  const status = log?.status || 'pending'

  return (
    <div style={{ opacity: status !== 'pending' ? 0.5 : 1, transition: 'opacity 0.15s' }}>
      <div className="flex items-center gap-3 px-4 py-[14px]">
        {/* Checkbox */}
        <button
          onClick={() => status === 'pending' && onDone(task)}
          className="shrink-0 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all"
          style={
            status === 'done'
              ? { backgroundColor: '#30D158', borderColor: '#30D158' }
              : { borderColor: '#c6c6c8' }
          }
        >
          {status === 'done' && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === 'skipped' && (
            <svg className="w-3 h-3 text-[#c6c6c8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium leading-snug" style={{ color: status === 'done' ? '#c7c7cc' : '#000000', textDecoration: status === 'done' ? 'line-through' : 'none' }}>
            {task.name}
          </p>
          {task.deadline_time && status === 'pending' && (
            <p className="text-[12px] mt-0.5" style={{ color: '#636366' }}>by {formatTime(task.deadline_time)}</p>
          )}
          {status === 'postponed' && (
            <p className="text-[12px] mt-0.5" style={{ color: '#ff9500' }}>postponed</p>
          )}
        </div>

        {status === 'pending' && (
          <div className="flex items-center gap-1.5 shrink-0">
            {task.is_reschedulable && (
              <button
                onClick={() => setShowPostpone(!showPostpone)}
                className="text-[13px] font-semibold px-3 py-1.5 rounded-lg"
                style={{ color: '#ff9500', backgroundColor: '#fff3e0' }}
              >
                Later
              </button>
            )}
            <button
              onClick={() => onSkip(task)}
              className="text-[13px] font-semibold px-3 py-1.5 rounded-lg"
              style={{ color: '#636366', backgroundColor: '#f2f2f7' }}
            >
              Skip
            </button>
            <button
              onClick={() => onDone(task)}
              className="text-[13px] font-semibold px-3 py-1.5 rounded-lg"
              style={{ color: '#166534', backgroundColor: '#E8F8ED' }}
            >
              Done
            </button>
          </div>
        )}
      </div>

      {showPostpone && (
        <div className="px-4 pb-3 border-t" style={{ borderColor: '#f2f2f7' }}>
          <p className="section-label mt-3 mb-2">Postpone by</p>
          <div className="flex gap-2 flex-wrap">
            {[{ label: '12 hrs', days: 0.5 }, { label: '1 day', days: 1 }, { label: '2 days', days: 2 }, { label: '3 days', days: 3 }].map((opt) => (
              <button
                key={opt.days}
                onClick={() => { setShowPostpone(false); onPostpone(task, opt.days) }}
                className="text-[13px] font-semibold px-3 py-1.5 rounded-lg"
                style={{ color: '#000', backgroundColor: '#f2f2f7' }}
              >
                {opt.label}
              </button>
            ))}
            <button onClick={() => setShowPostpone(false)} className="text-[13px] px-2 py-1.5" style={{ color: '#636366' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function formatTime(time) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

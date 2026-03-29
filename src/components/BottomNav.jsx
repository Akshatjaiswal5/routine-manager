import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Today', emoji: '✅' },
  { to: '/calendar', label: 'Calendar', emoji: '🗓️' },
  { to: '/manage', label: 'Manage', emoji: '⚙️' },
]

export default function BottomNav() {
  return (
    <nav
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        flexShrink: 0,
      }}
    >
      <div className="flex justify-around items-center" style={{ height: 56 }}>
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-[3px] px-6 transition-all ${isActive ? 'opacity-100' : 'opacity-40'}`
            }
          >
            <span style={{ fontSize: 22 }}>{tab.emoji}</span>
            <span className="text-[10px] font-semibold" style={{ color: '#000' }}>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

import type { PublicUser } from "../../lib/auth-db";
import type { View } from "./types";
import { Icon, icons } from "./icons";

const NAV_ITEMS: { view: View; label: string; icon: string }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
  { view: 'events', label: 'My Events', icon: icons.events },
  { view: 'create-event', label: 'Create Event', icon: icons.create },
  { view: 'guests', label: 'Guest List', icon: icons.guests },
  { view: 'send', label: 'Send Invites', icon: icons.send },
  { view: 'qr-verify', label: 'QR Verify', icon: icons.qr },
  { view: 'wallet', label: 'Wallet', icon: icons.wallet },
  { view: 'contributions', label: 'Contributions', icon: icons.contributions },
]

const BOTTOM_NAV: { view: View; label: string; icon: string }[] = [
  { view: 'dashboard', label: 'Home', icon: icons.dashboard },
  { view: 'events', label: 'Events', icon: icons.events },
  { view: 'guests', label: 'Guests', icon: icons.guests },
  { view: 'qr-verify', label: 'Scan', icon: icons.qr },
  { view: 'wallet', label: 'Wallet', icon: icons.wallet },
]

export function BottomNav({ active, setView }: { active: View; setView: (v: View) => void }) {
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 62, background: 'var(--card)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'stretch', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {BOTTOM_NAV.map(item => {
        const isActive = active === item.view
        return (
          <button key={item.view} onClick={() => setView(item.view)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: isActive ? 'var(--accent)' : 'var(--muted-foreground)', fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: isActive ? 600 : 400, transition: 'color 0.15s', paddingTop: 6 }}>
            <Icon d={item.icon} size={20} stroke={isActive ? 'var(--accent)' : 'var(--muted-foreground)'} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

export function Sidebar({ active, setView, user }: { active: View; setView: (v: View) => void; user: PublicUser }) {
  const initials = user.name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/auth'
  }

  return (
    <aside style={{ width: 220, flexShrink: 0, background: 'var(--card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)', opacity: 0.8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), #7c5cbf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✉️</div>
          <div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 15, color: 'var(--foreground)', lineHeight: 1.1 }}>InviteCard</div>
            <div style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.view
          return (
            <button key={item.view} onClick={() => setView(item.view)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', background: isActive ? 'rgba(229, 193, 88, 0.1)' : 'transparent', color: isActive ? 'var(--accent)' : 'var(--muted-foreground)', fontSize: 13, fontWeight: isActive ? 600 : 400, fontFamily: 'Outfit, sans-serif', textAlign: 'left', transition: 'all 0.15s', borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent' }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
              <Icon d={item.icon} size={16} stroke={isActive ? 'var(--accent)' : 'var(--muted-foreground)'} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Bottom: User */}
      <div style={{ padding: '14px 14px 18px', borderTop: '1px solid var(--border)', opacity: 0.8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 9 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #b84c6e, #7c5cbf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials || 'U'}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Event Host</div>
          </div>
        </div>
        <button className="btn-outline" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 12, marginTop: 8 }} onClick={logout}>
          Sign Out
        </button>
      </div>
    </aside>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header({ view, user }: { view: View; user: PublicUser }) {
  const labels: Record<View, string> = {
    dashboard: 'Overview',
    events: 'My Events',
    'create-event': 'Create Event',
    guests: 'Guest List',
    send: 'Send Invites',
    'qr-verify': 'QR Verification',
    wallet: 'Wallet',
    contributions: 'Contributions',
  }

  return (
    <header style={{ height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: '1px solid var(--border)', background: 'rgba(15, 18, 32, 0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
      <span style={{ fontSize: 14, color: 'var(--muted-foreground)', fontWeight: 500 }}>{labels[view]}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', position: 'relative', padding: 4 }}>
          <Icon d={icons.bell} size={18} stroke="var(--muted-foreground)" />
          <span style={{ position: 'absolute', top: 2, right: 2, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', border: '1.5px solid var(--background)' }} />
        </button>
        <div style={{ height: 22, width: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{user.email}</span>
      </div>
    </header>
  )
}

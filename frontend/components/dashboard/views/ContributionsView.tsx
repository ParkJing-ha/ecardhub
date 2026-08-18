import { Icon, icons } from "../icons";
import { useIsMobile } from "../hooks";
import { SectionHeader, StatCard } from "../ui";
import { contributions } from "../data";

export function ContributionsView() {
  const isMobile = useIsMobile()
  const total = contributions.reduce((s, c) => s + c.amount, 0)
  const target = 500000

  return (
    <div>
      <SectionHeader title="Contribution Management" action={
        <button className="btn-gold" style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14 }}>
          Send Reminder
        </button>
      } />

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Received" value={`TZS ${(total / 1000).toFixed(0)}K`} sub={`${contributions.length} contributions`} />
        <StatCard label="Target Amount" value={`TZS ${(target / 1000).toFixed(0)}K`} sub="Set by event host" accent="#8b82a0" />
        <StatCard label="Progress" value={`${Math.round((total / target) * 100)}%`} sub="of target reached" accent="#22c55e" />
      </div>

      {/* Progress bar */}
      <div className="card-base p-5" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: '#f0ece8', fontWeight: 600 }}>Contribution Progress</span>
          <span style={{ color: '#c9a84c', fontWeight: 600 }}>TZS {total.toLocaleString()} / {target.toLocaleString()}</span>
        </div>
        <div style={{ height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min((total / target) * 100, 100)}%`, background: 'linear-gradient(90deg,#c9a84c,#e8c96a)', borderRadius: 6, transition: 'width 0.8s ease' }} />
        </div>
      </div>

      {/* Contributions table */}
      <div className="card-base" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(201,168,76,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, margin: 0, color: '#f0ece8' }}>Individual Contributions</h3>
          <button className="btn-outline" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon d={icons.download} size={14} stroke="#c9a84c" />
            Export
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
              {['Guest Name', 'Amount', 'Date', 'Method', 'Note'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#4d4768', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contributions.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: '14px 20px', color: '#f0ece8', fontWeight: 500 }}>{c.guestName}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 16, color: '#c9a84c' }}>TZS {c.amount.toLocaleString()}</span>
                </td>
                <td style={{ padding: '14px 20px', color: '#8b82a0' }}>{c.date}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: '#8b82a0' }}>{c.method}</span>
                </td>
                <td style={{ padding: '14px 20px', color: '#8b82a0', fontStyle: c.note ? 'italic' : 'normal' }}>{c.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

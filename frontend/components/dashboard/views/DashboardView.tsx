import type { Event, Guest, View } from "../types";
import { Icon, icons } from "../icons";
import { useIsMobile } from "../hooks";
import { Badge, SectionHeader, StatCard } from "../ui";
import { categoryEmoji, categoryGradient } from "../category";

export function DashboardView({ events, guests, setView }: { events: Event[]; guests: Guest[]; setView: (v: View) => void }) {
  const isMobile = useIsMobile()
  const totalSent = events.reduce((s, e) => s + e.sentCount, 0)
  const totalRSVP = events.reduce((s, e) => s + e.rsvpCount, 0)
  const checkedIn = guests.filter(g => g.checkedIn).length

  const styles = `
    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInGold {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes shimmer {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .dashboard-card {
      animation: slideInUp 0.6s ease-out forwards;
      background: linear-gradient(135deg, rgba(229, 193, 88, 0.08) 0%, rgba(229, 193, 88, 0.02) 100%);
      border: 1px solid rgba(229, 193, 88, 0.12);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;
    }
    .dashboard-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(229, 193, 88, 0.1), transparent);
      transition: left 0.5s;
    }
    .dashboard-card:hover::before {
      left: 100%;
    }
    .dashboard-card:hover {
      border-color: rgba(229, 193, 88, 0.24);
      box-shadow: 0 8px 24px rgba(229, 193, 88, 0.1);
      transform: translateY(-2px);
    }
    .stat-value {
      animation: fadeInGold 1s ease-out;
      background: linear-gradient(135deg, #e5c158 0%, #d4a15f 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  `

  return (
    <div>
      <style>{styles}</style>
      <SectionHeader
        title="Dashboard"
        action={
          <button className="btn-gold" style={{ padding: '9px 16px', borderRadius: 8, fontSize: 13, backgroundImage: 'linear-gradient(135deg, #e5c158, #d4a15f)', boxShadow: '0 4px 16px rgba(229, 193, 88, 0.2)', transition: 'all 0.3s', cursor: 'pointer' }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(229, 193, 88, 0.35)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(229, 193, 88, 0.2)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }} onClick={() => setView('create-event')}>
            + Create Event
          </button>
        }
      />

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Events', value: events.length, sub: '2 active', color: '#e5c158', delay: '0s' },
          { label: 'Sent', value: totalSent.toLocaleString(), sub: 'invitations', color: '#60a5fa', delay: '0.1s' },
          { label: 'RSVPs', value: totalRSVP, sub: `${Math.round((totalRSVP / Math.max(totalSent, 1)) * 100)}% rate`, color: '#22c55e', delay: '0.2s' },
          { label: 'Checked In', value: checkedIn, sub: `of ${guests.length}`, color: '#e5c158', delay: '0.3s' },
        ].map((stat, i) => (
          <div key={i} className="dashboard-card card-base p-5" style={{ animationDelay: stat.delay }}>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              {stat.label}
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: stat.color, opacity: 0.6 }} />
            </div>
            <div className="stat-value" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, marginBottom: 4 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Wallet balance — mobile prominent */}
      {isMobile && (
        <div className="dashboard-card card-base p-5" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', animationDelay: '0.4s' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              Wallet
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#e5c158' }} />
            </div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, background: 'linear-gradient(135deg, #e5c158, #d4a15f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TZS 15,400</div>
          </div>
          <button className="btn-gold" style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, backgroundImage: 'linear-gradient(135deg, #e5c158, #d4a15f)', boxShadow: '0 4px 12px rgba(229, 193, 88, 0.2)', cursor: 'pointer' }} onClick={() => setView('wallet')}>
            Top Up
          </button>
        </div>
      )}

      {/* Quick actions — mobile horizontal scroll */}
      {isMobile && (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
          {[
            { label: 'Guests', icon: icons.guests, view: 'guests' as View },
            { label: 'Send', icon: icons.send, view: 'send' as View },
            { label: 'QR Scan', icon: icons.qr, view: 'qr-verify' as View },
            { label: 'Wallet', icon: icons.wallet, view: 'wallet' as View },
          ].map(q => (
            <button key={q.label} onClick={() => setView(q.view)} style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 18px', borderRadius: 10, border: '1px solid rgba(229, 193, 88, 0.2)', background: 'var(--card)', color: '#e5c158', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
              <Icon d={q.icon} size={20} stroke="#e5c158" />
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* Events + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 20, animationDelay: '0.5s' }}>
        {/* Recent Events */}
        <div className="dashboard-card card-base p-5">
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, margin: '0 0 16px', background: 'linear-gradient(135deg, #e5c158, #d4a15f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Recent Events</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.map((ev, idx) => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'linear-gradient(135deg, rgba(229, 193, 88, 0.06) 0%, rgba(229, 193, 88, 0.02) 100%)', borderRadius: 10, border: 'rgba(229, 193, 88, 0.12)', transition: 'all 0.3s', animation: `slideInUp 0.6s ease-out ${0.6 + idx * 0.1}s backwards`, cursor: 'pointer' }} 
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(229, 193, 88, 0.24)'; (e.currentTarget as HTMLDivElement).style.background = 'linear-gradient(135deg, rgba(229, 193, 88, 0.1) 0%, rgba(229, 193, 88, 0.05) 100%)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(229, 193, 88, 0.12)'; (e.currentTarget as HTMLDivElement).style.background = 'linear-gradient(135deg, rgba(229, 193, 88, 0.06) 0%, rgba(229, 193, 88, 0.02) 100%)'; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: categoryGradient(ev.category), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${categoryGradient(ev.category)}40` }}>
                  <span style={{ fontSize: 18 }}>{categoryEmoji(ev.category)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{ev.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e5c158' }}>{ev.rsvpCount}/{ev.guestCount}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>RSVPs</div>
                  </div>
                  {!isMobile && <Badge status={ev.status} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions + Wallet Balance — desktop only */}
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="dashboard-card card-base p-5" style={{ animationDelay: '0.6s' }}>
              <div style={{ textAlign: 'center', paddingBottom: 12, borderBottom: 'rgba(229, 193, 88, 0.12)' }}>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Wallet Balance</div>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 36, background: 'linear-gradient(135deg, #e5c158, #d4a15f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TZS 15,400</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>≈ 154 WhatsApp cards</div>
              </div>
              <button className="btn-gold" style={{ marginTop: 14, padding: '10px', borderRadius: 8, fontSize: 14, width: '100%', backgroundImage: 'linear-gradient(135deg, #e5c158, #d4a15f)', boxShadow: '0 4px 12px rgba(229, 193, 88, 0.2)', cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(229, 193, 88, 0.35)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(229, 193, 88, 0.2)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }} onClick={() => setView('wallet')}>
                Top Up Wallet
              </button>
            </div>

            <div className="dashboard-card card-base p-5" style={{ animationDelay: '0.7s' }}>
              <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 16, margin: '0 0 14px', background: 'linear-gradient(135deg, #e5c158, #d4a15f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Quick Actions</h3>
              {[
                { label: 'Add Guests', icon: icons.guests, view: 'guests' as View },
                { label: 'Send Invites', icon: icons.send, view: 'send' as View },
                { label: 'QR Verification', icon: icons.qr, view: 'qr-verify' as View },
                { label: 'Contributions', icon: icons.contributions, view: 'contributions' as View },
              ].map((q, idx) => (
                <button key={q.label} onClick={() => setView(q.view)} className="btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, marginBottom: 8, fontSize: 14, textAlign: 'left', background: 'linear-gradient(135deg, rgba(229, 193, 88, 0.04) 0%, rgba(229, 193, 88, 0.01) 100%)', border: 'rgba(229, 193, 88, 0.12)', transition: 'all 0.3s', cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(229, 193, 88, 0.08) 0%, rgba(229, 193, 88, 0.04) 100%)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(229, 193, 88, 0.24)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(229, 193, 88, 0.04) 0%, rgba(229, 193, 88, 0.01) 100%)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(229, 193, 88, 0.12)'; }}
                >
                  <Icon d={q.icon} size={16} stroke="#e5c158" />
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RSVP Progress */}
      <div className="dashboard-card card-base p-5" style={{ marginTop: 20, animationDelay: '0.8s' }}>
        <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, margin: '0 0 16px', background: 'linear-gradient(135deg, #e5c158, #d4a15f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RSVP Progress</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {events.map(ev => {
            const pct = ev.sentCount ? Math.round((ev.rsvpCount / ev.sentCount) * 100) : 0
            return (
              <div key={ev.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{ev.title}</span>
                  <span style={{ fontSize: 13, background: 'linear-gradient(135deg, #e5c158, #d4a15f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 600 }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #e5c158, rgba(229, 193, 88, 0.7))', borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 0 12px rgba(229, 193, 88, 0.4)' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

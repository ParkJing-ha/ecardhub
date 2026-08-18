import { useState } from "react";
import type { Event, View } from "../types";
import { Icon, icons } from "../icons";
import { useIsMobile } from "../hooks";
import { Badge, SectionHeader } from "../ui";
import { categoryEmoji, categoryGradient } from "../category";

export function EventsView({ events, setView }: { events: Event[]; setView: (v: View) => void }) {
  const isMobile = useIsMobile()
  const [filter, setFilter] = useState<'All' | 'Active' | 'Draft' | 'Completed'>('All')
  const filtered = filter === 'All' ? events : events.filter(e => e.status === filter)

  return (
    <div>
      <SectionHeader
        title="My Events"
        action={
          <button className="btn-gold" style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14 }} onClick={() => setView('create-event')}>
            + New Event
          </button>
        }
      />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['All', 'Active', 'Draft', 'Completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: filter === f ? '#c9a84c' : 'rgba(201,168,76,0.2)', background: filter === f ? 'rgba(201,168,76,0.12)' : 'transparent', color: filter === f ? '#c9a84c' : '#8b82a0', transition: 'all 0.15s' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Events grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map(ev => (
          <div key={ev.id} className="card-base" style={{ overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(201,168,76,0.12)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}>
            {/* Header banner */}
            <div style={{ height: 80, background: categoryGradient(ev.category), display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
              <span style={{ fontSize: 36 }}>{categoryEmoji(ev.category)}</span>
              <Badge status={ev.status} />
            </div>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: '#f0ece8', marginBottom: 4 }}>{ev.title}</div>
              <div style={{ fontSize: 12, color: '#8b82a0', marginBottom: 14 }}>{ev.category} · {ev.date}</div>
              <div style={{ fontSize: 12, color: '#8b82a0', marginBottom: 16 }}>📍 {ev.venue}</div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Guests', value: ev.guestCount },
                  { label: 'Sent', value: ev.sentCount },
                  { label: 'RSVPs', value: ev.rsvpCount },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', padding: '8px 4px', background: '#1f1c3a', borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 18, color: '#c9a84c' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#8b82a0' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-gold" style={{ flex: 1, padding: '9px', borderRadius: 8, fontSize: 13 }} onClick={() => setView('send')}>
                  Send Invites
                </button>
                <button className="btn-outline" style={{ padding: '9px 14px', borderRadius: 8, fontSize: 13 }} onClick={() => setView('guests')}>
                  Guests
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Create new card */}
        <div className="card-base" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, cursor: 'pointer', border: '1px dashed rgba(201,168,76,0.3)', transition: 'border-color 0.15s, background 0.15s' }}
          onClick={() => setView('create-event')}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(201,168,76,0.04)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,168,76,0.5)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,168,76,0.3)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Icon d={icons.plus} size={22} stroke="#c9a84c" />
          </div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 16, color: '#c9a84c' }}>Create New Event</div>
          <div style={{ fontSize: 12, color: '#8b82a0', marginTop: 4 }}>Wedding, Birthday, Graduation &amp; more</div>
        </div>
      </div>
    </div>
  )
}

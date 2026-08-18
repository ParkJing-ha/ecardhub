import { useState } from "react";
import type React from "react";
import type { Guest, GuestCategory, RSVPStatus } from "../types";
import { Icon, icons } from "../icons";
import { useIsMobile } from "../hooks";
import { Badge, SectionHeader } from "../ui";

export function GuestListView({ guests, setGuests }: { guests: Guest[]; setGuests: React.Dispatch<React.SetStateAction<Guest[]>> }) {
  const isMobile = useIsMobile()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<GuestCategory | 'All'>('All')
  const [rsvpFilter, setRsvpFilter] = useState<RSVPStatus | 'All'>('All')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newGuest, setNewGuest] = useState({ name: '', phone: '', email: '', category: 'Single' as GuestCategory })

  const filtered = guests.filter(g => {
    const q = search.toLowerCase()
    const matchSearch = g.name.toLowerCase().includes(q) || g.phone.includes(q) || g.email.toLowerCase().includes(q)
    const matchCat = catFilter === 'All' || g.category === catFilter
    const matchRsvp = rsvpFilter === 'All' || g.rsvp === rsvpFilter
    return matchSearch && matchCat && matchRsvp
  })

  const addGuest = () => {
    if (!newGuest.name.trim()) return
    const g: Guest = { id: Date.now().toString(), ...newGuest, rsvp: 'Pending', invite: 'Not Sent', checkedIn: false }
    setGuests(p => [...p, g])
    setNewGuest({ name: '', phone: '', email: '', category: 'Single' })
    setShowAddForm(false)
  }

  const removeGuest = (id: string) => setGuests(p => p.filter(g => g.id !== id))

  return (
    <div>
      <SectionHeader
        title="Guest List"
        action={
          <button className="btn-gold" style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14 }} onClick={() => setShowAddForm(p => !p)}>
            + Add Guest
          </button>
        }
      />

      {/* Summary badges */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: `${guests.length} Total`, color: '#8b82a0' },
          { label: `${guests.filter(g => g.rsvp === 'Accepted').length} Accepted`, color: '#22c55e' },
          { label: `${guests.filter(g => g.rsvp === 'Pending').length} Pending`, color: '#f59e0b' },
          { label: `${guests.filter(g => g.rsvp === 'Declined').length} Declined`, color: '#ef4444' },
          { label: `${guests.filter(g => g.checkedIn).length} Checked In`, color: '#c9a84c' },
        ].map(b => (
          <span key={b.label} className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: b.color, border: `1px solid ${b.color}33` }}>{b.label}</span>
        ))}
      </div>

      {/* Add guest form */}
      {showAddForm && (
        <div className="card-base p-5" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 16, margin: '0 0 14px', color: '#f0ece8' }}>Add New Guest</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#8b82a0', marginBottom: 5 }}>Full Name *</label>
              <input placeholder="e.g. Amina Hassan" value={newGuest.name} onChange={e => setNewGuest(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#8b82a0', marginBottom: 5 }}>Phone Number</label>
              <input placeholder="+255 7XX XXX XXX" value={newGuest.phone} onChange={e => setNewGuest(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#8b82a0', marginBottom: 5 }}>Email Address</label>
              <input placeholder="guest@email.com" value={newGuest.email} onChange={e => setNewGuest(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#8b82a0', marginBottom: 5 }}>Guest Category</label>
              <select value={newGuest.category} onChange={e => setNewGuest(p => ({ ...p, category: e.target.value as GuestCategory }))}>
                <option>Single</option>
                <option>Couple</option>
                <option>VIP</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-gold" style={{ padding: '9px 22px', borderRadius: 8, fontSize: 14 }} onClick={addGuest}>Add Guest</button>
            <button className="btn-outline" style={{ padding: '9px 18px', borderRadius: 8, fontSize: 14 }} onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Icon d={icons.search} size={15} stroke="#4d4768" />
          <input placeholder="Search guests..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Icon d={icons.search} size={15} stroke="#4d4768" />
          </span>
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value as GuestCategory | 'All')} style={{ width: 'auto', flex: '0 0 auto' }}>
          <option value="All">All Categories</option>
          <option>Single</option>
          <option>Couple</option>
          <option>VIP</option>
        </select>
        <select value={rsvpFilter} onChange={e => setRsvpFilter(e.target.value as RSVPStatus | 'All')} style={{ width: 'auto', flex: '0 0 auto' }}>
          <option value="All">All RSVP</option>
          <option>Accepted</option>
          <option>Pending</option>
          <option>Declined</option>
        </select>
      </div>

      {/* Guest list — cards on mobile, table on desktop */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && <div style={{ color: '#4d4768', textAlign: 'center', padding: '40px 0' }}>No guests found.</div>}
          {filtered.map(g => (
            <div key={g.id} className="card-base" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#f0ece8' }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: '#8b82a0', marginTop: 2 }}>{g.phone}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Badge status={g.category} />
                  <button onClick={() => removeGuest(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4d4768', padding: 4 }}>
                    <Icon d={icons.trash} size={14} stroke="#4d4768" />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge status={g.rsvp} />
                <Badge status={g.invite} />
                {g.checkedIn && <span className="badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>✓ {g.checkInTime}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-base" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                  {['Name', 'Phone', 'Email', 'Category', 'RSVP', 'Invite', 'Check-In', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#4d4768', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => (
                  <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '13px 16px', color: '#f0ece8', fontWeight: 500 }}>{g.name}</td>
                    <td style={{ padding: '13px 16px', color: '#8b82a0', fontFamily: 'monospace', fontSize: 12 }}>{g.phone}</td>
                    <td style={{ padding: '13px 16px', color: '#8b82a0', fontSize: 12 }}>{g.email}</td>
                    <td style={{ padding: '13px 16px' }}><Badge status={g.category} /></td>
                    <td style={{ padding: '13px 16px' }}><Badge status={g.rsvp} /></td>
                    <td style={{ padding: '13px 16px' }}><Badge status={g.invite} /></td>
                    <td style={{ padding: '13px 16px' }}>
                      {g.checkedIn
                        ? <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 600 }}>✓ {g.checkInTime}</span>
                        : <span style={{ color: '#4d4768', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button onClick={() => removeGuest(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4d4768', padding: 4, borderRadius: 4, transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#4d4768')}>
                        <Icon d={icons.trash} size={14} stroke="currentColor" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#4d4768' }}>No guests found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

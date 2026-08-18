import { useState } from "react";
import type React from "react";
import type { Guest } from "../types";
import { Icon, icons } from "../icons";
import { useIsMobile } from "../hooks";
import { Badge, SectionHeader } from "../ui";

export function QRVerifyView({ guests, setGuests }: { guests: Guest[]; setGuests: React.Dispatch<React.SetStateAction<Guest[]>> }) {
  const isMobile = useIsMobile()
  const [checkpoint, setCheckpoint] = useState('Entrance')
  const [scanInput, setScanInput] = useState('')
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error' | 'duplicate'; guest?: Guest } | null>(null)
  const [recentScans, setRecentScans] = useState(guests.filter(g => g.checkedIn))

  const simulate = (guestId?: string) => {
    const candidate = guestId
      ? guests.find(g => g.id === guestId)
      : guests.find(g => !g.checkedIn && g.invite === 'Delivered')

    if (!candidate) { setScanResult({ type: 'error' }); return }
    if (candidate.checkedIn) { setScanResult({ type: 'duplicate', guest: candidate }); return }

    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setGuests(p => p.map(g => g.id === candidate.id ? { ...g, checkedIn: true, checkInTime: time } : g))
    setRecentScans(p => [{ ...candidate, checkedIn: true, checkInTime: time }, ...p])
    setScanResult({ type: 'success', guest: candidate })
    setScanInput('')
    setTimeout(() => setScanResult(null), 3000)
  }

  const checkedIn = guests.filter(g => g.checkedIn).length

  return (
    <div>
      <SectionHeader title="QR Guest Verification" />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: 20, alignItems: 'start' }}>
        {/* Scanner */}
        <div>
          {/* Checkpoint */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#8b82a0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active Checkpoint</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Entrance', 'Food', 'Drinks', 'VIP Area'].map(c => (
                <button key={c} onClick={() => setCheckpoint(c)} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: checkpoint === c ? '#c9a84c' : 'rgba(201,168,76,0.2)', background: checkpoint === c ? 'rgba(201,168,76,0.12)' : 'transparent', color: checkpoint === c ? '#c9a84c' : '#8b82a0', transition: 'all 0.15s' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Scanner area */}
          <div className="card-base p-5" style={{ marginBottom: 20 }}>
            <div style={{ width: '100%', height: 220, background: '#0d0b1e', borderRadius: 10, border: '1.5px dashed rgba(201,168,76,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
              {/* QR scanner frame */}
              <div style={{ width: 140, height: 140, position: 'relative', marginBottom: 12 }}>
                {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                  <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...(pos.includes('top') ? { top: 0 } : { bottom: 0 }), ...(pos.includes('left') ? { left: 0 } : { right: 0 }), borderColor: '#c9a84c', borderStyle: 'solid', borderWidth: 0, ...(pos.includes('top') && pos.includes('left') ? { borderTopWidth: 3, borderLeftWidth: 3 } : pos.includes('top') ? { borderTopWidth: 3, borderRightWidth: 3 } : pos.includes('left') ? { borderBottomWidth: 3, borderLeftWidth: 3 } : { borderBottomWidth: 3, borderRightWidth: 3 }), borderRadius: 2 }} />
                ))}
                <div style={{ position: 'absolute', inset: 12, background: 'rgba(201,168,76,0.03)', border: '1px solid rgba(201,168,76,0.08)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={icons.camera} size={32} stroke="rgba(201,168,76,0.3)" />
                </div>
                {/* Scanning line */}
                <div className="animate-pulse-slow" style={{ position: 'absolute', left: 8, right: 8, top: '40%', height: 2, background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }} />
              </div>
              <div style={{ fontSize: 13, color: '#4d4768' }}>Point camera at guest QR code</div>
              <div style={{ fontSize: 11, color: '#4d4768', marginTop: 4 }}>Checkpoint: <span style={{ color: '#c9a84c' }}>{checkpoint}</span></div>
            </div>

            {/* Manual entry */}
            <div style={{ display: 'flex', gap: 10 }}>
              <input placeholder="Or type guest ID / invitation code..." value={scanInput} onChange={e => setScanInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && simulate()} />
              <button className="btn-gold" style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14, whiteSpace: 'nowrap' }} onClick={() => simulate()}>
                Verify
              </button>
            </div>

            {/* Demo buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => simulate()} className="btn-outline" style={{ flex: 1, padding: '9px', borderRadius: 8, fontSize: 12 }}>
                Simulate Valid Scan
              </button>
              <button onClick={() => setScanResult({ type: 'error' })} className="btn-outline" style={{ flex: 1, padding: '9px', borderRadius: 8, fontSize: 12 }}>
                Simulate Invalid
              </button>
            </div>
          </div>

          {/* Scan result */}
          {scanResult && (
            <div style={{ padding: '16px 20px', borderRadius: 12, marginBottom: 20, border: '1px solid', ...(scanResult.type === 'success' ? { background: 'rgba(34,197,94,0.1)', borderColor: '#22c55e44' } : scanResult.type === 'duplicate' ? { background: 'rgba(245,158,11,0.1)', borderColor: '#f59e0b44' } : { background: 'rgba(239,68,68,0.1)', borderColor: '#ef444444' }) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>{scanResult.type === 'success' ? '✅' : scanResult.type === 'duplicate' ? '⚠️' : '❌'}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: scanResult.type === 'success' ? '#22c55e' : scanResult.type === 'duplicate' ? '#f59e0b' : '#ef4444' }}>
                    {scanResult.type === 'success' ? 'Welcome!' : scanResult.type === 'duplicate' ? 'Already Checked In' : 'Invalid QR Code'}
                  </div>
                  {scanResult.guest && <div style={{ fontSize: 14, color: '#f0ece8', marginTop: 2 }}>{scanResult.guest.name} · <Badge status={scanResult.guest.category} /></div>}
                  {scanResult.type === 'duplicate' && scanResult.guest && <div style={{ fontSize: 12, color: '#8b82a0', marginTop: 2 }}>Previously checked in at {scanResult.guest.checkInTime}</div>}
                  {scanResult.type === 'error' && <div style={{ fontSize: 13, color: '#8b82a0', marginTop: 2 }}>QR code not found in guest list.</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Check-in stats */}
          <div className="card-base p-5">
            <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 17, margin: '0 0 14px', color: '#f0ece8' }}>Check-in Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(34,197,94,0.08)', borderRadius: 8 }}>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: '#22c55e' }}>{checkedIn}</div>
                <div style={{ fontSize: 11, color: '#8b82a0' }}>Checked In</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(245,158,11,0.08)', borderRadius: 8 }}>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: '#f59e0b' }}>{guests.length - checkedIn}</div>
                <div style={{ fontSize: 11, color: '#8b82a0' }}>Pending</div>
              </div>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round((checkedIn / guests.length) * 100)}%`, background: 'linear-gradient(90deg,#22c55e,#c9a84c)', borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 12, color: '#8b82a0', marginTop: 6, textAlign: 'center' }}>{Math.round((checkedIn / guests.length) * 100)}% arrival rate</div>
          </div>

          {/* Recent check-ins */}
          <div className="card-base p-5">
            <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 17, margin: '0 0 14px', color: '#f0ece8' }}>Recent Check-ins</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
              {recentScans.length === 0 && <div style={{ color: '#4d4768', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No check-ins yet</div>}
              {recentScans.map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#1f1c3a', borderRadius: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon d={icons.check} size={14} stroke="#22c55e" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#f0ece8' }}>{g.name}</div>
                    <div style={{ fontSize: 11, color: '#8b82a0' }}><Badge status={g.category} /></div>
                  </div>
                  <div style={{ fontSize: 12, color: '#22c55e', fontFamily: 'monospace' }}>{g.checkInTime}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

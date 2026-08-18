import { useState } from "react";
import type { Guest } from "../types";
import { Icon } from "../icons";
import { useIsMobile } from "../hooks";
import { SectionHeader } from "../ui";
import { packages as PACKAGES } from "../data";

export function SendInvitesView({ guests }: { guests: Guest[] }) {
  const isMobile = useIsMobile()
  const [pkg, setPkg] = useState<string | null>(null)
  const [audience, setAudience] = useState<'all' | 'pending' | 'accepted'>('all')
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  const target = audience === 'all' ? guests : audience === 'pending' ? guests.filter(g => g.rsvp === 'Pending') : guests.filter(g => g.rsvp === 'Accepted')
  const selectedPkg = PACKAGES.find(p => p.id === pkg)
  const total = target.length * (selectedPkg?.price || 0)

  const handleSend = () => {
    setSending(true)
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 18
      if (p >= 100) { p = 100; clearInterval(interval); setTimeout(() => setDone(true), 400) }
      setProgress(Math.min(p, 100))
    }, 180)
  }

  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>📨</div>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: '#22c55e', margin: '0 0 10px' }}>Invitations Dispatched!</h2>
        <p style={{ color: '#8b82a0', fontSize: 15 }}>{target.length} invitations queued for delivery via {selectedPkg?.name}.</p>
        <button className="btn-gold" style={{ marginTop: 24, padding: '12px 28px', borderRadius: 10, fontSize: 15 }} onClick={() => { setDone(false); setSending(false); setProgress(0); setPkg(null) }}>
          Send More
        </button>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader title="Send Invitations" />

      {/* Package Selection */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, color: '#8b82a0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>Distribution Package</h3>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
          {PACKAGES.map(p => (
            <div key={p.id} onClick={() => setPkg(p.id)} style={{ padding: '18px 20px', borderRadius: 12, border: '1.5px solid', borderColor: pkg === p.id ? p.color : 'rgba(201,168,76,0.15)', background: pkg === p.id ? `${p.color}12` : '#17142e', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Icon d={p.icon} size={18} stroke={p.color} />
                <span style={{ fontWeight: 600, fontSize: 14, color: pkg === p.id ? p.color : '#f0ece8' }}>{p.name}</span>
              </div>
              <div style={{ fontSize: 12, color: '#8b82a0', marginBottom: 10 }}>{p.desc}</div>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: p.color }}>TZS {p.price}<span style={{ fontSize: 11, color: '#8b82a0', fontFamily: 'Outfit,sans-serif', fontWeight: 400 }}>/card</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Audience */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, color: '#8b82a0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>Target Audience</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { value: 'all' as const, label: `All Guests (${guests.length})` },
            { value: 'pending' as const, label: `Pending RSVP (${guests.filter(g => g.rsvp === 'Pending').length})` },
            { value: 'accepted' as const, label: `Accepted Only (${guests.filter(g => g.rsvp === 'Accepted').length})` },
          ].map(opt => (
            <button key={opt.value} onClick={() => setAudience(opt.value)} style={{ padding: '9px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: audience === opt.value ? '#c9a84c' : 'rgba(201,168,76,0.2)', background: audience === opt.value ? 'rgba(201,168,76,0.12)' : 'transparent', color: audience === opt.value ? '#c9a84c' : '#8b82a0', transition: 'all 0.15s' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cost Summary */}
      {pkg && (
        <div className="card-base p-5" style={{ marginBottom: 24, maxWidth: 440 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: '#8b82a0' }}>Cards to send</span>
            <span style={{ color: '#f0ece8', fontWeight: 600 }}>{target.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: '#8b82a0' }}>Price per card</span>
            <span style={{ color: '#f0ece8', fontWeight: 600 }}>TZS {selectedPkg?.price}</span>
          </div>
          <div style={{ height: 1, background: 'rgba(201,168,76,0.15)', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#f0ece8', fontWeight: 600 }}>Total Cost</span>
            <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: '#c9a84c' }}>TZS {total.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Send button + progress */}
      {sending ? (
        <div style={{ maxWidth: 440 }}>
          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#8b82a0', fontSize: 13 }}>Dispatching invitations...</span>
            <span style={{ color: '#c9a84c', fontSize: 13, fontWeight: 600 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#22c55e,#c9a84c)', borderRadius: 4, transition: 'width 0.2s linear' }} />
          </div>
        </div>
      ) : (
        <button className="btn-gold" disabled={!pkg} style={{ padding: '13px 36px', borderRadius: 10, fontSize: 15, opacity: pkg ? 1 : 0.4, cursor: pkg ? 'pointer' : 'default' }} onClick={handleSend}>
          Send {target.length} Invitations →
        </button>
      )}
    </div>
  )
}

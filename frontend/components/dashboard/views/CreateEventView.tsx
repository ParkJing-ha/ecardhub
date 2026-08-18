import { useState } from "react";
import type { Event, EventCategory, EventFormKey } from "../types";
import { Icon, icons } from "../icons";
import { useIsMobile } from "../hooks";
import { SectionHeader } from "../ui";
import { categoryEmoji, categoryGradient } from "../category";
import { dashboardTemplates as TEMPLATES, eventCategories as EVENT_CATEGORIES } from "../data";

export function CreateEventView({ onCreated }: { onCreated: (ev: Event) => void }) {
  const isMobile = useIsMobile()
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState<EventCategory | null>(null)
  const [template, setTemplate] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', date: '', venue: '', description: '', guestCount: '' })
  const [done, setDone] = useState(false)

  const handleCreate = () => {
    const ev: Event = {
      id: Date.now().toString(),
      title: form.title || `New ${category} Event`,
      category: category!,
      date: form.date || '2026-12-01',
      venue: form.venue || 'TBD',
      status: 'Draft',
      guestCount: parseInt(form.guestCount) || 0,
      sentCount: 0,
      rsvpCount: 0,
    }
    onCreated(ev)
    setDone(true)
  }

  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 32, color: '#c9a84c', margin: '0 0 12px' }}>Event Created!</h2>
        <p style={{ color: '#8b82a0', fontSize: 16, maxWidth: 360, margin: '0 0 28px' }}>
          Your event has been created as a draft. Add guests and send invitations when ready.
        </p>
        <button className="btn-gold" style={{ padding: '12px 32px', borderRadius: 10, fontSize: 16 }} onClick={() => { setStep(1); setDone(false); setCategory(null); setTemplate(null); setForm({ title: '', date: '', venue: '', description: '', guestCount: '' }) }}>
          Create Another Event
        </button>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader title="Create New Event" />

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36, maxWidth: 480 }}>
        {['Category', 'Details', 'Template', 'Review'].map((s, i) => {
          const n = i + 1
          const active = n === step
          const done2 = n < step
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'initial' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: done2 ? '#c9a84c' : active ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)', color: done2 ? '#0d0b1e' : active ? '#c9a84c' : '#4d4768', border: active ? '1.5px solid #c9a84c' : 'none', transition: 'all 0.2s' }}>
                  {done2 ? '✓' : n}
                </div>
                <span style={{ fontSize: 11, color: active ? '#c9a84c' : '#4d4768', whiteSpace: 'nowrap' }}>{s}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 1, background: n < step ? '#c9a84c' : 'rgba(255,255,255,0.08)', margin: '0 4px', marginBottom: 20 }} />}
            </div>
          )
        })}
      </div>

      {/* Step 1: Category */}
      {step === 1 && (
        <div>
          <p style={{ color: '#8b82a0', marginBottom: 24, fontSize: 15 }}>What type of event are you hosting?</p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            {EVENT_CATEGORIES.map(cat => (
              <div key={cat} onClick={() => setCategory(cat)} style={{ padding: '20px 14px', borderRadius: 12, border: '1.5px solid', borderColor: category === cat ? '#c9a84c' : 'rgba(201,168,76,0.15)', background: category === cat ? 'rgba(201,168,76,0.1)' : '#17142e', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{categoryEmoji(cat)}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: category === cat ? '#c9a84c' : '#f0ece8' }}>{cat}</div>
              </div>
            ))}
          </div>
          <button className="btn-gold" disabled={!category} style={{ padding: '12px 32px', borderRadius: 10, fontSize: 15, opacity: category ? 1 : 0.4, cursor: category ? 'pointer' : 'default' }} onClick={() => setStep(2)}>
            Continue →
          </button>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div style={{ maxWidth: 560 }}>
          <p style={{ color: '#8b82a0', marginBottom: 24, fontSize: 15 }}>Fill in the event details.</p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 28 }}>
            {([
              { label: 'Event Title', key: 'title', placeholder: `e.g. Amina & Karimu ${category}` },
              { label: 'Event Date', key: 'date', placeholder: 'YYYY-MM-DD', type: 'date' },
              { label: 'Venue', key: 'venue', placeholder: 'e.g. Grand Serena Hotel, Dar es Salaam' },
              { label: 'Expected Guest Count', key: 'guestCount', placeholder: 'e.g. 250', type: 'number' },
            ] satisfies { label: string; key: EventFormKey; placeholder: string; type?: string }[]).map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 13, color: '#8b82a0', marginBottom: 6 }}>{f.label}</label>
                <input type={f.type || 'text'} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#8b82a0', marginBottom: 6 }}>Description (optional)</label>
            <textarea placeholder="Brief description of the event..." rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-outline" style={{ padding: '12px 24px', borderRadius: 10, fontSize: 15 }} onClick={() => setStep(1)}>← Back</button>
            <button className="btn-gold" style={{ padding: '12px 32px', borderRadius: 10, fontSize: 15 }} onClick={() => setStep(3)}>Continue →</button>
          </div>
        </div>
      )}

      {/* Step 3: Template */}
      {step === 3 && (
        <div>
          <p style={{ color: '#8b82a0', marginBottom: 24, fontSize: 15 }}>Choose an invitation card template.</p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {TEMPLATES.map(t => (
              <div key={t.id} onClick={() => setTemplate(t.id)} style={{ cursor: 'pointer', borderRadius: 12, overflow: 'hidden', border: '2px solid', borderColor: template === t.id ? '#c9a84c' : 'transparent', transition: 'all 0.15s' }}>
                <div style={{ height: 120, background: t.preview, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 14, color: t.accent }}>Invitation Card</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>QR Code ▪ Guest Name</div>
                  </div>
                  {template === t.id && (
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: '#c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon d={icons.check} size={12} stroke="#0d0b1e" />
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px 14px', background: '#17142e' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#f0ece8' }}>{t.name}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-outline" style={{ padding: '12px 24px', borderRadius: 10, fontSize: 15 }} onClick={() => setStep(2)}>← Back</button>
            <button className="btn-gold" disabled={!template} style={{ padding: '12px 32px', borderRadius: 10, fontSize: 15, opacity: template ? 1 : 0.4, cursor: template ? 'pointer' : 'default' }} onClick={() => setStep(4)}>Continue →</button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div style={{ maxWidth: 560 }}>
          <p style={{ color: '#8b82a0', marginBottom: 24, fontSize: 15 }}>Review your event details before creating.</p>
          <div className="card-base p-5" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: categoryGradient(category!), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{categoryEmoji(category!)}</div>
              <div>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: '#f0ece8' }}>{form.title || `New ${category} Event`}</div>
                <div style={{ fontSize: 13, color: '#8b82a0', marginTop: 4 }}>{category} · {form.date || 'Date TBD'}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Venue', value: form.venue || 'TBD' },
                { label: 'Guest Count', value: form.guestCount || '0' },
                { label: 'Template', value: TEMPLATES.find(t => t.id === template)?.name || 'None' },
                { label: 'Status', value: 'Draft' },
              ].map(r => (
                <div key={r.label} style={{ padding: '10px 14px', background: '#1f1c3a', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#8b82a0', marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 14, color: '#f0ece8', fontWeight: 500 }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-outline" style={{ padding: '12px 24px', borderRadius: 10, fontSize: 15 }} onClick={() => setStep(3)}>← Back</button>
            <button className="btn-gold" style={{ padding: '12px 32px', borderRadius: 10, fontSize: 15 }} onClick={handleCreate}>
              Create Event ✨
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

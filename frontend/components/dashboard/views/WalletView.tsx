import { useState } from "react";
import { useIsMobile } from "../hooks";
import { SectionHeader } from "../ui";
import { transactions } from "../data";

export function WalletView() {
  const isMobile = useIsMobile()
  const [method, setMethod] = useState('mpesa')
  const [amount, setAmount] = useState('')
  const [topping, setTopping] = useState(false)
  const [topupDone, setTopupDone] = useState(false)
  const balance = 15400

  const handleTopup = () => {
    setTopping(true)
    setTimeout(() => { setTopping(false); setTopupDone(true); setTimeout(() => setTopupDone(false), 3000) }, 1800)
  }

  return (
    <div>
      <SectionHeader title="Wallet & Payments" />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Left: Balance + Top-up */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Balance card */}
          <div style={{ padding: '32px 28px', borderRadius: 16, background: 'linear-gradient(135deg,#1a0a3a,#3d1f6b)', border: '1px solid rgba(201,168,76,0.25)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(201,168,76,0.06)' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(124,92,191,0.12)' }} />
            <div style={{ fontSize: 12, color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Available Balance</div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 48, color: '#c9a84c', lineHeight: 1, marginBottom: 8 }}>
              TZS {balance.toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(240,236,232,0.5)' }}>≈ {Math.floor(balance / 100)} WhatsApp cards · {Math.floor(balance / 200)} Full packages</div>
            {topupDone && <div style={{ marginTop: 14, padding: '8px 14px', background: 'rgba(34,197,94,0.15)', borderRadius: 8, color: '#22c55e', fontSize: 13, fontWeight: 600, display: 'inline-block' }}>✓ Top-up successful!</div>}
          </div>

          {/* Top-up form */}
          <div className="card-base p-5">
            <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, margin: '0 0 18px', color: '#f0ece8' }}>Top Up Wallet</h3>

            {/* Payment method */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8b82a0', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { id: 'mpesa', label: 'M-Pesa', color: '#22c55e' },
                  { id: 'airtel', label: 'Airtel Money', color: '#ef4444' },
                  { id: 'mixx', label: 'Mixx by Yas', color: '#60a5fa' },
                  { id: 'card', label: 'Card', color: '#c9a84c' },
                ].map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)} style={{ padding: '10px 8px', borderRadius: 10, border: '1.5px solid', borderColor: method === m.id ? m.color : 'rgba(201,168,76,0.15)', background: method === m.id ? `${m.color}12` : '#1f1c3a', color: method === m.id ? m.color : '#8b82a0', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8b82a0', marginBottom: 6 }}>Amount (TZS)</label>
              <input type="number" placeholder="e.g. 50000" value={amount} onChange={e => setAmount(e.target.value)} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {[10000, 20000, 50000, 100000].map(a => (
                  <button key={a} onClick={() => setAmount(String(a))} style={{ flex: 1, padding: '7px', fontSize: 12, border: '1px solid rgba(201,168,76,0.2)', borderRadius: 6, background: 'transparent', color: '#8b82a0', cursor: 'pointer' }}>
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-gold" disabled={!amount || topping} style={{ width: '100%', padding: '13px', borderRadius: 10, fontSize: 15, opacity: amount && !topping ? 1 : 0.5, cursor: amount && !topping ? 'pointer' : 'default' }} onClick={handleTopup}>
              {topping ? 'Processing...' : `Top Up TZS ${parseInt(amount || '0').toLocaleString()}`}
            </button>
          </div>
        </div>

        {/* Right: Transaction history */}
        <div className="card-base p-5">
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, margin: '0 0 16px', color: '#f0ece8' }}>Transaction History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {transactions.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: t.type === 'credit' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 16 }}>{t.type === 'credit' ? '↓' : '↑'}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#f0ece8', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.desc}</div>
                  <div style={{ fontSize: 11, color: '#4d4768', marginTop: 2 }}>{t.date}</div>
                </div>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 15, color: t.type === 'credit' ? '#22c55e' : '#ef4444', whiteSpace: 'nowrap' }}>
                  {t.type === 'credit' ? '+' : ''}TZS {Math.abs(t.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client';
import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { id: 'shopify', label: 'Shopify', icon: '🛍' },
  { id: 'meta', label: 'Meta Ads', icon: '𝕄' },
  { id: 'tiktok', label: 'TikTok Ads', icon: '♪' },
  { id: 'ai', label: 'AI Agent', icon: '◈' },
  { id: 'seo', label: 'SEO', icon: '◎' },
];

const revenueData = [
  { dag: 'Ma', omzet: 45 }, { dag: 'Di', omzet: 82 }, { dag: 'Wo', omzet: 61 },
  { dag: 'Do', omzet: 120 }, { dag: 'Vr', omzet: 95 }, { dag: 'Za', omzet: 148 }, { dag: 'Zo', omzet: 110 },
];

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: '18px 20px', minWidth: 0 }}>
      <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#f9fafb', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [page, setPage] = useState('dashboard');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hoi! Ik ben je CryoWipes AI manager. Stel me een vraag over je ads, omzet of SEO.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [shopifyData, setShopifyData] = useState<any>(null);
  const [metaData, setMetaData] = useState<any>(null);
  const chatRef = useRef<HTMLDivElement>(null);

useEffect(() => {
    const load = () => {
      fetch('/api/shopify').then(r => r.json()).then(setShopifyData).catch(() => {});
      fetch('/api/meta').then(r => r.json()).then(setMetaData).catch(() => {});
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const msgs = [...messages, { role: 'user', content: input }];
    setMessages(msgs);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })) })
      });
      const data = await res.json();
      setMessages([...msgs, { role: 'assistant', content: data.content }]);
    } catch { setMessages([...msgs, { role: 'assistant', content: 'Er ging iets mis.' }]); }
    setLoading(false);
  }

  const orders = shopifyData?.orders || 0;
  const revenue = shopifyData?.revenue || '0.00';
  const aov = shopifyData?.aov || '0.00';
  const metaSpend = metaData?.spend || '0';
  const metaImpressions = metaData?.impressions || '0';
  const metaClicks = metaData?.clicks || '0';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', color: '#f9fafb', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* SIDEBAR */}
      <div style={{ width: 220, background: '#0d1117', borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 28px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #00c2ff, #0070f3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>❄</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f9fafb' }}>CryoWipes AI</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Dashboard</div>
            </div>
          </div>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
              borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left',
              background: page === n.id ? 'linear-gradient(90deg, #0070f320, #00c2ff10)' : 'transparent',
              color: page === n.id ? '#00c2ff' : '#9ca3af',
              fontWeight: page === n.id ? 600 : 400, fontSize: 14,
              borderLeft: page === n.id ? '2px solid #00c2ff' : '2px solid transparent',
            }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1f2937' }}>
          <div style={{ fontSize: 11, color: '#6b7280' }}>cryowipes.store</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></div>
            <span style={{ fontSize: 12, color: '#10b981' }}>AI Actief</span>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* TOPBAR */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0d1117' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb' }}>
              {NAV.find(n => n.id === page)?.label || 'Dashboard'}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Realtime overzicht van al je kanalen</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#9ca3af' }}>
              Laatste 7 dagen
            </div>
            <div style={{ background: 'linear-gradient(135deg, #0070f3, #00c2ff)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              ◈ AI Agent
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ padding: 28, flex: 1 }}>

          {page === 'dashboard' && (
            <div>
              {/* KPI STRIP */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
<KpiCard label="Totale omzet" value={`$${revenue}`} sub={`${orders} orders`} color="#10b981" />
<KpiCard label="Orders" value={String(orders)} sub="Laatste 7 dagen" color="#10b981" />
<KpiCard label="AOV" value={`$${aov}`} sub="Gem. orderwaarde" color="#10b981" />
<KpiCard label="Meta Spend" value={`$${metaSpend}`} sub={`${metaImpressions} impressies`} color="#f59e0b" />
              </div>

              {/* CHARTS ROW */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#f9fafb' }}>Omzet over tijd</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="dag" stroke="#4b5563" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#4b5563" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="omzet" stroke="#00c2ff" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* META STATS */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#f9fafb' }}>Meta Ads prestaties</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Spend', value: `$${metaSpend}` },
                      { label: 'Impressies', value: Number(metaImpressions).toLocaleString() },
                      { label: 'Clicks', value: metaClicks },
                      { label: 'CTR', value: metaData?.ctr ? `${parseFloat(metaData.ctr).toFixed(2)}%` : '0%' },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#0d1117', borderRadius: 8, padding: '12px 14px' }}>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI CHAT */}
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#f9fafb' }}>◈ AI Manager</div>
                <div ref={chatRef} style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {messages.map((m, i) => (
                    <div key={i} style={{
                      padding: '10px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.5, maxWidth: '85%',
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      background: m.role === 'user' ? 'linear-gradient(135deg, #0070f3, #00c2ff)' : '#0d1117',
                      color: '#f9fafb',
                    }}>{m.content}</div>
                  ))}
                  {loading && <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: '#0d1117', color: '#6b7280', alignSelf: 'flex-start' }}>Bezig...</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Vraag iets aan je AI manager..."
                    style={{ flex: 1, padding: '10px 14px', background: '#0d1117', color: '#f9fafb', border: '1px solid #1f2937', borderRadius: 8, fontSize: 13, outline: 'none' }} />
                  <button onClick={send} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #0070f3, #00c2ff)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Stuur</button>
                </div>
              </div>
            </div>
          )}

{page === 'shopify' && (
  <div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
      <KpiCard label="Totale omzet" value={`$${revenue}`} sub={`${orders} orders totaal`} color="#10b981" />
      <KpiCard label="Omzet vandaag" value={`$${shopifyData?.todayRevenue || '0.00'}`} sub={`${shopifyData?.todayOrders || 0} orders vandaag`} color="#10b981" />
      <KpiCard label="AOV" value={`$${aov}`} sub="Gem. orderwaarde" color="#10b981" />
      <KpiCard label="Klanten" value={String(shopifyData?.totalCustomers || 0)} sub={`${shopifyData?.totalProducts || 0} producten`} color="#6366f1" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#f9fafb' }}>Recente orders</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1f2937' }}>
              {['Order', 'Datum', 'Bedrag', 'Status'].map(h => (
                <th key={h} style={{ padding: '8px 0', color: '#6b7280', fontWeight: 500, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(shopifyData?.recentOrders || []).map((o: any) => (
              <tr key={o.id} style={{ borderBottom: '1px solid #1f2937' }}>
                <td style={{ padding: '10px 0', color: '#00c2ff', fontWeight: 600 }}>{o.id}</td>
                <td style={{ padding: '10px 0', color: '#9ca3af' }}>{o.date}</td>
                <td style={{ padding: '10px 0', color: '#f9fafb' }}>${o.total}</td>
                <td style={{ padding: '10px 0' }}>
                  <span style={{
                    background: o.status === 'fulfilled' ? '#10b98120' : '#f59e0b20',
                    color: o.status === 'fulfilled' ? '#10b981' : '#f59e0b',
                    padding: '2px 8px', borderRadius: 4, fontSize: 11
                  }}>{o.status === 'fulfilled' ? 'Verzonden' : 'In behandeling'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#f9fafb' }}>Producten</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(shopifyData?.products || []).slice(0, 6).map((p: any) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#0d1117', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 13, color: '#f9fafb', fontWeight: 500 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Voorraad: {p.inventory} stuks</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#00c2ff' }}>${p.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}

{page !== 'dashboard' && page !== 'shopify' && (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#4b5563', fontSize: 14 }}>
    {NAV.find(n => n.id === page)?.label} pagina — komt binnenkort
  </div>
)}
        </div>
      </div>
    </div>
  );
}

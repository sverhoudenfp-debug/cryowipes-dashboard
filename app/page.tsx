'use client';
import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// ─── Styles ────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #060810;
    --bg-panel: #0c0f1a;
    --bg-card: #111525;
    --bg-hover: #161b2e;
    --border: #1e2540;
    --border-bright: #2a3260;
    --text: #e8eaf0;
    --text-muted: #5a6280;
    --text-dim: #8892b0;
    --blue: #4f8ef7;
    --blue-bright: #6fa8ff;
    --cyan: #00d4ff;
    --cyan-dim: #00d4ff30;
    --green: #00e5a0;
    --green-dim: #00e5a020;
    --amber: #ffb547;
    --amber-dim: #ffb54720;
    --red: #ff5c5c;
    --red-dim: #ff5c5c20;
    --purple: #a78bfa;
    --purple-dim: #a78bfa20;
    --gradient: linear-gradient(135deg, #4f8ef7, #00d4ff);
    --gradient-glow: linear-gradient(135deg, #4f8ef740, #00d4ff20);
    --font: 'Inter', system-ui, sans-serif;
    --mono: 'JetBrains Mono', monospace;
    --radius: 14px;
    --radius-sm: 8px;
  }

  body { background: var(--bg); font-family: var(--font); color: var(--text); }

  .sidebar {
    width: 240px;
    background: var(--bg-panel);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    position: relative;
  }
  .sidebar::after {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 1px; height: 100%;
    background: linear-gradient(to bottom, transparent, var(--cyan-dim), transparent);
  }

  .nav-btn {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 10px 14px;
    border-radius: var(--radius-sm); border: none; cursor: pointer;
    background: transparent; color: var(--text-muted);
    font-weight: 500; font-size: 13.5px; font-family: var(--font);
    text-align: left; transition: all 0.2s;
    border-left: 2px solid transparent;
    margin-bottom: 2px;
  }
  .nav-btn:hover { background: var(--bg-hover); color: var(--text-dim); }
  .nav-btn.active {
    background: var(--gradient-glow);
    color: var(--cyan);
    border-left: 2px solid var(--cyan);
    font-weight: 600;
  }

  .kpi-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px 22px;
    min-width: 0;
    transition: border-color 0.2s, transform 0.2s;
    position: relative;
    overflow: hidden;
  }
  .kpi-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--cyan-dim), transparent);
  }
  .kpi-card:hover { border-color: var(--border-bright); transform: translateY(-1px); }
  .kpi-label { font-size: 10.5px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
  .kpi-value { font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.03em; line-height: 1; }
  .kpi-sub { font-size: 12px; margin-top: 6px; }

  .panel {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px;
  }
  .panel-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 18px; }

  /* Chat */
  .chat-wrap { display: flex; flex-direction: column; height: 100%; }
  .chat-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 4px 0; }
  .chat-messages::-webkit-scrollbar { width: 4px; }
  .chat-messages::-webkit-scrollbar-track { background: transparent; }
  .chat-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .msg-bubble {
    padding: 11px 15px; border-radius: 12px;
    font-size: 13px; line-height: 1.65; max-width: 88%;
    animation: fadeUp 0.25s ease;
  }
  .msg-bubble.assistant {
    background: var(--bg-panel);
    border: 1px solid var(--border);
    align-self: flex-start;
    color: var(--text-dim);
    border-radius: 4px 12px 12px 12px;
  }
  .msg-bubble.user {
    background: var(--gradient);
    color: #fff;
    align-self: flex-end;
    border-radius: 12px 12px 4px 12px;
    font-weight: 500;
  }

  .typing-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--cyan); display: inline-block; margin: 0 2px;
    animation: typingPulse 1.2s ease-in-out infinite;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }

  .chat-input-row { display: flex; gap: 8px; margin-top: 12px; }
  .chat-input {
    flex: 1; padding: 11px 16px;
    background: var(--bg-panel); color: var(--text);
    border: 1px solid var(--border); border-radius: var(--radius-sm);
    font-size: 13px; font-family: var(--font); outline: none;
    transition: border-color 0.2s;
  }
  .chat-input:focus { border-color: var(--cyan); }
  .chat-input::placeholder { color: var(--text-muted); }
  .chat-send {
    padding: 11px 20px;
    background: var(--gradient); color: #fff;
    border: none; border-radius: var(--radius-sm);
    cursor: pointer; font-weight: 600; font-size: 13px; font-family: var(--font);
    transition: opacity 0.2s, transform 0.1s;
    white-space: nowrap;
  }
  .chat-send:hover { opacity: 0.9; }
  .chat-send:active { transform: scale(0.97); }
  .chat-send:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Action card */
  .action-card {
    background: var(--bg-panel);
    border: 1px solid var(--amber-dim);
    border-radius: var(--radius);
    padding: 16px 18px;
    margin-bottom: 10px;
    animation: fadeUp 0.3s ease;
  }

  /* Badge */
  .badge {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 2px 8px; border-radius: 6px;
    font-size: 10.5px; font-weight: 600; letter-spacing: 0.03em;
  }
  .badge-green { background: var(--green-dim); color: var(--green); }
  .badge-amber { background: var(--amber-dim); color: var(--amber); }
  .badge-red { background: var(--red-dim); color: var(--red); }
  .badge-blue { background: var(--purple-dim); color: var(--purple); }
  .badge-cyan { background: var(--cyan-dim); color: var(--cyan); }

  /* Dot indicator */
  .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .dot-green { background: var(--green); box-shadow: 0 0 6px var(--green); }
  .dot-amber { background: var(--amber); box-shadow: 0 0 6px var(--amber); }
  .dot-cyan { background: var(--cyan); box-shadow: 0 0 6px var(--cyan); }

  /* Table */
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .data-table th { padding: 8px 0; color: var(--text-muted); font-weight: 500; text-align: left; border-bottom: 1px solid var(--border); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
  .data-table td { padding: 11px 0; border-bottom: 1px solid var(--border); color: var(--text-dim); }
  .data-table tr:last-child td { border-bottom: none; }

  /* Pill btn */
  .pill-btn {
    padding: 7px 14px; background: var(--bg-panel);
    border: 1px solid var(--border); border-radius: var(--radius-sm);
    color: var(--text-muted); font-size: 12px; cursor: pointer; font-family: var(--font);
    transition: all 0.15s;
  }
  .pill-btn:hover { border-color: var(--border-bright); color: var(--text-dim); background: var(--bg-hover); }

  /* Scrollbar global */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes typingPulse {
    0%, 60%, 100% { transform: scale(1); opacity: 0.4; }
    30% { transform: scale(1.4); opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .pulse { animation: pulse 2s ease-in-out infinite; }
`;

// ─── Nav ───────────────────────────────────────────────────────────────────────
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

// ─── Helpers ───────────────────────────────────────────────────────────────────
function renderMessage(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text)">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:var(--text-dim)">$1</em>')
    .replace(/^### (.+)$/gm, '<div style="font-weight:600;color:var(--cyan);margin:8px 0 4px;font-size:11.5px;text-transform:uppercase;letter-spacing:0.06em">$1</div>')
    .replace(/^## (.+)$/gm, '<div style="font-weight:700;color:var(--text);margin:10px 0 4px;font-size:13px">$1</div>')
    .replace(/^- (.+)$/gm, '<div style="padding:3px 0 3px 12px;border-left:2px solid var(--border-bright);margin:3px 0;color:var(--text-dim)">$1</div>')
    .replace(/^\d+\. (.+)$/gm, '<div style="padding:3px 0 3px 12px;border-left:2px solid var(--cyan-dim);margin:3px 0;color:var(--text-dim)">$1</div>')
    .replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub" style={{ color }}>{sub}</div>}
    </div>
  );
}

// ─── Action Card ──────────────────────────────────────────────────────────────
interface AIAction { id: string; description: string; action: string; payload: any; status: 'pending' | 'approved' | 'rejected' | 'executed'; }

function ActionCard({ action, onApprove, onReject }: { action: AIAction; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="action-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div className="dot dot-amber pulse" />
        <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Voorstel</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: renderMessage(action.description) }} />
      {action.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onApprove} style={{ padding: '8px 16px', background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--green)40', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)', transition: 'opacity 0.15s' }}>
            Goedkeuren
          </button>
          <button onClick={onReject} style={{ padding: '8px 16px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red)40', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)' }}>
            Afwijzen
          </button>
        </div>
      )}
      {action.status === 'executed' && <span className="badge badge-green">✓ Uitgevoerd</span>}
      {action.status === 'rejected' && <span className="badge badge-red">✕ Afgewezen</span>}
    </div>
  );
}

// ─── Chat Component ───────────────────────────────────────────────────────────
function ChatBox({ messages, input, setInput, send, loading, chatRef, compact = false }: any) {
  return (
    <div className="chat-wrap">
      <div className="chat-messages" ref={chatRef} style={{ maxHeight: compact ? 240 : 400, minHeight: compact ? 140 : 200 }}>
        {messages.map((m: any, i: number) => (
          <div key={i} className={`msg-bubble ${m.role}`}
            dangerouslySetInnerHTML={{ __html: renderMessage(m.content) }} />
        ))}
        {loading && (
          <div className="msg-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '12px 16px' }}>
            <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
          </div>
        )}
      </div>
      <div className="chat-input-row">
        <input className="chat-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && send()}
          placeholder={compact ? 'Vraag iets...' : 'Vraag de AI om iets te analyseren of voor te stellen...'} />
        <button className="chat-send" onClick={send} disabled={loading || !input.trim()}>
          {loading ? '...' : 'Stuur'}
        </button>
      </div>
    </div>
  );
}

// ─── SEO Page ─────────────────────────────────────────────────────────────────
function SEOPage() {
  const [seoData, setSeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/seo').then(r => r.json()).then(d => { setSeoData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const scoreColor = !seoData ? 'var(--text-muted)' : seoData.score >= 80 ? 'var(--green)' : seoData.score >= 60 ? 'var(--amber)' : 'var(--red)';

  return (
    <div>
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 13 }}>
          <div className="dot dot-cyan pulse" /> SEO scan bezig...
        </div>
      )}
      {seoData && !loading && (
        <div style={{ animation: 'fadeUp 0.3s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
            <div className="kpi-card" style={{ borderColor: `${scoreColor}40` }}>
              <div className="kpi-label">SEO Score</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: scoreColor, letterSpacing: '-0.04em', lineHeight: 1 }}>{seoData.score}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>/100 punten</div>
            </div>
            <KpiCard label="Pagina's gescand" value={String(seoData.totalPages)} sub="Producten + collecties" color="var(--purple)" />
            <KpiCard label="Kritieke problemen" value={String(seoData.highCount)} sub="Hoge prioriteit" color="var(--red)" />
            <KpiCard label="Waarschuwingen" value={String(seoData.mediumCount)} sub="Medium prioriteit" color="var(--amber)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div className="dot dot-green" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Laatste scan: {new Date(seoData.lastScanned).toLocaleString('nl-NL')}</span>
            <button className="pill-btn" style={{ fontSize: 11, padding: '4px 12px' }}
              onClick={() => { setLoading(true); fetch('/api/seo').then(r => r.json()).then(d => { setSeoData(d); setLoading(false); }); }}>
              ↻ Opnieuw
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {seoData.issues.length === 0 && (
              <div className="panel" style={{ borderColor: 'var(--green)30', color: 'var(--green)', textAlign: 'center', fontSize: 13 }}>
                ✓ Geen problemen gevonden. Alles ziet er goed uit.
              </div>
            )}
            {seoData.issues.map((p: any, i: number) => (
              <div key={i} className="panel" style={{ animation: `fadeUp ${0.1 + i * 0.05}s ease` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge ${p.page_type === 'product' ? 'badge-blue' : 'badge-amber'}`}>
                      {p.page_type === 'product' ? 'Product' : 'Collectie'}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{p.page_title}</span>
                  </div>
                  <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--cyan)', textDecoration: 'none', opacity: 0.8 }}>Bekijk →</a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {p.issues.map((issue: any, j: number) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <span className={`badge ${issue.severity === 'hoog' ? 'badge-red' : 'badge-amber'}`} style={{ flexShrink: 0, marginTop: 1 }}>
                        {issue.severity === 'hoog' ? 'Hoog' : 'Medium'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>{issue.message}</span>
                      {issue.suggestion && <span style={{ fontSize: 11, color: 'var(--green)', flexShrink: 0 }}>{issue.suggestion}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [page, setPage] = useState('dashboard');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hoi! Ik ben je CryoWipes AI manager. Ik kan je data analyseren en acties voorstellen die jij kan goedkeuren.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [shopifyData, setShopifyData] = useState<any>(null);
  const [metaData, setMetaData] = useState<any>(null);
  const [pendingActions, setPendingActions] = useState<AIAction[]>([]);
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

  async function approveAction(actionId: string) {
    const action = pendingActions.find(a => a.id === actionId);
    if (!action) return;
    setPendingActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'executed' } : a));
    try {
      await fetch('/api/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: action.action, payload: action.payload }) });
      setMessages(prev => [...prev, { role: 'assistant', content: `✓ Uitgevoerd: ${action.description}` }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '✕ Er ging iets mis.' }]);
    }
  }

  function rejectAction(actionId: string) {
    setPendingActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'rejected' } : a));
    setMessages(prev => [...prev, { role: 'assistant', content: 'Ok, ik sla deze actie over.' }]);
  }

  async function send() {
    if (!input.trim()) return;
    const msgs = [...messages, { role: 'user', content: input }];
    setMessages(msgs);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })) })
      });
      const data = await res.json();
      if (data.action) {
        const newAction: AIAction = { id: Date.now().toString(), description: data.action.description, action: data.action.type, payload: data.action.payload, status: 'pending' };
        setPendingActions(prev => [...prev, newAction]);
      }
      setMessages([...msgs, { role: 'assistant', content: data.content }]);
    } catch {
      setMessages([...msgs, { role: 'assistant', content: 'Er ging iets mis.' }]);
    }
    setLoading(false);
  }

  const orders = shopifyData?.orders || 0;
  const revenue = shopifyData?.revenue || '0.00';
  const aov = shopifyData?.aov || '0.00';
  const metaSpend = metaData?.spend || '0';
  const metaImpressions = metaData?.impressions || '0';
  const metaClicks = metaData?.clicks || '0';
  const metaBalance = metaData?.balance || '0';
const metaCurrency = metaData?.currency || 'USD';
  const pendingCount = pendingActions.filter(a => a.status === 'pending').length;

  return (
    <>
      <style>{css}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

        {/* ── Sidebar ── */}
        <div className="sidebar">
          {/* Logo */}
          <div style={{ padding: '24px 20px 22px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, background: 'var(--gradient)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>❄</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>CryoWipes</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: 1 }}>AI Dashboard</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '14px 12px', flex: 1 }}>
            {NAV.map(n => (
              <button key={n.id} className={`nav-btn ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
                <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{n.icon}</span>
                {n.label}
                {n.id === 'ai' && pendingCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'var(--amber)', color: '#000', borderRadius: 20, minWidth: 18, height: 18, padding: '0 5px', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Status */}
          <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: 6 }}>cryowipes.store</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="dot dot-green pulse" />
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>AI Actief</span>
            </div>
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', minWidth: 0 }}>

          {/* Header */}
          <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-panel)', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {NAV.find(n => n.id === page)?.label || 'Dashboard'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Realtime overzicht van al je kanalen</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px' }}>
                <div className="dot dot-green" />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Live · 30s</span>
              </div>
              <button onClick={() => setPage('ai')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gradient)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 16px', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)', position: 'relative' }}>
                ◈ AI Agent
                {pendingCount > 0 && (
                  <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--amber)', color: '#000', borderRadius: '50%', width: 16, height: 16, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: 28, flex: 1 }}>

            {/* ── Dashboard ── */}
            {page === 'dashboard' && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 22 }}>
                  <KpiCard label="Totale omzet" value={`$${revenue}`} sub={`${orders} orders`} color="var(--green)" />
                  <KpiCard label="Orders" value={String(orders)} sub="Laatste 7 dagen" color="var(--green)" />
                  <KpiCard label="Gem. orderwaarde" value={`$${aov}`} sub="AOV" color="var(--cyan)" />
                  <KpiCard label="Meta Spend" value={`$${metaSpend}`} sub={`${Number(metaImpressions).toLocaleString()} impressies`} color="var(--amber)" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
                  <div className="panel">
                    <div className="panel-title">Omzet afgelopen week</div>
                    <ResponsiveContainer width="100%" height={170}>
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="dag" stroke="var(--border)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis stroke="var(--border)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }} />
                        <Line type="monotone" dataKey="omzet" stroke="var(--cyan)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="panel">
                    <div className="panel-title">Meta Ads overzicht</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { label: 'Spend', value: `$${metaSpend}` },
                        { label: 'Impressies', value: Number(metaImpressions).toLocaleString() },
                        { label: 'Clicks', value: metaClicks },
                        { label: 'CTR', value: metaData?.ctr ? `${parseFloat(metaData.ctr).toFixed(2)}%` : '0%' },
                      ].map(s => (
                        <div key={s.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                          <div style={{ fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="panel">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>◈ AI Manager</span>
                    <div className="dot dot-cyan pulse" />
                  </div>
                  <ChatBox messages={messages} input={input} setInput={setInput} send={send} loading={loading} chatRef={chatRef} compact />
                </div>
              </div>
            )}

            {/* ── AI Agent ── */}
            {page === 'ai' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, animation: 'fadeUp 0.3s ease' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Openstaande acties</span>
                    {pendingCount > 0 && <span className="badge badge-amber">{pendingCount} wachtend</span>}
                  </div>
                  {pendingActions.length === 0 ? (
                    <div className="panel" style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 28 }}>
                      Geen openstaande acties.<br />
                      <span style={{ fontSize: 12, marginTop: 4, display: 'block' }}>Vraag de AI om iets te analyseren of voor te stellen.</span>
                    </div>
                  ) : (
                    pendingActions.map(a => <ActionCard key={a.id} action={a} onApprove={() => approveAction(a.id)} onReject={() => rejectAction(a.id)} />)
                  )}
                </div>
                <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span className="panel-title" style={{ margin: 0 }}>◈ AI Agent</span>
                    <div className="dot dot-cyan pulse" />
                  </div>
                  <ChatBox messages={messages} input={input} setInput={setInput} send={send} loading={loading} chatRef={chatRef} />
                </div>
              </div>
            )}

            {/* ── Shopify ── */}
            {page === 'shopify' && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 20 }}>
                  <KpiCard label="Totale omzet" value={`$${revenue}`} sub={`${orders} orders`} color="var(--green)" />
                  <KpiCard label="Orders" value={String(orders)} sub="Alle orders" color="var(--green)" />
                  <KpiCard label="AOV" value={`$${aov}`} sub="Gem. waarde" color="var(--cyan)" />
                  <KpiCard label="Vandaag" value={`$${shopifyData?.todayRevenue || '0.00'}`} sub={`${shopifyData?.todayOrders || 0} orders`} color="var(--green)" />
                  <KpiCard label="Klanten" value={String(shopifyData?.totalCustomers || 0)} sub="Totaal" color="var(--purple)" />
                  <KpiCard label="Producten" value={String(shopifyData?.totalProducts || 0)} sub="In catalogus" color="var(--purple)" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="panel">
                    <div className="panel-title">Omzet over tijd</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="dag" stroke="var(--border)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis stroke="var(--border)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }} />
                        <Line type="monotone" dataKey="omzet" stroke="var(--cyan)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="panel">
                    <div className="panel-title">Snelle links</div>
                    {[
                      { label: 'Orders', url: 'https://admin.shopify.com/store/cryowipes/orders' },
                      { label: 'Producten', url: 'https://admin.shopify.com/store/cryowipes/products' },
                      { label: 'Klanten', url: 'https://admin.shopify.com/store/cryowipes/customers' },
                    ].map(l => (
                      <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none', transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}>
                        {l.label} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>↗</span>
                      </a>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="panel">
                    <div className="panel-title">Producten</div>
                    <table className="data-table">
                      <thead><tr>{['Product', 'Prijs', 'Voorraad'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {(shopifyData?.products || []).slice(0, 6).map((p: any) => (
                          <tr key={p.id}>
                            <td style={{ color: 'var(--text)' }}>{p.title}</td>
                            <td style={{ color: 'var(--cyan)', fontWeight: 600, fontFamily: 'var(--mono)', fontSize: 12 }}>${p.price}</td>
                            <td><span className={`badge ${p.inventory > 10 ? 'badge-green' : 'badge-red'}`}>{p.inventory}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="panel">
                    <div className="panel-title">Recente orders</div>
                    <table className="data-table">
                      <thead><tr>{['Order', 'Datum', 'Bedrag', 'Status'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {(shopifyData?.recentOrders || []).map((o: any) => (
                          <tr key={o.id}>
                            <td style={{ color: 'var(--cyan)', fontFamily: 'var(--mono)', fontSize: 11 }}>{o.id}</td>
                            <td>{o.date}</td>
                            <td style={{ color: 'var(--text)', fontWeight: 500 }}>${o.total}</td>
                            <td><span className={`badge ${o.status === 'fulfilled' ? 'badge-green' : 'badge-amber'}`}>{o.status === 'fulfilled' ? 'Verzonden' : 'In behandeling'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Meta Ads ── */}
            {page === 'meta' && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 20 }}>
                  <KpiCard label="Spend" value={`$${metaSpend}`} sub="Laatste 7 dagen" color="var(--amber)" />
                  <KpiCard label="Impressies" value={Number(metaImpressions).toLocaleString()} sub="Laatste 7 dagen" color="var(--purple)" />
                  <KpiCard label="Clicks" value={metaClicks} sub="Laatste 7 dagen" color="var(--cyan)" />
                  <KpiCard label="CTR" value={metaData?.ctr ? `${parseFloat(metaData.ctr).toFixed(2)}%` : '0%'} sub="Click-through rate" color="var(--green)" />
                  <KpiCard label="CPC" value={metaData?.cpc ? `$${parseFloat(metaData.cpc).toFixed(2)}` : '$0'} sub="Kosten per klik" color="var(--amber)" />
                  <KpiCard label="Account saldo" value={`$${metaBalance}`} sub={`${metaCurrency} · Prepaid tegoed`} color="var(--green)" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="panel">
                    <div className="panel-title">Prestaties over tijd</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="dag" stroke="var(--border)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis stroke="var(--border)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }} />
                        <Line type="monotone" dataKey="omzet" stroke="var(--purple)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="panel">
                    <div className="panel-title">Account overzicht</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'Spend', value: `$${metaSpend}`, color: 'var(--amber)' },
                        { label: 'Impressies', value: Number(metaImpressions).toLocaleString(), color: 'var(--purple)' },
                        { label: 'Clicks', value: metaClicks, color: 'var(--cyan)' },
                        { label: 'CTR', value: metaData?.ctr ? `${parseFloat(metaData.ctr).toFixed(2)}%` : '0%', color: 'var(--green)' },
                      ].map(s => (
                        <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                    <a href="https://adsmanager.facebook.com" target="_blank" rel="noreferrer"
                      style={{ display: 'block', marginTop: 14, padding: '9px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--cyan)', fontSize: 12, textDecoration: 'none', textAlign: 'center', transition: 'border-color 0.15s' }}>
                      Open Meta Ads Manager ↗
                    </a>
                  </div>
                </div>
                <div className="panel" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div className="panel-title" style={{ margin: 0 }}>Campagnes</div>
                    <a href="https://adsmanager.facebook.com" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--cyan)', textDecoration: 'none' }}>Bekijk alle →</a>
                  </div>
                  {metaData?.campaigns?.length > 0 ? (
                    <table className="data-table">
                      <thead><tr>{['Campagne', 'Status', 'Budget', 'Actie'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {metaData.campaigns.map((c: any) => (
                          <tr key={c.id}>
                            <td style={{ color: 'var(--text)', fontWeight: 500 }}>{c.name}</td>
                            <td><span className={`badge ${c.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'}`}>{c.status === 'ACTIVE' ? 'Actief' : 'Gepauzeerd'}</span></td>
                            <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{c.daily_budget ? `$${(parseInt(c.daily_budget) / 100).toFixed(2)}/dag` : 'Lifetime'}</td>
                            <td>
                              <button className="pill-btn" style={{ fontSize: 11, padding: '4px 10px' }}>
                                {c.status === 'ACTIVE' ? 'Pauzeer' : 'Hervat'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Geen campagnes gevonden.</div>
                  )}
                </div>
                <div className="panel">
                  <div className="panel-title">◈ AI Inzichten</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Analyseer mijn Meta campagnes', 'Welke campagne moet ik pauzeren?', 'Hoe kan ik mijn CTR verbeteren?', 'Stel een budget optimalisatie voor'].map(q => (
                      <button key={q} className="pill-btn" onClick={() => { setInput(q); setPage('ai'); }}>{q}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {page === 'seo' && <SEOPage />}

            {page !== 'dashboard' && page !== 'shopify' && page !== 'ai' && page !== 'meta' && page !== 'seo' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)', fontSize: 14, gap: 8 }}>
                <span style={{ fontSize: 32, opacity: 0.3 }}>{NAV.find(n => n.id === page)?.icon}</span>
                {NAV.find(n => n.id === page)?.label} — komt binnenkort
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

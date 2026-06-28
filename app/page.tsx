'use client';
import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #04060f;
    --bg-panel: #080c18;
    --bg-card: #0d1121;
    --bg-hover: #121729;
    --border: #181f35;
    --border-bright: #243060;
    --text: #eef0f8;
    --text-muted: #4a5478;
    --text-dim: #7a88b0;
    --blue: #4f8ef7;
    --blue-bright: #6fa8ff;
    --cyan: #00d4ff;
    --cyan-dim: #00d4ff22;
    --cyan-glow: #00d4ff40;
    --green: #00e5a0;
    --green-dim: #00e5a018;
    --amber: #ffb547;
    --amber-dim: #ffb54718;
    --red: #ff5c5c;
    --red-dim: #ff5c5c18;
    --purple: #a78bfa;
    --purple-dim: #a78bfa18;
    --gradient: linear-gradient(135deg, #4f8ef7, #00d4ff);
    --gradient-glow: linear-gradient(135deg, #4f8ef720, #00d4ff14);
    --gradient-warm: linear-gradient(135deg, #a78bfa, #4f8ef7);
    --font: 'Inter', system-ui, sans-serif;
    --mono: 'JetBrains Mono', monospace;
    --radius: 16px;
    --radius-sm: 10px;
    --radius-xs: 6px;
    --shadow: 0 4px 24px #00000060;
    --shadow-glow: 0 0 40px #00d4ff10;
  }

  body { background: var(--bg); font-family: var(--font); color: var(--text); overflow: hidden; }

  /* ── Sidebar ── */
  .sidebar {
    width: 220px;
    background: var(--bg-panel);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    position: relative;
    z-index: 10;
  }
  .sidebar::after {
    content: '';
    position: absolute;
    top: 20%; right: 0; bottom: 20%;
    width: 1px;
    background: linear-gradient(to bottom, transparent, var(--cyan-glow), transparent);
    pointer-events: none;
  }

  .nav-btn {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 10px 12px;
    border-radius: var(--radius-sm); border: none; cursor: pointer;
    background: transparent; color: var(--text-muted);
    font-weight: 500; font-size: 13px; font-family: var(--font);
    text-align: left; transition: all 0.18s ease;
    border-left: 2px solid transparent;
    margin-bottom: 2px;
    position: relative;
    overflow: hidden;
  }
  .nav-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: var(--gradient-glow);
    opacity: 0;
    transition: opacity 0.18s;
  }
  .nav-btn:hover { color: var(--text-dim); border-left-color: var(--border-bright); }
  .nav-btn:hover::before { opacity: 1; }
  .nav-btn.active {
    background: var(--gradient-glow);
    color: var(--cyan);
    border-left: 2px solid var(--cyan);
    font-weight: 600;
    box-shadow: inset 0 0 20px var(--cyan-dim);
  }
  .nav-btn.active::before { opacity: 0; }

  /* ── KPI Cards ── */
  .kpi-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    min-width: 0;
    transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
    position: relative;
    overflow: hidden;
    cursor: default;
  }
  .kpi-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--cyan-glow), transparent);
  }
  .kpi-card::after {
    content: '';
    position: absolute; bottom: 0; right: 0;
    width: 80px; height: 80px;
    border-radius: 50%;
    background: var(--cyan-dim);
    filter: blur(30px);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .kpi-card:hover { border-color: var(--border-bright); transform: translateY(-2px); box-shadow: 0 8px 32px #00000040, var(--shadow-glow); }
  .kpi-card:hover::after { opacity: 1; }
  .kpi-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 12px; font-weight: 600; }
  .kpi-value { font-size: 26px; font-weight: 800; color: var(--text); letter-spacing: -0.04em; line-height: 1; }
  .kpi-sub { font-size: 11px; margin-top: 8px; font-weight: 500; }

  /* ── Panels ── */
  .panel {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px;
    position: relative;
    overflow: hidden;
  }
  .panel::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border-bright), transparent);
  }
  .panel-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 18px; letter-spacing: -0.01em; }

  /* ── Chat ── */
  .chat-wrap { display: flex; flex-direction: column; height: 100%; }
  .chat-messages {
    flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 4px 2px;
  }
  .chat-messages::-webkit-scrollbar { width: 3px; }
  .chat-messages::-webkit-scrollbar-track { background: transparent; }
  .chat-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  .msg-bubble {
    padding: 11px 14px; border-radius: 12px;
    font-size: 12.5px; line-height: 1.7; max-width: 90%;
    animation: fadeUp 0.2s ease;
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
    box-shadow: 0 4px 16px #4f8ef730;
  }
  .typing-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--cyan); display: inline-block; margin: 0 2px;
    animation: typingPulse 1.2s ease-in-out infinite;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  .chat-input-row { display: flex; gap: 7px; margin-top: 10px; flex-shrink: 0; }
  .chat-input {
    flex: 1; padding: 10px 14px;
    background: var(--bg-panel); color: var(--text);
    border: 1px solid var(--border); border-radius: var(--radius-sm);
    font-size: 12.5px; font-family: var(--font); outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .chat-input:focus { border-color: var(--cyan); box-shadow: 0 0 0 3px var(--cyan-dim); }
  .chat-input::placeholder { color: var(--text-muted); }
  .chat-send {
    padding: 10px 16px;
    background: var(--gradient); color: #fff;
    border: none; border-radius: var(--radius-sm);
    cursor: pointer; font-weight: 600; font-size: 12px; font-family: var(--font);
    transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
    white-space: nowrap;
    box-shadow: 0 4px 16px #4f8ef730;
  }
  .chat-send:hover { opacity: 0.9; box-shadow: 0 6px 20px #4f8ef750; }
  .chat-send:active { transform: scale(0.96); }
  .chat-send:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }

  /* ── AI Side Panel ── */
  .ai-side-panel {
    width: 0;
    min-width: 0;
    background: var(--bg-panel);
    border-left: 0px solid var(--border);
    display: flex; flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;
    transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.35s cubic-bezier(0.4, 0, 0.2, 1), border-left-width 0.35s;
  }
  .ai-side-panel.open {
    width: 360px;
    min-width: 360px;
    border-left-width: 1px;
  }
  .ai-panel-header {
    padding: 20px 20px 16px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
    background: linear-gradient(180deg, var(--bg-card), var(--bg-panel));
  }
  .ai-panel-body {
    flex: 1; display: flex; flex-direction: column;
    padding: 16px;
    overflow: hidden;
    min-height: 0;
  }
  .ai-fab {
    position: fixed; bottom: 28px; right: 28px;
    width: 52px; height: 52px;
    background: var(--gradient);
    border: none; border-radius: 50%;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    box-shadow: 0 8px 32px #4f8ef750, 0 0 0 0 var(--cyan-glow);
    transition: transform 0.2s, box-shadow 0.2s;
    z-index: 48;
    animation: fabPulse 3s ease-in-out infinite;
  }
  .ai-fab:hover { transform: scale(1.1); box-shadow: 0 12px 40px #4f8ef780; }
  .ai-fab.open { transform: rotate(45deg) scale(1.05); animation: none; }

  /* ── Action Card ── */
  .action-card {
    background: var(--bg-panel);
    border: 1px solid var(--amber-dim);
    border-radius: var(--radius);
    padding: 16px 18px;
    margin-bottom: 10px;
    animation: fadeUp 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .action-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--amber-dim), transparent);
  }

  /* ── Badges ── */
  .badge {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 2px 8px; border-radius: var(--radius-xs);
    font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
  }
  .badge-green { background: var(--green-dim); color: var(--green); border: 1px solid #00e5a025; }
  .badge-amber { background: var(--amber-dim); color: var(--amber); border: 1px solid #ffb54725; }
  .badge-red { background: var(--red-dim); color: var(--red); border: 1px solid #ff5c5c25; }
  .badge-blue { background: var(--purple-dim); color: var(--purple); border: 1px solid #a78bfa25; }
  .badge-cyan { background: var(--cyan-dim); color: var(--cyan); border: 1px solid #00d4ff25; }

  /* ── Dots ── */
  .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .dot-green { background: var(--green); box-shadow: 0 0 8px var(--green); }
  .dot-amber { background: var(--amber); box-shadow: 0 0 8px var(--amber); }
  .dot-cyan { background: var(--cyan); box-shadow: 0 0 8px var(--cyan); }

  /* ── Table ── */
  .data-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  .data-table th { padding: 8px 0; color: var(--text-muted); font-weight: 600; text-align: left; border-bottom: 1px solid var(--border); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
  .data-table td { padding: 11px 0; border-bottom: 1px solid var(--border); color: var(--text-dim); vertical-align: middle; }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr { transition: background 0.15s; }
  .data-table tr:hover td { background: var(--bg-hover); }

  /* ── Pill Button ── */
  .pill-btn {
    padding: 7px 14px; background: var(--bg-panel);
    border: 1px solid var(--border); border-radius: var(--radius-sm);
    color: var(--text-muted); font-size: 12px; cursor: pointer; font-family: var(--font);
    transition: all 0.15s; font-weight: 500;
  }
  .pill-btn:hover { border-color: var(--border-bright); color: var(--text-dim); background: var(--bg-hover); }

  /* ── Notif ── */
  .notif-btn {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 8px 11px;
    cursor: pointer; color: var(--text-dim); font-size: 15px;
    position: relative; transition: border-color 0.2s, background 0.2s; line-height: 1;
  }
  .notif-btn:hover { border-color: var(--border-bright); background: var(--bg-hover); }
  .notif-btn.has-alerts { border-color: var(--red); box-shadow: 0 0 12px var(--red-dim); }
  .notif-dropdown {
    position: absolute; top: 48px; right: 0;
    width: 340px; background: var(--bg-card);
    border: 1px solid var(--border); border-radius: var(--radius);
    padding: 16px; z-index: 100;
    box-shadow: 0 16px 48px #00000080;
    animation: fadeUp 0.2s ease;
  }

  /* ── Upload Zone ── */
  .upload-zone {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 32px; border: 2px dashed var(--border); border-radius: var(--radius);
    cursor: pointer; gap: 8px; transition: border-color 0.2s, background 0.2s;
  }
  .upload-zone:hover { border-color: var(--cyan); background: var(--cyan-dim); }

  /* ── SEO ── */
  .seo-score-ring {
    width: 80px; height: 80px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: 800;
    position: relative;
    flex-shrink: 0;
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  /* ── Animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes typingPulse {
    0%, 60%, 100% { transform: scale(1); opacity: 0.3; }
    30% { transform: scale(1.5); opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes fabPulse {
    0%, 100% { box-shadow: 0 8px 32px #4f8ef750, 0 0 0 0 var(--cyan-glow); }
    50% { box-shadow: 0 8px 32px #4f8ef750, 0 0 0 8px transparent; }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes glowPulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }

  .pulse { animation: pulse 2s ease-in-out infinite; }
  .page-anim { animation: fadeUp 0.35s ease; }

  /* ── Stat Row ── */
  .stat-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 12px; background: var(--bg); border-radius: var(--radius-sm);
    border: 1px solid var(--border); transition: border-color 0.15s;
  }
  .stat-row:hover { border-color: var(--border-bright); }

  /* ── Quick suggestion chips ── */
  .chip {
    padding: 6px 12px; background: var(--bg);
    border: 1px solid var(--border); border-radius: 20px;
    color: var(--text-muted); font-size: 11.5px; cursor: pointer;
    transition: all 0.15s; font-family: var(--font); white-space: nowrap;
  }
  .chip:hover { border-color: var(--cyan); color: var(--cyan); background: var(--cyan-dim); }
`;

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { id: 'shopify', label: 'Shopify', icon: '🛍' },
  { id: 'meta', label: 'Meta Ads', icon: '𝕄' },
  { id: 'tiktok', label: 'TikTok Ads', icon: '♪' },
  { id: 'seo', label: 'SEO', icon: '◎' },
];

const revenueData = [
  { dag: 'Ma', omzet: 45 }, { dag: 'Di', omzet: 82 }, { dag: 'Wo', omzet: 61 },
  { dag: 'Do', omzet: 120 }, { dag: 'Vr', omzet: 95 }, { dag: 'Za', omzet: 148 }, { dag: 'Zo', omzet: 110 },
];

function renderMessage(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text)">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:var(--text-dim)">$1</em>')
    .replace(/^### (.+)$/gm, '<div style="font-weight:600;color:var(--cyan);margin:8px 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em">$1</div>')
    .replace(/^## (.+)$/gm, '<div style="font-weight:700;color:var(--text);margin:10px 0 4px;font-size:13px">$1</div>')
    .replace(/^- (.+)$/gm, '<div style="padding:3px 0 3px 10px;border-left:2px solid var(--border-bright);margin:3px 0;color:var(--text-dim)">$1</div>')
    .replace(/^\d+\. (.+)$/gm, '<div style="padding:3px 0 3px 10px;border-left:2px solid var(--cyan-dim);margin:3px 0;color:var(--text-dim)">$1</div>')
    .replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
}

function KpiCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon?: string }) {
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div className="kpi-label">{label}</div>
        {icon && <span style={{ fontSize: 16, opacity: 0.4 }}>{icon}</span>}
      </div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub" style={{ color }}>{sub}</div>}
    </div>
  );
}

interface AIAction { id: string; description: string; action: string; payload: any; status: 'pending' | 'approved' | 'rejected' | 'executed'; }

function ActionCard({ action, onApprove, onReject }: { action: AIAction; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="action-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div className="dot dot-amber pulse" />
        <span style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Voorstel</span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.65 }}
        dangerouslySetInnerHTML={{ __html: renderMessage(action.description) }} />
      {action.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onApprove} style={{ padding: '7px 14px', background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid #00e5a025', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, fontFamily: 'var(--font)', transition: 'all 0.15s' }}>
            ✓ Goedkeuren
          </button>
          <button onClick={onReject} style={{ padding: '7px 14px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid #ff5c5c25', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, fontFamily: 'var(--font)', transition: 'all 0.15s' }}>
            ✕ Afwijzen
          </button>
        </div>
      )}
      {action.status === 'executed' && <span className="badge badge-green">✓ Uitgevoerd</span>}
      {action.status === 'rejected' && <span className="badge badge-red">✕ Afgewezen</span>}
    </div>
  );
}

function ChatBox({ messages, input, setInput, send, loading, chatRef, maxHeight = 400 }: any) {
  const suggestions = ['Analyseer mijn data', 'Hoe verhoog ik mijn ROAS?', 'Welke campagne presteert het beste?'];
  return (
    <div className="chat-wrap" style={{ minHeight: 0 }}>
      <div className="chat-messages" ref={chatRef} style={{ maxHeight, minHeight: 120 }}>
        {messages.map((m: any, i: number) => (
          <div key={i} className={`msg-bubble ${m.role}`}
            dangerouslySetInnerHTML={{ __html: renderMessage(m.content) }} />
        ))}
        {loading && (
          <div className="msg-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '12px 14px' }}>
            <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
          </div>
        )}
      </div>
      {messages.length <= 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {suggestions.map(s => (
            <button key={s} className="chip" onClick={() => setInput(s)}>{s}</button>
          ))}
        </div>
      )}
      <div className="chat-input-row">
        <input className="chat-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && send()}
          placeholder="Vraag de AI..." />
        <button className="chat-send" onClick={send} disabled={loading || !input.trim()}>
          {loading ? '...' : '↑'}
        </button>
      </div>
    </div>
  );
}

function SEOPage() {
  const [seoData, setSeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch('/api/seo').then(r => r.json()).then(d => { setSeoData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  const scoreColor = !seoData ? 'var(--text-muted)' : seoData.score >= 80 ? 'var(--green)' : seoData.score >= 60 ? 'var(--amber)' : 'var(--red)';
  return (
    <div className="page-anim">
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 13 }}>
          <div className="dot dot-cyan pulse" /> SEO scan bezig...
        </div>
      )}
      {seoData && !loading && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
            <div className="kpi-card" style={{ borderColor: `${scoreColor}40` }}>
              <div className="kpi-label">SEO Score</div>
              <div style={{ fontSize: 42, fontWeight: 800, color: scoreColor, letterSpacing: '-0.04em', lineHeight: 1 }}>{seoData.score}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>/100 punten</div>
            </div>
            <KpiCard label="Pagina's gescand" value={String(seoData.totalPages)} sub="Producten + collecties" color="var(--purple)" />
            <KpiCard label="Kritieke problemen" value={String(seoData.highCount)} sub="Hoge prioriteit" color="var(--red)" />
            <KpiCard label="Waarschuwingen" value={String(seoData.mediumCount)} sub="Medium prioriteit" color="var(--amber)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div className="dot dot-green" />
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Laatste scan: {new Date(seoData.lastScanned).toLocaleString('nl-NL')}</span>
            <button className="pill-btn" style={{ fontSize: 11, padding: '4px 10px' }}
              onClick={() => { setLoading(true); fetch('/api/seo').then(r => r.json()).then(d => { setSeoData(d); setLoading(false); }); }}>
              ↻ Opnieuw scannen
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
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{p.page_title}</span>
                  </div>
                  <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--cyan)', textDecoration: 'none', opacity: 0.8 }}>Bekijk →</a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {p.issues.map((issue: any, j: number) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <span className={`badge ${issue.severity === 'hoog' ? 'badge-red' : 'badge-amber'}`} style={{ flexShrink: 0, marginTop: 1 }}>
                        {issue.severity === 'hoog' ? 'Hoog' : 'Medium'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, lineHeight: 1.6 }}>{issue.message}</span>
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

export default function Dashboard() {
  const [page, setPage] = useState('dashboard');
  const [aiOpen, setAiOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hoi! Ik ben je CryoWipes AI manager. Ik kan je data analyseren, inzichten geven en acties voorstellen die jij kan goedkeuren.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [shopifyData, setShopifyData] = useState<any>(null);
  const [metaData, setMetaData] = useState<any>(null);
  const [pendingActions, setPendingActions] = useState<AIAction[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const chatRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      fetch('/api/shopify').then(r => r.json()).then(setShopifyData).catch(() => {});
      fetch('/api/meta').then(r => r.json()).then(setMetaData).catch(() => {});
      fetch('/api/notifications').then(r => r.json()).then(d => setNotifications(d.notifications || [])).catch(() => {});
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, aiOpen]);

  async function handleUpload(file: File) {
    setUploading(true); setUploadFileName(file.name);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setUploadedImageUrl(data.url);
      else alert('Upload mislukt: ' + data.error);
    } catch { alert('Upload mislukt'); }
    setUploading(false);
  }

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
    setMessages(msgs); setInput(''); setLoading(true);
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
  const metaAmountSpent = metaData?.amount_spent || '0.00';
  const pendingCount = pendingActions.filter(a => a.status === 'pending').length;
  const alertCount = notifications.filter(n => n.severity !== 'info').length;

  return (
    <>
      <style>{css}</style>
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <div className="sidebar">
          {/* Logo */}
          <div style={{ padding: '22px 18px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: 'var(--gradient)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, boxShadow: '0 4px 16px #4f8ef740' }}>❄</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>CryoWipes</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: 1, letterSpacing: '0.05em' }}>AI DASHBOARD</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '12px 10px', flex: 1 }}>
            {NAV.map(n => (
              <button key={n.id} className={`nav-btn ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
                <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>

          {/* AI button in sidebar */}
          <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => setAiOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', background: 'var(--gradient-glow)', border: '1px solid var(--cyan-dim)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--cyan)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)', transition: 'all 0.2s', position: 'relative' }}>
              <span>◈</span>
              <span>AI Agent</span>
              {pendingCount > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--amber)', color: '#000', borderRadius: 20, minWidth: 18, height: 18, padding: '0 5px', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* Status */}
          <div style={{ padding: '12px 18px 16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: 6, letterSpacing: '0.03em' }}>cryowipes.store</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="dot dot-green pulse" />
              <span style={{ fontSize: 11.5, color: 'var(--green)', fontWeight: 600 }}>Systemen actief</span>
            </div>
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-panel)', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {NAV.find(n => n.id === page)?.label || 'Dashboard'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Realtime overzicht · vernieuwt elke 30s</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px' }}>
                <div className="dot dot-green" />
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>Live</span>
              </div>
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button className={`notif-btn ${alertCount > 0 ? 'has-alerts' : ''}`} onClick={() => setShowNotifications(!showNotifications)}>
                  🔔
                  {alertCount > 0 && (
                    <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--red)', color: '#fff', borderRadius: '50%', width: 17, height: 17, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, border: '2px solid var(--bg-panel)' }}>
                      {alertCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="notif-dropdown">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Notificaties</span>
                      {alertCount > 0 && <span className="badge badge-red">{alertCount} alert{alertCount > 1 ? 's' : ''}</span>}
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>✓ Geen meldingen</div>
                    ) : (
                      notifications.map((n, i) => (
                        <div key={i} style={{ padding: '10px 12px', background: 'var(--bg)', border: `1px solid ${n.severity === 'critical' ? 'var(--red)' : n.severity === 'warning' ? 'var(--amber)' : 'var(--green)'}30`, borderRadius: 'var(--radius-sm)', marginBottom: i < notifications.length - 1 ? 8 : 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: n.severity === 'critical' ? 'var(--red)' : n.severity === 'warning' ? 'var(--amber)' : 'var(--green)' }}>{n.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

            {/* ── DASHBOARD ── */}
            {page === 'dashboard' && (
              <div className="page-anim">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
                  <KpiCard label="Totale omzet" value={`$${revenue}`} sub={`↑ ${orders} orders`} color="var(--green)" icon="💰" />
                  <KpiCard label="Orders" value={String(orders)} sub="Laatste 7 dagen" color="var(--green)" icon="📦" />
                  <KpiCard label="Gem. orderwaarde" value={`$${aov}`} sub="AOV" color="var(--cyan)" icon="📊" />
                  <KpiCard label="Meta Spend" value={`$${metaSpend}`} sub={`${Number(metaImpressions).toLocaleString()} impressies`} color="var(--amber)" icon="📣" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 16 }}>
                  <div className="panel">
                    <div className="panel-title">📈 Omzet deze week</div>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="dag" stroke="var(--border)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <YAxis stroke="var(--border)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text)' }} />
                        <Area type="monotone" dataKey="omzet" stroke="var(--cyan)" strokeWidth={2} fill="url(#grad1)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="panel">
                    <div className="panel-title">Meta Ads vandaag</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'Spend', value: `$${metaSpend}`, color: 'var(--amber)' },
                        { label: 'Impressies', value: Number(metaImpressions).toLocaleString(), color: 'var(--purple)' },
                        { label: 'Clicks', value: metaClicks, color: 'var(--cyan)' },
                        { label: 'CTR', value: metaData?.ctr ? `${parseFloat(metaData.ctr).toFixed(2)}%` : '0%', color: 'var(--green)' },
                      ].map(s => (
                        <div key={s.label} className="stat-row">
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{s.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Pending actions on dashboard */}
                {pendingCount > 0 && (
                  <div className="panel" style={{ borderColor: 'var(--amber-dim)', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <div className="dot dot-amber pulse" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Openstaande AI acties</span>
                      <span className="badge badge-amber">{pendingCount} wachtend</span>
                    </div>
                    {pendingActions.filter(a => a.status === 'pending').map(a => (
                      <ActionCard key={a.id} action={a} onApprove={() => approveAction(a.id)} onReject={() => rejectAction(a.id)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── SHOPIFY ── */}
            {page === 'shopify' && (
              <div className="page-anim">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 18 }}>
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
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00e5a0" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#00e5a0" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="dag" stroke="var(--border)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <YAxis stroke="var(--border)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text)' }} />
                        <Area type="monotone" dataKey="omzet" stroke="var(--green)" strokeWidth={2} fill="url(#grad2)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="panel">
                    <div className="panel-title">Snelle links</div>
                    {[
                      { label: 'Orders beheren', url: 'https://admin.shopify.com/store/cryowipes/orders', icon: '📦' },
                      { label: 'Producten', url: 'https://admin.shopify.com/store/cryowipes/products', icon: '🛍' },
                      { label: 'Klanten', url: 'https://admin.shopify.com/store/cryowipes/customers', icon: '👥' },
                    ].map(l => (
                      <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none', transition: 'color 0.15s', gap: 8 }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}>
                        <span>{l.icon} {l.label}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>↗</span>
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
                            <td style={{ color: 'var(--text)', fontWeight: 500 }}>{p.title}</td>
                            <td style={{ color: 'var(--cyan)', fontWeight: 700, fontFamily: 'var(--mono)', fontSize: 12 }}>${p.price}</td>
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
                            <td style={{ fontSize: 11 }}>{o.date}</td>
                            <td style={{ color: 'var(--text)', fontWeight: 600 }}>${o.total}</td>
                            <td><span className={`badge ${o.status === 'fulfilled' ? 'badge-green' : 'badge-amber'}`}>{o.status === 'fulfilled' ? 'Verzonden' : 'In behandeling'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── META ADS ── */}
            {page === 'meta' && (
              <div className="page-anim">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 18 }}>
                  <KpiCard label="Spend" value={`$${metaSpend}`} sub="7 dagen" color="var(--amber)" icon="💸" />
                  <KpiCard label="Impressies" value={Number(metaImpressions).toLocaleString()} sub="7 dagen" color="var(--purple)" icon="👁" />
                  <KpiCard label="Clicks" value={metaClicks} sub="7 dagen" color="var(--cyan)" icon="🖱" />
                  <KpiCard label="CTR" value={metaData?.ctr ? `${parseFloat(metaData.ctr).toFixed(2)}%` : '0%'} sub="Click-through" color="var(--green)" icon="📊" />
                  <KpiCard label="CPC" value={metaData?.cpc ? `$${parseFloat(metaData.cpc).toFixed(2)}` : '$0'} sub="Kosten/klik" color="var(--amber)" icon="💡" />
                  <KpiCard label="All-time spend" value={`$${metaAmountSpent}`} sub="Totaal" color="var(--amber)" icon="📈" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="panel">
                    <div className="panel-title">Prestaties over tijd</div>
                    <ResponsiveContainer width="100%" height={190}>
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="grad3" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="dag" stroke="var(--border)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <YAxis stroke="var(--border)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text)' }} />
                        <Area type="monotone" dataKey="omzet" stroke="var(--purple)" strokeWidth={2} fill="url(#grad3)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="panel">
                    <div className="panel-title">Account overzicht</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                      {[
                        { label: 'Spend', value: `$${metaSpend}`, color: 'var(--amber)' },
                        { label: 'Impressies', value: Number(metaImpressions).toLocaleString(), color: 'var(--purple)' },
                        { label: 'Clicks', value: metaClicks, color: 'var(--cyan)' },
                        { label: 'CTR', value: metaData?.ctr ? `${parseFloat(metaData.ctr).toFixed(2)}%` : '0%', color: 'var(--green)' },
                      ].map(s => (
                        <div key={s.label} className="stat-row">
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{s.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                    <a href="https://adsmanager.facebook.com" target="_blank" rel="noreferrer"
                      style={{ display: 'block', padding: '9px 12px', background: 'var(--gradient-glow)', border: '1px solid var(--cyan-dim)', borderRadius: 'var(--radius-sm)', color: 'var(--cyan)', fontSize: 12, textDecoration: 'none', textAlign: 'center', fontWeight: 600, transition: 'all 0.15s' }}>
                      Open Meta Ads Manager ↗
                    </a>
                  </div>
                </div>
                <div className="panel" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div className="panel-title" style={{ margin: 0 }}>Campagnes</div>
                    <a href="https://adsmanager.facebook.com" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--cyan)', textDecoration: 'none', fontWeight: 500 }}>Bekijk alle →</a>
                  </div>
                  {metaData?.campaigns?.length > 0 ? (
                    <table className="data-table">
                      <thead><tr>{['Campagne', 'Status', 'Budget', 'Actie'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {metaData.campaigns.map((c: any) => (
                          <tr key={c.id}>
                            <td style={{ color: 'var(--text)', fontWeight: 600 }}>{c.name}</td>
                            <td><span className={`badge ${c.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'}`}>{c.status === 'ACTIVE' ? 'Actief' : 'Gepauzeerd'}</span></td>
                            <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>{c.daily_budget ? `$${(parseInt(c.daily_budget) / 100).toFixed(2)}/dag` : 'Lifetime'}</td>
                            <td><button className="pill-btn" style={{ fontSize: 11, padding: '4px 10px' }}>{c.status === 'ACTIVE' ? 'Pauzeer' : 'Hervat'}</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Geen campagnes gevonden.</div>
                  )}
                </div>
                {/* Upload */}
                <div className="panel">
                  <div className="panel-title">📸 Campagne Visual uploaden</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {!uploadedImageUrl ? (
                      <label className="upload-zone">
                        <span style={{ fontSize: 28 }}>{uploading ? '⏳' : '📁'}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>
                          {uploading ? 'Uploaden...' : 'Klik om afbeelding of video te uploaden'}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>JPG, PNG, MP4 — max 100MB</span>
                        <input type="file" accept="image/*,video/*" style={{ display: 'none' }} disabled={uploading}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                      </label>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', background: 'var(--bg)', border: '1px solid var(--green-dim)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: 22 }}>✅</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 2 }}>Visual geüpload!</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{uploadFileName}</div>
                        </div>
                        <button className="pill-btn" style={{ fontSize: 11 }} onClick={() => { setUploadedImageUrl(null); setUploadFileName(''); }}>Verwijder</button>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        const prompt = uploadedImageUrl
                          ? `Maak een Meta campagne aan voor CryoWipes met deze afbeelding URL: ${uploadedImageUrl}. Landingspagina: https://cryowipes.store/products/cryo-wipe-box. Budget: $20/dag. Targeting: USA en Canada, 18-45 jaar.`
                          : 'Maak een Meta campagne aan voor CryoWipes. Landingspagina: https://cryowipes.store/products/cryo-wipe-box. Budget: $20/dag. Targeting: USA en Canada, 18-45 jaar.';
                        setInput(prompt);
                        setAiOpen(true);
                      }}
                      style={{ padding: '12px', background: 'var(--gradient)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font)', boxShadow: '0 4px 16px #4f8ef730', transition: 'all 0.2s' }}>
                      ◈ {uploadedImageUrl ? 'AI campagne aanmaken met deze visual' : 'AI campagne aanmaken'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {page === 'seo' && <SEOPage />}

            {page !== 'dashboard' && page !== 'shopify' && page !== 'meta' && page !== 'seo' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)', fontSize: 14, gap: 12 }}>
                <span style={{ fontSize: 40, opacity: 0.2 }}>{NAV.find(n => n.id === page)?.icon}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-dim)' }}>{NAV.find(n => n.id === page)?.label}</span>
                <span style={{ fontSize: 12 }}>Komt binnenkort beschikbaar</span>
              </div>
            )}
          </div>
        </div>

        {/* ── AI Side Panel ── */}
        <div className={`ai-side-panel ${aiOpen ? 'open' : ''}`}>
          <div style={{ width: 360, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
          {/* Header */}
          <div className="ai-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: 'var(--gradient)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, boxShadow: '0 4px 12px #4f8ef740' }}>◈</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>AI Agent</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                  <div className="dot dot-cyan pulse" style={{ width: 5, height: 5 }} />
                  <span style={{ fontSize: 10, color: 'var(--cyan)', fontWeight: 500 }}>Online</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {pendingCount > 0 && <span className="badge badge-amber">{pendingCount} actie{pendingCount > 1 ? 's' : ''}</span>}
              <button onClick={() => setAiOpen(false)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1, transition: 'all 0.15s', fontFamily: 'var(--font)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-bright)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
                ✕
              </button>
            </div>
          </div>

          {/* Pending actions in panel */}
          {pendingActions.filter(a => a.status === 'pending').length > 0 && (
            <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Openstaande acties</div>
              {pendingActions.filter(a => a.status === 'pending').map(a => (
                <ActionCard key={a.id} action={a} onApprove={() => approveAction(a.id)} onReject={() => rejectAction(a.id)} />
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '12px 0 0' }} />
            </div>
          )}

          {/* Chat */}
          <div className="ai-panel-body">
            <ChatBox
              messages={messages}
              input={input}
              setInput={setInput}
              send={send}
              loading={loading}
              chatRef={chatRef}
              maxHeight={9999}
            />
          </div>
          </div>
        </div>

        {/* ── Floating AI Button ── */}
        <button className={`ai-fab ${aiOpen ? 'open' : ''}`} onClick={() => setAiOpen(!aiOpen)} title={aiOpen ? 'AI Agent sluiten' : 'AI Agent openen'}>
          {aiOpen ? '✕' : '◈'}
          {!aiOpen && pendingCount > 0 && (
            <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--amber)', color: '#000', borderRadius: '50%', width: 18, height: 18, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, border: '2px solid var(--bg)' }}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
}

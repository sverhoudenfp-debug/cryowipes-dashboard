'use client';
import { useState, useEffect, useRef } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #05070c;
    --bg-2: #070a11;
    --panel-solid: #0b0f18;
    --glass: rgba(255,255,255,0.028);
    --glass-2: rgba(255,255,255,0.045);
    --hairline: rgba(255,255,255,0.06);
    --border: rgba(255,255,255,0.085);
    --border-strong: rgba(255,255,255,0.16);
    --text: #f3f6fb;
    --text-dim: #9aa6bb;
    --text-muted: #586176;
    --frost: #5fd8ff;
    --frost-2: #4f9bff;
    --frost-soft: rgba(95,216,255,0.10);
    --frost-line: rgba(95,216,255,0.22);
    --frost-glow: rgba(95,216,255,0.28);
    --green: #2fe0a8;
    --green-soft: rgba(47,224,168,0.12);
    --amber: #ffb84d;
    --amber-soft: rgba(255,184,77,0.12);
    --rose: #ff6b7d;
    --rose-soft: rgba(255,107,125,0.12);
    --violet: #a78bfa;
    --violet-soft: rgba(167,139,250,0.12);
    --grad: linear-gradient(135deg, #6ee7ff 0%, #4f9bff 100%);
    --grad-soft: linear-gradient(135deg, rgba(110,231,255,0.14), rgba(79,155,255,0.06));
    --font: 'Inter', system-ui, sans-serif;
    --display: 'Space Grotesk', 'Inter', sans-serif;
    --mono: 'JetBrains Mono', monospace;
    --r: 18px; --r-md: 13px; --r-sm: 9px; --r-xs: 6px;
    --shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 50px -20px rgba(0,0,0,0.6);
  }
  body { background: var(--bg); font-family: var(--font); color: var(--text); overflow: hidden; -webkit-font-smoothing: antialiased; }

  /* ambient cold atmosphere */
  .atmos { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
  .atmos::before { content: ''; position: absolute; top: -12%; right: -6%; width: 520px; height: 520px; background: radial-gradient(circle, var(--frost-glow), transparent 65%); filter: blur(50px); opacity: 0.5; }
  .atmos::after { content: ''; position: absolute; bottom: -14%; left: 16%; width: 480px; height: 480px; background: radial-gradient(circle, rgba(79,155,255,0.16), transparent 65%); filter: blur(60px); opacity: 0.6; }

  /* glass surface */
  .glass {
    background: linear-gradient(180deg, var(--glass-2), var(--glass));
    border: 1px solid var(--border);
    border-radius: var(--r);
    backdrop-filter: blur(20px) saturate(150%);
    -webkit-backdrop-filter: blur(20px) saturate(150%);
    box-shadow: var(--shadow);
    position: relative; overflow: hidden;
  }
  .glass::before { content: ''; position: absolute; top: 0; left: 14px; right: 14px; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent); }

  .sidebar { width: 224px; background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent 40%), var(--bg-2); border-right: 1px solid var(--hairline); display: flex; flex-direction: column; flex-shrink: 0; position: relative; z-index: 10; }
  .brand-mark { width: 38px; height: 38px; background: var(--grad); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; box-shadow: 0 6px 20px rgba(79,155,255,0.35), 0 0 0 1px rgba(255,255,255,0.1) inset; }
  .nav-btn { display: flex; align-items: center; gap: 11px; width: 100%; padding: 9px 12px; border-radius: var(--r-md); border: none; cursor: pointer; background: transparent; color: var(--text-muted); font-weight: 500; font-size: 13px; font-family: var(--font); text-align: left; transition: color .18s, background .18s; margin-bottom: 2px; position: relative; }
  .nav-btn:hover { color: var(--text-dim); background: var(--glass); }
  .nav-btn.active { color: var(--text); background: var(--glass-2); box-shadow: inset 0 0 0 1px var(--border); }
  .nav-btn.active .nav-ico { color: var(--frost); }
  .nav-btn.active::before { content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 2.5px; border-radius: 3px; background: var(--frost); box-shadow: 0 0 10px var(--frost-glow); }
  .nav-ico { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; color: var(--text-muted); transition: color .18s; }

  .kpi { padding: 18px 18px 16px; min-width: 0; cursor: default; transition: transform .25s cubic-bezier(.2,.7,.3,1), border-color .25s; }
  .kpi:hover { transform: translateY(-3px); border-color: var(--border-strong); }
  .kpi-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .kpi-label { font-size: 10.5px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; }
  .kpi-ico { width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; background: var(--glass-2); border: 1px solid var(--hairline); }
  .kpi-value { font-family: var(--display); font-size: 27px; font-weight: 600; letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; }
  .kpi-sub { font-size: 11px; margin-top: 9px; font-weight: 600; display: flex; align-items: center; gap: 5px; font-variant-numeric: tabular-nums; }

  .panel { padding: 20px; }
  .panel-title { font-size: 12.5px; font-weight: 600; color: var(--text); margin-bottom: 18px; letter-spacing: -0.01em; display: flex; align-items: center; gap: 8px; }
  .panel-title .ey { font-size: 9.5px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; margin-left: auto; }

  .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 13px; background: var(--glass); border-radius: var(--r-sm); border: 1px solid var(--hairline); transition: border-color .15s; }
  .stat-row:hover { border-color: var(--border); }
  .stat-val { font-size: 14px; font-weight: 600; font-family: var(--mono); font-variant-numeric: tabular-nums; }

  .chip { padding: 6px 12px; background: var(--glass); border: 1px solid var(--border); border-radius: 20px; color: var(--text-dim); font-size: 11.5px; cursor: pointer; transition: all .15s; font-family: var(--font); white-space: nowrap; }
  .chip:hover { border-color: var(--frost-line); color: var(--frost); background: var(--frost-soft); }
  .pill-btn { padding: 6px 13px; background: var(--glass); border: 1px solid var(--border); border-radius: var(--r-sm); color: var(--text-dim); font-size: 11.5px; cursor: pointer; font-family: var(--font); transition: all .15s; font-weight: 500; }
  .pill-btn:hover { border-color: var(--border-strong); color: var(--text); background: var(--glass-2); }

  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: var(--r-xs); font-size: 10px; font-weight: 700; letter-spacing: 0.03em; font-family: var(--mono); }
  .badge-green { background: var(--green-soft); color: var(--green); box-shadow: inset 0 0 0 1px rgba(47,224,168,0.2); }
  .badge-amber { background: var(--amber-soft); color: var(--amber); box-shadow: inset 0 0 0 1px rgba(255,184,77,0.2); }
  .badge-red { background: var(--rose-soft); color: var(--rose); box-shadow: inset 0 0 0 1px rgba(255,107,125,0.2); }
  .badge-blue { background: var(--violet-soft); color: var(--violet); box-shadow: inset 0 0 0 1px rgba(167,139,250,0.2); }
  .badge-cyan { background: var(--frost-soft); color: var(--frost); box-shadow: inset 0 0 0 1px var(--frost-line); }

  .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .dot-green { background: var(--green); box-shadow: 0 0 8px var(--green); }
  .dot-amber { background: var(--amber); box-shadow: 0 0 8px var(--amber); }
  .dot-cyan { background: var(--frost); box-shadow: 0 0 8px var(--frost); }

  .data-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  .data-table th { padding: 0 0 11px; color: var(--text-muted); font-weight: 700; text-align: left; border-bottom: 1px solid var(--hairline); font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.09em; }
  .data-table td { padding: 12px 0; border-bottom: 1px solid var(--hairline); color: var(--text-dim); vertical-align: middle; }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tbody tr { transition: background .15s; }
  .data-table tbody tr:hover td { background: var(--glass); }
  .num { font-family: var(--mono); font-variant-numeric: tabular-nums; }

  .topbar-btn { display: flex; align-items: center; gap: 7px; background: var(--glass); border: 1px solid var(--border); border-radius: var(--r-sm); padding: 7px 12px; cursor: pointer; color: var(--text-dim); font-size: 12px; font-family: var(--font); font-weight: 600; transition: all .15s; white-space: nowrap; }
  .topbar-btn:hover { border-color: var(--border-strong); color: var(--text); }
  .topbar-btn.active { border-color: var(--frost-line); color: var(--frost); background: var(--frost-soft); }

  .date-dropdown { position: absolute; top: calc(100% + 8px); right: 0; background: var(--panel-solid); border: 1px solid var(--border); border-radius: var(--r-md); overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.6); z-index: 200; min-width: 168px; backdrop-filter: blur(20px); }
  .date-option { display: flex; align-items: center; gap: 9px; padding: 10px 14px; font-size: 12.5px; font-family: var(--font); color: var(--text-dim); cursor: pointer; border: none; background: transparent; width: 100%; text-align: left; transition: background .1s, color .1s; font-weight: 500; }
  .date-option:hover { background: var(--glass-2); color: var(--text); }
  .date-option.selected { color: var(--frost); background: var(--frost-soft); }
  .date-option + .date-option { border-top: 1px solid var(--hairline); }

  .notif-btn { background: var(--glass); border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px 10px; cursor: pointer; color: var(--text-dim); font-size: 14px; position: relative; transition: all .2s; line-height: 1; }
  .notif-btn:hover { border-color: var(--border-strong); color: var(--text); }
  .notif-btn.has-alerts { border-color: var(--rose); box-shadow: 0 0 14px var(--rose-soft); }
  .notif-dropdown { position: absolute; top: 46px; right: 0; width: 336px; background: var(--panel-solid); border: 1px solid var(--border); border-radius: var(--r-md); padding: 15px; z-index: 200; box-shadow: 0 24px 60px rgba(0,0,0,0.7); backdrop-filter: blur(20px); animation: pop .18s ease; }

  .chat-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 4px 2px; }
  .msg-bubble { padding: 11px 14px; border-radius: 13px; font-size: 12.5px; line-height: 1.7; max-width: 90%; animation: rise .22s ease; }
  .msg-bubble.assistant { background: var(--glass-2); border: 1px solid var(--hairline); align-self: flex-start; color: var(--text-dim); border-radius: 4px 13px 13px 13px; }
  .msg-bubble.user { background: var(--grad); color: #04121c; align-self: flex-end; border-radius: 13px 13px 4px 13px; font-weight: 600; box-shadow: 0 6px 18px rgba(79,155,255,0.3); }
  .typing-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--frost); display: inline-block; margin: 0 2px; animation: typing 1.2s ease-in-out infinite; }
  .typing-dot:nth-child(2) { animation-delay: .2s; } .typing-dot:nth-child(3) { animation-delay: .4s; }
  .chat-input { flex: 1; padding: 11px 14px; background: var(--glass); color: var(--text); border: 1px solid var(--border); border-radius: var(--r-sm); font-size: 12.5px; font-family: var(--font); outline: none; transition: border-color .2s, box-shadow .2s; }
  .chat-input:focus { border-color: var(--frost-line); box-shadow: 0 0 0 3px var(--frost-soft); }
  .chat-input::placeholder { color: var(--text-muted); }
  .chat-send { padding: 11px 15px; background: var(--grad); color: #04121c; border: none; border-radius: var(--r-sm); cursor: pointer; font-weight: 700; font-size: 13px; font-family: var(--font); transition: opacity .2s, transform .1s; box-shadow: 0 6px 18px rgba(79,155,255,0.3); }
  .chat-send:hover { opacity: .92; } .chat-send:active { transform: scale(.96); } .chat-send:disabled { opacity: .35; cursor: not-allowed; }

  .ai-side-panel { width: 0; min-width: 0; background: var(--bg-2); border-left: 0 solid var(--hairline); display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0; transition: width .38s cubic-bezier(.4,0,.2,1), min-width .38s cubic-bezier(.4,0,.2,1), border-left-width .38s; position: relative; z-index: 20; }
  .ai-side-panel.open { width: 372px; min-width: 372px; border-left-width: 1px; }
  .ai-fab { position: fixed; bottom: 26px; right: 26px; width: 54px; height: 54px; background: var(--grad); border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 21px; color: #04121c; box-shadow: 0 10px 34px rgba(79,155,255,0.5), 0 0 0 1px rgba(255,255,255,0.12) inset; transition: transform .2s; z-index: 48; }
  .ai-fab:hover { transform: scale(1.08); }

  .action-card { background: var(--glass); border: 1px solid var(--amber-soft); border-radius: var(--r-md); padding: 15px 16px; margin-bottom: 10px; animation: rise .3s ease; position: relative; overflow: hidden; }
  .action-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2.5px; background: var(--amber); box-shadow: 0 0 10px var(--amber-soft); }

  .upload-zone { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px; border: 1.5px dashed var(--border); border-radius: var(--r-md); cursor: pointer; gap: 8px; transition: border-color .2s, background .2s; }
  .upload-zone:hover { border-color: var(--frost-line); background: var(--frost-soft); }

  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 320px; gap: 14px; }
  .empty-ico { width: 64px; height: 64px; border-radius: 18px; background: var(--glass-2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 28px; opacity: 0.7; }

  ::-webkit-scrollbar { width: 5px; height: 5px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; } ::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }

  @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pop { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes typing { 0%,60%,100% { transform: scale(1); opacity: .3; } 30% { transform: scale(1.5); opacity: 1; } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
  .pulse { animation: pulse 2.2s ease-in-out infinite; }
  .page-anim { animation: rise .4s ease; }
  .page-anim > * { animation: rise .45s ease backwards; }
  .page-anim > *:nth-child(2) { animation-delay: .05s; }
  .page-anim > *:nth-child(3) { animation-delay: .1s; }
  @media (prefers-reduced-motion: reduce) { *, .page-anim > * { animation: none !important; transition: none !important; } }
`;

const NAV = [
  { id: 'dashboard', label: 'Overzicht', icon: '◈' },
  { id: 'shopify', label: 'Shopify', icon: '🛍' },
  { id: 'meta', label: 'Meta Ads', icon: '𝕄' },
  { id: 'tiktok', label: 'TikTok Ads', icon: '♪' },
  { id: 'seo', label: 'SEO', icon: '◎' },
];

const DATE_OPTIONS = [
  { value: 'today', label: 'Vandaag', icon: '☀' },
  { value: 'yesterday', label: 'Gisteren', icon: '☾' },
  { value: 'last_7d', label: '7 dagen', icon: '▦' },
  { value: 'last_30d', label: '30 dagen', icon: '▤' },
];

function renderMessage(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text)">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:var(--text-dim)">$1</em>')
    .replace(/^### (.+)$/gm, '<div style="font-weight:600;color:var(--frost);margin:8px 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em">$1</div>')
    .replace(/^## (.+)$/gm, '<div style="font-weight:700;color:var(--text);margin:10px 0 4px;font-size:13px">$1</div>')
    .replace(/^- (.+)$/gm, '<div style="padding:3px 0 3px 10px;border-left:2px solid var(--border-strong);margin:3px 0;color:var(--text-dim)">$1</div>')
    .replace(/^\d+\. (.+)$/gm, '<div style="padding:3px 0 3px 10px;border-left:2px solid var(--frost-line);margin:3px 0;color:var(--text-dim)">$1</div>')
    .replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
}

// Mini inline sparkline
function Spark({ data, color = 'var(--frost)' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const w = 88, h = 26;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`);
  const gid = 'sp' + Math.random().toString(36).slice(2, 7);
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.28} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
      <polygon points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill={`url(#${gid})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KpiCard({ label, value, sub, color, icon, spark, sparkColor }: { label: string; value: string; sub?: string; color: string; icon?: string; spark?: number[]; sparkColor?: string }) {
  return (
    <div className="glass kpi">
      <div className="kpi-top">
        <div className="kpi-label">{label}</div>
        {icon && <div className="kpi-ico">{icon}</div>}
      </div>
      <div className="kpi-value">{value}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 9 }}>
        {sub && <div className="kpi-sub" style={{ color, margin: 0 }}>{sub}</div>}
        {spark && spark.length > 1 && <div style={{ opacity: 0.9 }}><Spark data={spark} color={sparkColor || color} /></div>}
      </div>
    </div>
  );
}

interface AIAction { id: string; description: string; action: string; payload: any; status: 'pending' | 'approved' | 'rejected' | 'executed'; }

function ActionCard({ action, onApprove, onReject }: { action: AIAction; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="action-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div className="dot dot-amber pulse" />
        <span style={{ fontSize: 9.5, color: 'var(--amber)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>AI voorstel</span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.65 }}
        dangerouslySetInnerHTML={{ __html: renderMessage(action.description) }} />
      {action.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onApprove} style={{ padding: '8px 14px', background: 'var(--green-soft)', color: 'var(--green)', border: 'none', boxShadow: 'inset 0 0 0 1px rgba(47,224,168,0.25)', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, fontFamily: 'var(--font)' }}>Goedkeuren</button>
          <button onClick={onReject} style={{ padding: '8px 14px', background: 'var(--rose-soft)', color: 'var(--rose)', border: 'none', boxShadow: 'inset 0 0 0 1px rgba(255,107,125,0.25)', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, fontFamily: 'var(--font)' }}>Afwijzen</button>
        </div>
      )}
      {action.status === 'executed' && <span className="badge badge-green">Uitgevoerd</span>}
      {action.status === 'rejected' && <span className="badge badge-red">Afgewezen</span>}
    </div>
  );
}

function ChatBox({ messages, input, setInput, send, loading, chatRef, maxHeight = 400 }: any) {
  const suggestions = ['Analyseer mijn data', 'Hoe verhoog ik mijn ROAS?', 'Welke campagne presteert het beste?'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="chat-messages" ref={chatRef} style={{ maxHeight, minHeight: 120 }}>
        {messages.map((m: any, i: number) => (
          <div key={i} className={`msg-bubble ${m.role}`} dangerouslySetInnerHTML={{ __html: renderMessage(m.content) }} />
        ))}
        {loading && (
          <div className="msg-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '12px 14px' }}>
            <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
          </div>
        )}
      </div>
      {messages.length <= 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {suggestions.map((s: string) => <button key={s} className="chip" onClick={() => setInput(s)}>{s}</button>)}
        </div>
      )}
      <div style={{ display: 'flex', gap: 7, marginTop: 10, flexShrink: 0 }}>
        <input className="chat-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && send()} placeholder="Vraag de AI..." />
        <button className="chat-send" onClick={send} disabled={loading || !input.trim()}>{loading ? '···' : '↑'}</button>
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
  const scoreColor = !seoData ? 'var(--text-muted)' : seoData.score >= 80 ? 'var(--green)' : seoData.score >= 60 ? 'var(--amber)' : 'var(--rose)';
  return (
    <div className="page-anim">
      {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 13 }}><div className="dot dot-cyan pulse" /> SEO scan bezig...</div>}
      {seoData && !loading && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
            <div className="glass kpi" style={{ borderColor: `${scoreColor}44` }}>
              <div className="kpi-label">SEO score</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 44, fontWeight: 700, color: scoreColor, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{seoData.score}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>van 100 punten</div>
            </div>
            <KpiCard label="Pagina's gescand" value={String(seoData.totalPages)} sub="Producten + collecties" color="var(--violet)" icon="▤" />
            <KpiCard label="Kritieke problemen" value={String(seoData.highCount)} sub="Hoge prioriteit" color="var(--rose)" icon="⚠" />
            <KpiCard label="Waarschuwingen" value={String(seoData.mediumCount)} sub="Medium prioriteit" color="var(--amber)" icon="!" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div className="dot dot-green" />
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Laatste scan: {new Date(seoData.lastScanned).toLocaleString('nl-NL')}</span>
            <button className="pill-btn" style={{ marginLeft: 'auto' }}
              onClick={() => { setLoading(true); fetch('/api/seo').then(r => r.json()).then(d => { setSeoData(d); setLoading(false); }); }}>
              Opnieuw scannen
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {seoData.issues.length === 0 && <div className="glass panel" style={{ color: 'var(--green)', textAlign: 'center', fontSize: 13 }}>Geen problemen gevonden.</div>}
            {seoData.issues.map((p: any, i: number) => (
              <div key={i} className="glass panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge ${p.page_type === 'product' ? 'badge-blue' : 'badge-amber'}`}>{p.page_type === 'product' ? 'Product' : 'Collectie'}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{p.page_title}</span>
                  </div>
                  <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--frost)', textDecoration: 'none', opacity: 0.85 }}>Bekijk →</a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {p.issues.map((issue: any, j: number) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'var(--glass)', borderRadius: 'var(--r-sm)', border: '1px solid var(--hairline)' }}>
                      <span className={`badge ${issue.severity === 'hoog' ? 'badge-red' : 'badge-amber'}`} style={{ flexShrink: 0, marginTop: 1 }}>{issue.severity === 'hoog' ? 'Hoog' : 'Medium'}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-dim)', flex: 1, lineHeight: 1.6 }}>{issue.message}</span>
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

const tooltipStyle = { background: 'var(--panel-solid)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text)', boxShadow: '0 12px 30px rgba(0,0,0,0.5)' };

export default function Dashboard() {
  const [page, setPage] = useState('dashboard');
  const [period, setPeriod] = useState('today');
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hoi! Ik ben je CryoWipes AI manager. Ik analyseer je data, geef inzichten en stel acties voor die jij kunt goedkeuren.' }]);
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
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      fetch(`/api/shopify?period=${period}`).then(r => r.json()).then(setShopifyData).catch(() => {});
      fetch(`/api/meta?period=${period}`).then(r => r.json()).then(setMetaData).catch(() => {});
      fetch('/api/notifications').then(r => r.json()).then(d => setNotifications(d.notifications || [])).catch(() => {});
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [period]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setShowDateMenu(false);
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
      if (data.url) setUploadedImageUrl(data.url); else alert('Upload mislukt: ' + data.error);
    } catch { alert('Upload mislukt'); }
    setUploading(false);
  }

  async function approveAction(actionId: string) {
    const action = pendingActions.find(a => a.id === actionId);
    if (!action) return;
    setPendingActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'executed' } : a));
    try {
      await fetch('/api/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: action.action, payload: action.payload }) });
      setMessages(prev => [...prev, { role: 'assistant', content: `Uitgevoerd: ${action.description}` }]);
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: 'Er ging iets mis.' }]); }
  }

  function rejectAction(actionId: string) {
    setPendingActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'rejected' } : a));
    setMessages(prev => [...prev, { role: 'assistant', content: 'Oké, ik sla deze actie over.' }]);
  }

  async function send() {
    if (!input.trim()) return;
    const msgs = [...messages, { role: 'user', content: input }];
    setMessages(msgs); setInput(''); setLoading(true);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: msgs.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })) }) });
      const data = await res.json();
      if (data.action) {
        const newAction: AIAction = { id: Date.now().toString(), description: data.action.description, action: data.action.type, payload: data.action.payload, status: 'pending' };
        setPendingActions(prev => [...prev, newAction]);
      }
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
  const metaAmountSpent = metaData?.amount_spent || '0.00';
  const pendingCount = pendingActions.filter(a => a.status === 'pending').length;
  const alertCount = notifications.filter(n => n.severity !== 'info').length;
  const currentPeriodLabel = DATE_OPTIONS.find(o => o.value === period)?.label || '7 dagen';

  const chartData = shopifyData?.ordersByDay
    ? Object.entries(shopifyData.ordersByDay).slice(-7).map(([day, val]) => ({ dag: day.slice(5), omzet: val as number }))
    : [{ dag: '...', omzet: 0 }];
  const revSeries = chartData.map((d: any) => Number(d.omzet) || 0);

  return (
    <>
      <style>{css}</style>
      <div className="atmos" />
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* ── Sidebar ── */}
        <div className="sidebar">
          <div style={{ padding: '22px 18px 20px', borderBottom: '1px solid var(--hairline)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div className="brand-mark">❄</div>
              <div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>CryoWipes</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: 2, letterSpacing: '0.14em' }}>AI OPERATIONS</div>
              </div>
            </div>
          </div>
          <nav style={{ padding: '14px 10px', flex: 1 }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--mono)', letterSpacing: '0.14em', padding: '4px 12px 8px', textTransform: 'uppercase' }}>Kanalen</div>
            {NAV.map(n => (
              <button key={n.id} className={`nav-btn ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
                <span className="nav-ico">{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: '12px 10px', borderTop: '1px solid var(--hairline)' }}>
            <button onClick={() => setAiOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '11px 13px', background: 'var(--grad-soft)', border: '1px solid var(--frost-line)', borderRadius: 'var(--r-md)', cursor: 'pointer', color: 'var(--frost)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)', position: 'relative' }}>
              <span>◈</span><span>AI Agent</span>
              {pendingCount > 0 && <span style={{ marginLeft: 'auto', background: 'var(--amber)', color: '#000', borderRadius: 20, minWidth: 18, height: 18, padding: '0 5px', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{pendingCount}</span>}
            </button>
          </div>
          <div style={{ padding: '12px 18px 16px', borderTop: '1px solid var(--hairline)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: 7, letterSpacing: '0.04em' }}>cryowipes.store</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div className="dot dot-green pulse" />
              <span style={{ fontSize: 11.5, color: 'var(--green)', fontWeight: 600 }}>Systemen actief</span>
            </div>
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Header */}
          <div style={{ padding: '15px 24px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, backdropFilter: 'blur(12px)', background: 'rgba(5,7,12,0.6)' }}>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 19, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>{NAV.find(n => n.id === page)?.label || 'Overzicht'}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Realtime · vernieuwt elke 30 seconden</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '7px 12px' }}>
                <div className="dot dot-green" />
                <span style={{ fontSize: 11.5, color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>Live</span>
              </div>
              <div ref={dateRef} style={{ position: 'relative' }}>
                <button className={`topbar-btn ${showDateMenu ? 'active' : ''}`} onClick={() => setShowDateMenu(!showDateMenu)}>
                  <span>{DATE_OPTIONS.find(o => o.value === period)?.icon}</span>
                  <span>{currentPeriodLabel}</span>
                  <span style={{ fontSize: 9, opacity: 0.6 }}>{showDateMenu ? '▲' : '▼'}</span>
                </button>
                {showDateMenu && (
                  <div className="date-dropdown">
                    {DATE_OPTIONS.map(opt => (
                      <button key={opt.value} className={`date-option ${period === opt.value ? 'selected' : ''}`}
                        onClick={() => { setPeriod(opt.value); setShowDateMenu(false); }}>
                        <span>{opt.icon}</span><span>{opt.label}</span>
                        {period === opt.value && <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button className={`notif-btn ${alertCount > 0 ? 'has-alerts' : ''}`} onClick={() => setShowNotifications(!showNotifications)}>
                  🔔
                  {alertCount > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--rose)', color: '#fff', borderRadius: '50%', width: 17, height: 17, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, border: '2px solid var(--bg)' }}>{alertCount}</span>}
                </button>
                {showNotifications && (
                  <div className="notif-dropdown">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Notificaties</span>
                      {alertCount > 0 && <span className="badge badge-red">{alertCount} alert{alertCount > 1 ? 's' : ''}</span>}
                    </div>
                    {notifications.length === 0
                      ? <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>Geen meldingen</div>
                      : notifications.map((n, i) => (
                        <div key={i} style={{ padding: '10px 12px', background: 'var(--glass)', borderRadius: 'var(--r-sm)', marginBottom: i < notifications.length - 1 ? 8 : 0, boxShadow: `inset 0 0 0 1px ${n.severity === 'critical' ? 'rgba(255,107,125,0.25)' : n.severity === 'warning' ? 'rgba(255,184,77,0.25)' : 'rgba(47,224,168,0.25)'}` }}>
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: n.severity === 'critical' ? 'var(--rose)' : n.severity === 'warning' ? 'var(--amber)' : 'var(--green)' }}>{n.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.message}</div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

            {/* ── OVERZICHT ── */}
            {page === 'dashboard' && (
              <div className="page-anim">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
                  <KpiCard label="Totale omzet" value={`$${revenue}`} sub={`${orders} orders`} color="var(--green)" icon="$" spark={revSeries} sparkColor="var(--green)" />
                  <KpiCard label="Orders" value={String(orders)} sub={currentPeriodLabel} color="var(--frost)" icon="▦" spark={revSeries} sparkColor="var(--frost)" />
                  <KpiCard label="Gem. orderwaarde" value={`$${aov}`} sub="AOV" color="var(--violet)" icon="◊" />
                  <KpiCard label="Meta spend" value={`$${metaSpend}`} sub={`${Number(metaImpressions).toLocaleString()} impressies`} color="var(--amber)" icon="◈" />
                </div>

                {/* secondary metric strip — data-dicht */}
                <div className="glass" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 0, marginBottom: 16 }}>
                  {[
                    { label: 'Vandaag', value: `$${shopifyData?.todayRevenue || '0.00'}`, c: 'var(--green)' },
                    { label: 'Orders vandaag', value: String(shopifyData?.todayOrders || 0), c: 'var(--frost)' },
                    { label: 'Meta CTR', value: metaData?.ctr ? `${parseFloat(metaData.ctr).toFixed(2)}%` : '0%', c: 'var(--violet)' },
                    { label: 'Meta CPC', value: metaData?.cpc ? `$${parseFloat(metaData.cpc).toFixed(2)}` : '$0', c: 'var(--amber)' },
                    { label: 'Clicks', value: metaClicks, c: 'var(--frost)' },
                  ].map((s, i) => (
                    <div key={s.label} style={{ padding: '15px 18px', borderLeft: i === 0 ? 'none' : '1px solid var(--hairline)' }}>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 7 }}>{s.label}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 600, color: s.c, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 16 }}>
                  <div className="glass panel">
                    <div className="panel-title">Omzet<span className="ey">{currentPeriodLabel}</span></div>
                    <ResponsiveContainer width="100%" height={168}>
                      <AreaChart data={chartData}>
                        <defs><linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5fd8ff" stopOpacity={0.32} /><stop offset="100%" stopColor="#5fd8ff" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
                        <XAxis dataKey="dag" stroke="var(--hairline)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--hairline)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={34} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="omzet" stroke="var(--frost)" strokeWidth={2} fill="url(#grad1)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="glass panel">
                    <div className="panel-title">Meta Ads<span className="ey">{currentPeriodLabel}</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'Spend', value: `$${metaSpend}`, color: 'var(--amber)' },
                        { label: 'Impressies', value: Number(metaImpressions).toLocaleString(), color: 'var(--violet)' },
                        { label: 'Clicks', value: metaClicks, color: 'var(--frost)' },
                        { label: 'CTR', value: metaData?.ctr ? `${parseFloat(metaData.ctr).toFixed(2)}%` : '0%', color: 'var(--green)' },
                      ].map(s => (
                        <div key={s.label} className="stat-row">
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{s.label}</span>
                          <span className="stat-val" style={{ color: s.color }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {pendingCount > 0 && (
                  <div className="glass panel" style={{ borderColor: 'var(--amber-soft)', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <div className="dot dot-amber pulse" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Openstaande AI acties</span>
                      <span className="badge badge-amber">{pendingCount} wachtend</span>
                    </div>
                    {pendingActions.filter(a => a.status === 'pending').map(a => <ActionCard key={a.id} action={a} onApprove={() => approveAction(a.id)} onReject={() => rejectAction(a.id)} />)}
                  </div>
                )}
              </div>
            )}

            {/* ── SHOPIFY ── */}
            {page === 'shopify' && (
              <div className="page-anim">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 16 }}>
                  <KpiCard label="Omzet" value={`$${revenue}`} sub={`${orders} orders`} color="var(--green)" spark={revSeries} sparkColor="var(--green)" />
                  <KpiCard label="Orders" value={String(orders)} sub={currentPeriodLabel} color="var(--frost)" />
                  <KpiCard label="AOV" value={`$${aov}`} sub="Gem. waarde" color="var(--violet)" />
                  <KpiCard label="Vandaag" value={`$${shopifyData?.todayRevenue || '0.00'}`} sub={`${shopifyData?.todayOrders || 0} orders`} color="var(--green)" />
                  <KpiCard label="Klanten" value={String(shopifyData?.totalCustomers || 0)} sub="Totaal" color="var(--violet)" />
                  <KpiCard label="Producten" value={String(shopifyData?.totalProducts || 0)} sub="In catalogus" color="var(--frost)" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="glass panel">
                    <div className="panel-title">Omzet<span className="ey">{currentPeriodLabel}</span></div>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={chartData}>
                        <defs><linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2fe0a8" stopOpacity={0.28} /><stop offset="100%" stopColor="#2fe0a8" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
                        <XAxis dataKey="dag" stroke="var(--hairline)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--hairline)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={34} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="omzet" stroke="var(--green)" strokeWidth={2} fill="url(#grad2)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="glass panel">
                    <div className="panel-title">Snelle links</div>
                    {[
                      { label: 'Orders beheren', url: 'https://admin.shopify.com/store/cryowipes/orders', icon: '📦' },
                      { label: 'Producten', url: 'https://admin.shopify.com/store/cryowipes/products', icon: '🛍' },
                      { label: 'Klanten', url: 'https://admin.shopify.com/store/cryowipes/customers', icon: '👥' },
                    ].map(l => (
                      <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--hairline)', fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none', transition: 'color .15s', gap: 8 }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--frost)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}>
                        <span>{l.icon} {l.label}</span><span style={{ color: 'var(--text-muted)', fontSize: 11 }}>↗</span>
                      </a>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="glass panel">
                    <div className="panel-title">Producten</div>
                    <table className="data-table">
                      <thead><tr>{['Product', 'Prijs', 'Voorraad'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {(shopifyData?.products || []).slice(0, 6).map((p: any) => (
                          <tr key={p.id}>
                            <td style={{ color: 'var(--text)', fontWeight: 500 }}>{p.title}</td>
                            <td className="num" style={{ color: 'var(--frost)', fontWeight: 600 }}>${p.price}</td>
                            <td><span className={`badge ${p.inventory > 10 ? 'badge-green' : 'badge-red'}`}>{p.inventory}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="glass panel">
                    <div className="panel-title">Recente orders</div>
                    <table className="data-table">
                      <thead><tr>{['Order', 'Datum', 'Bedrag', 'Status'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {(shopifyData?.recentOrders || []).map((o: any) => (
                          <tr key={o.id}>
                            <td className="num" style={{ color: 'var(--frost)', fontSize: 11 }}>{o.id}</td>
                            <td className="num" style={{ fontSize: 11 }}>{o.date}</td>
                            <td className="num" style={{ color: 'var(--text)', fontWeight: 600 }}>${o.total}</td>
                            <td><span className={`badge ${o.status === 'fulfilled' ? 'badge-green' : 'badge-amber'}`}>{o.status === 'fulfilled' ? 'Verzonden' : 'Open'}</span></td>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 16 }}>
                  <KpiCard label="Spend" value={`$${metaSpend}`} sub={currentPeriodLabel} color="var(--amber)" icon="◈" />
                  <KpiCard label="Impressies" value={Number(metaImpressions).toLocaleString()} sub={currentPeriodLabel} color="var(--violet)" icon="◉" />
                  <KpiCard label="Clicks" value={metaClicks} sub={currentPeriodLabel} color="var(--frost)" icon="⇢" />
                  <KpiCard label="CTR" value={metaData?.ctr ? `${parseFloat(metaData.ctr).toFixed(2)}%` : '0%'} sub="Click-through" color="var(--green)" icon="◊" />
                  <KpiCard label="CPC" value={metaData?.cpc ? `$${parseFloat(metaData.cpc).toFixed(2)}` : '$0'} sub="Kosten/klik" color="var(--amber)" icon="$" />
                  <KpiCard label="All-time spend" value={`$${metaAmountSpent}`} sub="Totaal ooit" color="var(--amber)" icon="Σ" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="glass panel">
                    <div className="panel-title">Prestaties<span className="ey">{currentPeriodLabel}</span></div>
                    <ResponsiveContainer width="100%" height={190}>
                      <AreaChart data={chartData}>
                        <defs><linearGradient id="grad3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} /><stop offset="100%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
                        <XAxis dataKey="dag" stroke="var(--hairline)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--hairline)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={34} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="omzet" stroke="var(--violet)" strokeWidth={2} fill="url(#grad3)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="glass panel">
                    <div className="panel-title">Account</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                      {[
                        { label: 'Spend', value: `$${metaSpend}`, color: 'var(--amber)' },
                        { label: 'Impressies', value: Number(metaImpressions).toLocaleString(), color: 'var(--violet)' },
                        { label: 'Clicks', value: metaClicks, color: 'var(--frost)' },
                        { label: 'CTR', value: metaData?.ctr ? `${parseFloat(metaData.ctr).toFixed(2)}%` : '0%', color: 'var(--green)' },
                      ].map(s => (
                        <div key={s.label} className="stat-row">
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{s.label}</span>
                          <span className="stat-val" style={{ color: s.color }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                    <a href="https://adsmanager.facebook.com" target="_blank" rel="noreferrer"
                      style={{ display: 'block', padding: '10px 12px', background: 'var(--grad-soft)', border: '1px solid var(--frost-line)', borderRadius: 'var(--r-sm)', color: 'var(--frost)', fontSize: 12, textDecoration: 'none', textAlign: 'center', fontWeight: 600 }}>
                      Open Ads Manager ↗
                    </a>
                  </div>
                </div>
                <div className="glass panel" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div className="panel-title" style={{ margin: 0 }}>Campagnes</div>
                    <a href="https://adsmanager.facebook.com" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--frost)', textDecoration: 'none', fontWeight: 500 }}>Bekijk alle →</a>
                  </div>
                  {metaData?.campaigns?.length > 0 ? (
                    <table className="data-table">
                      <thead><tr>{['Campagne', 'Status', 'Budget', 'Actie'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {metaData.campaigns.map((c: any) => (
                          <tr key={c.id}>
                            <td style={{ color: 'var(--text)', fontWeight: 600 }}>{c.name}</td>
                            <td><span className={`badge ${c.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'}`}>{c.status === 'ACTIVE' ? 'Actief' : 'Gepauzeerd'}</span></td>
                            <td className="num" style={{ color: 'var(--text-dim)' }}>{c.daily_budget ? `$${(parseInt(c.daily_budget) / 100).toFixed(2)}/dag` : 'Lifetime'}</td>
                            <td><button className="pill-btn">{c.status === 'ACTIVE' ? 'Pauzeer' : 'Hervat'}</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Geen campagnes gevonden.</div>}
                </div>
                <div className="glass panel">
                  <div className="panel-title">Campagne visual uploaden</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {!uploadedImageUrl ? (
                      <label className="upload-zone">
                        <span style={{ fontSize: 26 }}>{uploading ? '⏳' : '↑'}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>{uploading ? 'Uploaden...' : 'Klik om afbeelding of video te uploaden'}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>JPG, PNG, MP4 — max 100MB</span>
                        <input type="file" accept="image/*,video/*" style={{ display: 'none' }} disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                      </label>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--glass)', border: '1px solid var(--green-soft)', borderRadius: 'var(--r-sm)' }}>
                        <div style={{ fontSize: 20, color: 'var(--green)' }}>✓</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 2 }}>Visual geüpload</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{uploadFileName}</div>
                        </div>
                        <button className="pill-btn" onClick={() => { setUploadedImageUrl(null); setUploadFileName(''); }}>Verwijder</button>
                      </div>
                    )}
                    <button onClick={() => { const prompt = uploadedImageUrl ? `Maak een Meta campagne aan voor CryoWipes met deze afbeelding URL: ${uploadedImageUrl}. Landingspagina: https://cryowipes.store/products/cryo-wipe-box. Budget: $20/dag. Targeting: USA en Canada, 18-45 jaar.` : 'Maak een Meta campagne aan voor CryoWipes. Landingspagina: https://cryowipes.store/products/cryo-wipe-box. Budget: $20/dag. Targeting: USA en Canada, 18-45 jaar.'; setInput(prompt); setAiOpen(true); }}
                      style={{ padding: 13, background: 'var(--grad)', color: '#04121c', border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font)', boxShadow: '0 6px 18px rgba(79,155,255,0.3)' }}>
                      ◈ {uploadedImageUrl ? 'AI campagne aanmaken met deze visual' : 'AI campagne aanmaken'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {page === 'seo' && <SEOPage />}

            {page !== 'dashboard' && page !== 'shopify' && page !== 'meta' && page !== 'seo' && (
              <div className="empty-state page-anim">
                <div className="empty-ico">{NAV.find(n => n.id === page)?.icon}</div>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--display)', fontSize: 16 }}>{NAV.find(n => n.id === page)?.label}</span>
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Deze module komt binnenkort beschikbaar</span>
              </div>
            )}
          </div>
        </div>

        {/* ── AI Side Panel ── */}
        <div className={`ai-side-panel ${aiOpen ? 'open' : ''}`}>
          <div style={{ width: 372, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
            <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{ width: 34, height: 34, background: 'var(--grad)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#04121c', boxShadow: '0 6px 16px rgba(79,155,255,0.35)' }}>◈</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>AI Agent</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <div className="dot dot-cyan pulse" style={{ width: 5, height: 5 }} />
                    <span style={{ fontSize: 10, color: 'var(--frost)', fontWeight: 500 }}>Online</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {pendingCount > 0 && <span className="badge badge-amber">{pendingCount} actie{pendingCount > 1 ? 's' : ''}</span>}
                <button onClick={() => setAiOpen(false)} style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 'var(--r-xs)', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1, fontFamily: 'var(--font)' }}>✕</button>
              </div>
            </div>
            {pendingActions.filter(a => a.status === 'pending').length > 0 && (
              <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
                <div style={{ fontSize: 9.5, color: 'var(--amber)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: 'var(--mono)' }}>Openstaande acties</div>
                {pendingActions.filter(a => a.status === 'pending').map(a => <ActionCard key={a.id} action={a} onApprove={() => approveAction(a.id)} onReject={() => rejectAction(a.id)} />)}
                <div style={{ height: 1, background: 'var(--hairline)', margin: '12px 0 0' }} />
              </div>
            )}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, overflow: 'hidden', minHeight: 0 }}>
              <ChatBox messages={messages} input={input} setInput={setInput} send={send} loading={loading} chatRef={chatRef} maxHeight={9999} />
            </div>
          </div>
        </div>

        {/* ── FAB ── */}
        <button className="ai-fab" onClick={() => setAiOpen(!aiOpen)} title={aiOpen ? 'AI Agent sluiten' : 'AI Agent openen'}>
          {aiOpen ? '✕' : '◈'}
          {!aiOpen && pendingCount > 0 && (
            <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--amber)', color: '#000', borderRadius: '50%', width: 18, height: 18, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, border: '2px solid var(--bg)' }}>{pendingCount}</span>
          )}
        </button>
      </div>
    </>
  );
}

'use client';
import { useState } from 'react';

export default function Dashboard() {
  const [messages, setMessages] = useState([
    {role: 'assistant', content: 'Hoi! Ik ben je CryoWipes AI manager!'}
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const msgs = [...messages, {role: 'user', content: input}];
    setMessages(msgs);
    setInput('');
    setLoading(true);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({messages: msgs.map(m => ({role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content}))})
    });
    const data = await res.json();
    setMessages([...msgs, {role: 'assistant', content: data.content}]);
    setLoading(false);
  }

  return (
    <div style={{background:'#0a0e1a',minHeight:'100vh',color:'white',fontFamily:'system-ui',padding:20}}>
      <h1 style={{color:'#00d4ff'}}>CryoWipes Dashboard</h1>
      <div style={{marginTop:20}}>
        {messages.map((m,i)=>(
          <div key={i} style={{background:m.role==='user'?'#7c3aed':'#1a2236',padding:10,borderRadius:8,marginBottom:8}}>
            {m.content}
          </div>
        ))}
      </div>
      {loading && <p style={{color:'#6b7fa3'}}>Bezig...</p>}
      <div style={{marginTop:10,display:'flex',gap:8}}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&send()}
          placeholder="Stel een vraag..."
          style={{flex:1,padding:10,background:'#1a2236',color:'white',border:'1px solid #333',borderRadius:8,outline:'none'}}
        />
        <button
          onClick={send}
          style={{padding:'10px 20px',background:'#00d4ff',color:'black',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700}}
        >
          Stuur
        </button>
      </div>
    </div>
  );
}

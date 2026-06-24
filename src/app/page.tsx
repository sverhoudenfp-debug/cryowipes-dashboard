'use client';
import { useState } from 'react';

export default function Dashboard() {
  const [messages, setMessages] = useState([
    {role: 'assistant', content: 'Hoi! Ik ben je CryoWipes AI manager. Stel me een vraag!'}
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const newMessages = [...messages, {role: 'user', content: input}];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({messages: newMessages.map(m => ({role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content}))})
      });
      const data = await res.json();
      setMessages([...newMessages, {role: 'assistant', content: data.content}]);
    } catch {
      setMessages([...newMessages, {role: 'assistant', content: 'Fout. Probeer opnieuw.'}]);
    }
    setLoading(false);
  }

  return (
    <div style={{background:'#0a0e1a',minHeight:'100vh',color:'#e8edf5',fontFamily:'system-ui',display:'flex',flexDirection:'column'}}>
      <div style={{background:'#111827',borderBottom:'1px solid #1e2d47',padding:'16px 24px',display:'flex',alignItems:'center',gap:12}}>
        <div style={{background:'linear-gradient(135deg,#00d4ff,#7c3aed)',width:36,height:36,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:'#fff'}}>CW</div>
        <div>
          <div style={{fontWeight:600}}>CryoWipes Dashboard</div>
          <div style={{fontSize:12,color:'#6b7fa3'}}>AI Ads Manager</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,padding:20}}>
        <div style={{background:'#111827',border:'1px solid #1e2d47',borderRadius:12,padding:16}}>
          <div style={{fontSize:11,color:'#6b7fa3',marginBottom:6}}>Shopify omzet</div>
          <div style={{fontSize:24,fontWeight:700,color:'#10b981'}}>570</div>
          <div style={{fontSize:11,color:'#6b7fa3',marginTop:4}}>9 bestellingen</div>
        </div>
        <div style={{background:'#111827',border:'1px solid #1e2d47',borderRadius:12,padding:16}}>
          <div style={{fontSize:11,color:'#6b7fa3',marginBottom:6}}>Ads spend</div>
          <div style={{fontSize:24,fontWeight:700,color:'#00d4ff'}}>8.10</div>
          <div style={{fontSize:11,color:'#6b7fa3',marginTop:4}}>TikTok actief</div>
        </div>
        <div style={{background:'#111827',border:'1px solid #1e2d47',borderRadius:12,padding:16}}>
          <div style={{fontSize:11,color:'#6b7fa3',marginBottom:6}}>TikTok CTR</div>
          <div style={{fontSize:24,fontWeight:700,color:'#f59e0b'}}>0.13%</div>
          <div style={{fontSize:11,color:'#6b7fa3',marginTop:4}}>10.339 impressies</div>
        </div>
        <div style={{background:'#111827',border:'1px solid #1e2d47',borderRadius:12,padding:16}}>
          <div style={{fontSize:11,color:'#6b7fa3',marginBottom:6}}>Conversies</div>
          <div style={{fontSize:24,fontWeight:700,color:'#ef4444'}}>0</div>
          <div style={{fontSize:11,color:'#6b7fa3',marginTop:4}}>Via ads</div>
        </div>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',padding:'0 20px 20px'}}>
        <div style={{background:'#111827',border:'1px solid #1e2d47',borderRadius:12,flex:1,display:'flex',flexDirection:'column'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #1e2d47',fontSize:13,fontWeight:600,color:'#6b7fa3'}}>AI CHAT</div>
          <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:10,minHeight:300}}>
            {messages.map((m,i)=>(
              <div key={i} style={{alignSelf:m.role==='user'?'flex-end':'flex-start',maxWidth:'80%'}}>
                <div style={{background:m.role==='user'?'#7c3aed':'#1a2236',padding:'10px 14px',borderRadius:12,fontSize:13,lineHeight:1.5}}>{m.content}</div>
              </div>
            ))}
            {loading && <div style={{alignSelf:'flex-start',background:'#1a2236',padding:'10px 14px',borderRadius:12,fontSize:13,color:'#6b7fa3'}}>Bezig...</div>}
          </div>
          <div style={{padding:12,borderTop:'1px solid #1e2d47',display:'flex',gap:8,flexWrap:'wrap'}}>
            {['Dagelijks rapport','TikTok optimaliseren','Meta campagne maken','SEO tips'].map(q=>(
              <button key={q} onClick={()=>setInput(q)} style={{background:'#1a2236',border:'1px solid #1e2d47',color:'#e8edf5',padding:'6px 12px',borderRadius:20,fontSize:11,cursor:'pointer'}}>{q}</button>
            ))}
          </div>
          <div style={{padding:12,borderTop:'1px solid #1e2d47',display:'flex',gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Stel een vraag..." style={{flex:1,background:'#1a2236',border:'1px solid #1e2d47',color:'#e8edf5',padding:'9px 13px',borderRadius:10,fontSize:13,outline:'none'}}/>
            <button onClick={send} style={{background:'#00d4ff',color:'#000',border:'none',width:36,height:36,borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:16}}>GO</button>
          </div>
        </div>
      </div>
    </div>
  );
}

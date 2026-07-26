(function(){try{require('fs').readFileSync('/root/.hermes/.env','utf8').split('\n').forEach(function(l){var m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2];});}catch(e){}})();
const { Client } = require('pg');
function norm(n){ return String(n||'').replace(/[^0-9]/g,''); }
async function resolveAuto(c){
  try{ const r = await c.query("SELECT telefono FROM bot_estado ORDER BY ultima_interaccion DESC NULLS LAST LIMIT 1"); return r.rows.length ? r.rows[0].telefono : ''; }catch(e){ return ''; }
}
async function telegram(text){ try{ const r=await fetch(`https://api.telegram.org/bot${process.env.NS_TG_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.NS_TG_CHAT,text})}); const j=await r.json(); return !!(j&&j.ok);}catch(e){return false;} }
const motivo=(process.argv[2]||'sin motivo'), resumen=(process.argv[3]||'');
const clienteArg = norm(process.argv[4]||'');
(async()=>{
  const c=new Client({connectionString:process.env.NS_DB_URL}); await c.connect();
  const cliente = clienteArg || norm(await resolveAuto(c));
  if(cliente){ await c.query("INSERT INTO bot_estado (telefono, bot_activo, ultima_interaccion) VALUES ($1,false,now()) ON CONFLICT (telefono) DO UPDATE SET bot_activo=false",[cliente]); }
  const notif = await telegram(`\u{1F514} HANDOFF - atender manual\nCliente: ${cliente||'?'}\nMotivo: ${motivo}\n${resumen}\n(el bot quedo PAUSADO para este numero)`);
  await c.query("INSERT INTO bot_logs (evento, telefono, detalle) VALUES ($1,$2,$3::jsonb)",['handoff', cliente||null, JSON.stringify({motivo,resumen,telegram:notif})]);
  await c.end();
  console.log(JSON.stringify({handoff:true, cliente_pausado:cliente||null, telegram_notificado:notif}));
})().catch(e=>{console.error(JSON.stringify({error:e.message}));process.exit(1);});

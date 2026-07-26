(function(){try{require('fs').readFileSync('/root/.hermes/.env','utf8').split('\n').forEach(function(l){var m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2];});}catch(e){}})();
const { Client } = require('pg');
async function telegram(text){
  try{ const r=await fetch(`https://api.telegram.org/bot${process.env.NS_TG_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.NS_TG_CHAT,text})}); const j=await r.json(); return !!(j&&j.ok);}catch(e){return false;}
}
(async () => {
  const key = process.env.OPENROUTER_API_KEY;
  if(!key){ console.log(JSON.stringify({error:'sin OPENROUTER_API_KEY'})); process.exit(1); }
  const r = await fetch('https://openrouter.ai/api/v1/credits',{headers:{'Authorization':'Bearer '+key}});
  const j = await r.json();
  const d = (j&&j.data)||{};
  const total = Number(d.total_credits||0), usado = Number(d.total_usage||0);
  const restante = +(total - usado).toFixed(4);
  const c = new Client({ connectionString: process.env.NS_DB_URL });
  await c.connect();
  const u = await c.query("SELECT valor FROM bot_config WHERE clave='umbral_creditos_openrouter_usd'");
  const umbral = u.rows.length ? (parseFloat(u.rows[0].valor)||5) : 5;
  let avisado=false;
  if(restante <= umbral){
    // throttle: no repetir si ya avisamos en las ultimas 6h
    const last = await c.query("SELECT created_at FROM bot_logs WHERE evento='creditos_bajos' AND created_at > now() - interval '6 hours' ORDER BY created_at DESC LIMIT 1");
    if(!last.rows.length){
      avisado = await telegram(`\u{26A0}\u{FE0F} CREDITOS OPENROUTER BAJOS\nSaldo restante: $${restante} USD (umbral $${umbral}).\nRecarga en openrouter.ai para que el bot no deje de responder.`);
      await c.query("INSERT INTO bot_logs (evento,detalle) VALUES ('creditos_bajos',$1::jsonb)",[JSON.stringify({restante,umbral,total,usado,telegram:avisado})]);
    }
  }
  await c.end();
  console.log(JSON.stringify({restante,umbral,total,usado,avisado}));
})().catch(e => { console.error(JSON.stringify({error:e.message})); process.exit(1); });

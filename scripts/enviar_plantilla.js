(function(){try{require('fs').readFileSync('/root/.hermes/.env','utf8').split('\n').forEach(function(l){var m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2];});}catch(e){}})();
const { Client } = require('pg');
const { execSync } = require('child_process');
function resolveAuto(){
  try{
    const out = execSync('/usr/local/bin/kapso whatsapp messages list --phone-number-id '+process.env.KAPSO_PHONE_NUMBER_ID+' --direction inbound --limit 1 --output json',{encoding:'utf8',env:process.env,timeout:20000});
    const j = JSON.parse(out); const arr = j.data||j; const m = (arr&&arr[0])||{};
    return m.from || (m.kapso&&m.kapso.phone_number) || '';
  }catch(e){ return ''; }
}
const nameArg=(process.argv[2]||'').trim();
let to=(process.argv[3]||'').trim();
let lang=(process.argv[4]||'').trim();
(async()=>{
  if(!nameArg){ console.log(JSON.stringify({error:'uso: enviar_plantilla.js <PROMO|nombre> <AUTO|numero> [idioma]'})); return; }
  const c=new Client({connectionString:process.env.NS_DB_URL}); await c.connect();
  const cfg={}; const rc=await c.query("SELECT clave,valor FROM bot_config WHERE clave IN ('promo_activa','promo_template','promo_idioma')");
  rc.rows.forEach(r=>cfg[r.clave]=r.valor); await c.end();
  let template=nameArg;
  if(nameArg.toUpperCase()==='PROMO'){
    if(String(cfg.promo_activa||'').toLowerCase()!=='true'){ console.log(JSON.stringify({error:'promo desactivada'})); return; }
    template=cfg.promo_template||''; if(!lang) lang=cfg.promo_idioma||'es';
    if(!template){ console.log(JSON.stringify({error:'no hay promo_template configurada'})); return; }
  }
  if(!lang) lang='es';
  if(!to||to==='AUTO'){ to=resolveAuto(); }
  if(!to){ console.log(JSON.stringify({error:'no pude resolver el numero del cliente'})); return; }
  const body={messaging_product:'whatsapp',to,type:'template',template:{name:template,language:{code:lang}}};
  const resp=await fetch(`https://api.kapso.ai/meta/whatsapp/v24.0/${process.env.KAPSO_PHONE_NUMBER_ID}/messages`,{method:'POST',headers:{'Content-Type':'application/json','X-API-Key':process.env.KAPSO_API_KEY},body:JSON.stringify(body)});
  const j=await resp.json();
  console.log(JSON.stringify({sent:true,template,to,kapso:j}));
})().catch(e=>{console.error(JSON.stringify({error:e.message}));process.exit(1);});

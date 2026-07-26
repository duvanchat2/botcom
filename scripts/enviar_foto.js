(function(){try{require('fs').readFileSync('/root/.hermes/.env','utf8').split('\n').forEach(function(l){var m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2];});}catch(e){}})();
const { Client } = require('pg');
const sku = (process.argv[2]||'').trim();
let to = (process.argv[3]||'').trim();
async function resolveAuto(c){
  // ultimo numero entrante segun el relay (bot_estado.ultima_interaccion) — sin CLI, sin cuelgues
  try{ const r = await c.query("SELECT telefono FROM bot_estado ORDER BY ultima_interaccion DESC NULLS LAST LIMIT 1"); return r.rows.length ? r.rows[0].telefono : ''; }catch(e){ return ''; }
}
(async () => {
  if(!sku){ console.log(JSON.stringify({error:'uso: enviar_foto.js <sku> <telefono|AUTO|DRYRUN>'})); return; }
  const c = new Client({ connectionString: process.env.NS_DB_URL });
  await c.connect();
  const r = await c.query(
    `SELECT image_url FROM product_images
     WHERE sku=$1 AND coalesce(image_url,'')<>''
     ORDER BY is_primary DESC NULLS LAST, image_order ASC NULLS LAST LIMIT 1`, [sku]);
  if(!r.rows.length){ await c.end(); console.log(JSON.stringify({error:'sin imagen para sku '+sku})); return; }
  const url = r.rows[0].image_url;
  if(to === 'DRYRUN'){ await c.end(); console.log(JSON.stringify({dryrun:true, sku, url})); return; }
  if(!to || to === 'AUTO'){ to = await resolveAuto(c); }
  await c.end();
  if(!to){ console.log(JSON.stringify({error:'no pude resolver el numero del cliente'})); return; }
  const body = { messaging_product:'whatsapp', to, type:'image', image:{ link:url } };
  const resp = await fetch(`https://api.kapso.ai/meta/whatsapp/v24.0/${process.env.KAPSO_PHONE_NUMBER_ID}/messages`, {
    method:'POST', headers:{'Content-Type':'application/json','X-API-Key':process.env.KAPSO_API_KEY},
    body: JSON.stringify(body) });
  const j = await resp.json();
  console.log(JSON.stringify({sent:true, sku, to, url, kapso:j}));
})().catch(e => { console.error(JSON.stringify({error:e.message})); process.exit(1); });

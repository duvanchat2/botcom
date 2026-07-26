(function(){try{require('fs').readFileSync('/root/.hermes/.env','utf8').split('\n').forEach(function(l){var m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2];});}catch(e){}})();
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.NS_DB_URL });
  await c.connect();
  const act = await c.query("SELECT valor FROM bot_estrategia WHERE clave='estrategia_activa'");
  const activa = act.rows.length ? String(act.rows[0].valor).trim().toLowerCase()==='true' : false;
  if(!activa){ await c.end(); console.log(JSON.stringify({estrategia_activa:false})); return; }
  const r = await c.query("SELECT clave, valor FROM bot_estrategia WHERE activo IS TRUE AND coalesce(valor,'')<>'' AND clave<>'estrategia_activa' ORDER BY clave");
  await c.end();
  const out = { estrategia_activa:true };
  r.rows.forEach(x=>{ out[x.clave]=x.valor; });
  console.log(JSON.stringify(out));
})().catch(e => { console.error(JSON.stringify({error:e.message})); process.exit(1); });

(function(){try{require('fs').readFileSync('/root/.hermes/.env','utf8').split('\n').forEach(function(l){var m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2];});}catch(e){}})();
const { Client } = require('pg');
const q=(process.argv.slice(2).join(' ')).trim();
(async()=>{
  if(!q){ console.log('[]'); return; }
  const c=new Client({connectionString:process.env.NS_DB_URL}); await c.connect();
  const r=await c.query(`SELECT pregunta, respuesta FROM bot_faqs WHERE activo IS TRUE AND (
      to_tsvector('spanish', coalesce(pregunta,'')||' '||coalesce(palabras_clave,'')||' '||coalesce(respuesta,''))
        @@ plainto_tsquery('spanish',$1)
      OR pregunta ILIKE '%'||$1||'%' OR palabras_clave ILIKE '%'||$1||'%') LIMIT 3`,[q]);
  await c.end(); console.log(JSON.stringify(r.rows));
})().catch(e=>{console.error(JSON.stringify({error:e.message}));process.exit(1);});

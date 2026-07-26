(function(){try{require('fs').readFileSync('/root/.hermes/.env','utf8').split('\n').forEach(function(l){var m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2];});}catch(e){}})();
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.NS_DB_URL });
  await c.connect();
  const r = await c.query("SELECT clave, valor, descripcion FROM bot_config WHERE activo IS TRUE AND coalesce(valor,'')<>'' ORDER BY clave");
  await c.end();
  console.log(JSON.stringify(r.rows));
})().catch(e => { console.error(JSON.stringify({error:e.message})); process.exit(1); });

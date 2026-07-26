(function(){try{require('fs').readFileSync('/root/.hermes/.env','utf8').split('\n').forEach(function(l){var m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2];});}catch(e){}})();
const { Client } = require('pg');
const q = process.argv.slice(2).join(' ').trim();
(async () => {
  if(!q){ console.log(JSON.stringify({error:'consulta vacia'})); return; }
  const c = new Client({ connectionString: process.env.NS_DB_URL });
  await c.connect();
  const sql = `
    SELECT sku, nombre_del_producto, marca, categoria, tipo, presentacion,
           publico_precio, stock_qty
    FROM products
    WHERE activo IS NOT FALSE AND (
      to_tsvector('spanish',
        coalesce(nombre_del_producto,'')||' '||coalesce(categoria,'')||' '||
        coalesce(tipo,'')||' '||coalesce(marca,''))
        @@ plainto_tsquery('spanish', $1)
      OR nombre_del_producto ILIKE '%'||$1||'%'
    )
    ORDER BY (nombre_del_producto ILIKE '%'||$1||'%') DESC, publico_precio NULLS LAST
    LIMIT 8;`;
  const r = await c.query(sql, [q]);
  await c.end();
  console.log(JSON.stringify(r.rows));
})().catch(e => { console.error(JSON.stringify({error: e.message})); process.exit(1); });

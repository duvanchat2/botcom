(function(){try{require('fs').readFileSync('/root/.hermes/.env','utf8').split('\n').forEach(function(l){var m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2];});}catch(e){}})();
const { Client } = require('pg');
async function telegram(text){
  try{ const r=await fetch(`https://api.telegram.org/bot${process.env.NS_TG_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.NS_TG_CHAT,text})}); const j=await r.json(); return !!(j&&j.ok);}catch(e){return false;}
}
(async () => {
  const d = JSON.parse(process.argv[2] || '{}');
  if(!d.customer_phone){ console.log(JSON.stringify({error:'falta customer_phone'})); return; }
  const c = new Client({ connectionString: process.env.NS_DB_URL });
  await c.connect();
  const ins = await c.query(`INSERT INTO orders
    (customer_name, customer_phone, customer_email, customer_city, customer_department,
     customer_neighborhood, customer_address, address_notes, payment_method,
     items, total_cop, notes, source_wa_id, kapso_conversation_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14)
    RETURNING id, status, created_at;`,
    [d.customer_name||null, d.customer_phone, d.customer_email||null, d.customer_city||null,
     d.customer_department||null, d.customer_neighborhood||null, d.customer_address||null,
     d.address_notes||null, d.payment_method||null, JSON.stringify(d.items||[]),
     d.total_cop||null, d.notes||null, d.source_wa_id||null, d.kapso_conversation_id||null]);
  const order = ins.rows[0];
  const itemsTxt = (d.items||[]).map(i=>`- ${i.cantidad||1}x ${i.nombre||i.sku||''} ($${i.precio_unitario||''})`).join('\n');
  const msg = `\u{1F6D2} NUEVO PEDIDO #${order.id}\nCliente: ${d.customer_name||''} (${d.customer_phone})\nCiudad: ${d.customer_city||''} ${d.customer_department||''}\nBarrio: ${d.customer_neighborhood||''}\nDir: ${d.customer_address||''} ${d.address_notes||''}\nPago: ${d.payment_method||''}\nProductos:\n${itemsTxt}\nTotal: $${d.total_cop||''} COP`;
  const notif = await telegram(msg);
  await c.query("INSERT INTO bot_logs (evento, telefono, detalle) VALUES ($1,$2,$3::jsonb)",
    ['pedido_creado', d.customer_phone, JSON.stringify({order_id:order.id, total_cop:d.total_cop, telegram:notif})]);
  await c.end();
  console.log(JSON.stringify({order, telegram_notificado:notif}));
})().catch(e => { console.error(JSON.stringify({error:e.message})); process.exit(1); });

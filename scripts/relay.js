(function(){try{require('fs').readFileSync('/root/.hermes/.env','utf8').split('\n').forEach(function(l){var m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2];});}catch(e){}})();
const http = require('http');
const fs = require('fs');
const { Client } = require('pg');
const HERMES_PORT = 8648, PORT = 8649;
function norm(n){ return String(n||'').replace(/[^0-9]/g,''); }
function log(s){ try{ fs.appendFileSync('/tmp/relay.log', new Date().toISOString()+' '+s+'\n'); }catch(e){} }
async function telegram(text){
  try{
    if(!process.env.NS_TG_TOKEN||!process.env.NS_TG_CHAT) return false;
    const r=await fetch(`https://api.telegram.org/bot${process.env.NS_TG_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.NS_TG_CHAT,text})});
    const j=await r.json(); return !!(j&&j.ok);
  }catch(e){ log('tg err '+e.message); return false; }
}
function extractNum(b){
  const m = b.message||{}; const d = b.data||{};
  return m.from || (m.kapso&&m.kapso.phone_number)
      || d.from || (d.message&&d.message.from) || (d.kapso&&d.kapso.phone_number)
      || b.from || '';
}
async function gate(numeroRaw){
  const numero = norm(numeroRaw);
  if(!numero) return false;
  const c = new Client({ connectionString: process.env.NS_DB_URL });
  await c.connect();
  try{
    const cfgQ = await c.query("SELECT clave,valor FROM bot_config WHERE clave IN ('limite_gasto_usd_conversacion','costo_estimado_por_mensaje_usd','ventana_conversacion_horas','reactivar_auto_horas')");
    const cfg={}; cfgQ.rows.forEach(r=>cfg[r.clave]=r.valor);
    const limite = parseFloat(cfg.limite_gasto_usd_conversacion||'2') || 2;
    const costoMsg = parseFloat(cfg.costo_estimado_por_mensaje_usd||'0.004') || 0.004;
    const ventanaH = parseFloat(cfg.ventana_conversacion_horas||'12') || 12;
    const reactivarH = parseFloat(cfg.reactivar_auto_horas||'24') || 24;

    const cur = await c.query("SELECT bot_activo, mensajes_conteo, gasto_estimado_usd, ultima_interaccion FROM bot_estado WHERE telefono=$1",[numero]);
    let reactivado=false;
    if(cur.rows.length && cur.rows[0].bot_activo === false){
      const gapMs = Date.now() - new Date(cur.rows[0].ultima_interaccion).getTime();
      if(gapMs > reactivarH*3600*1000){
        // paso la ventana de Meta: reactivar solo (el trigger resetea el contador)
        await c.query("UPDATE bot_estado SET bot_activo=true WHERE telefono=$1",[numero]);
        await c.query("INSERT INTO bot_logs (evento, telefono, detalle) VALUES ('reactivacion_auto',$1,$2::jsonb)",
          [numero, JSON.stringify({gap_horas:+(gapMs/3600000).toFixed(1), reactivar_auto_horas:reactivarH})]);
        log('num='+numero+' REACTIVACION_AUTO gap_h='+(gapMs/3600000).toFixed(1));
        reactivado=true;
      } else {
        await c.query("UPDATE bot_estado SET ultima_interaccion=now() WHERE telefono=$1",[numero]);
        log('num='+numero+' paused=true (ya pausado)');
        return true;
      }
    }
    // conversacion nueva si reactivado o si paso la ventana de inactividad
    const nueva = reactivado || !cur.rows.length || (Date.now() - new Date(cur.rows[0].ultima_interaccion).getTime()) > ventanaH*3600*1000;
    const prevConteo = nueva ? 0 : (cur.rows[0].mensajes_conteo||0);
    const prevGasto = nueva ? 0 : parseFloat(cur.rows[0].gasto_estimado_usd||0);
    const conteo = prevConteo + 1;
    const gasto = +(prevGasto + costoMsg).toFixed(4);
    await c.query(
      "INSERT INTO bot_estado (telefono, ultima_interaccion, mensajes_conteo, gasto_estimado_usd) VALUES ($1, now(), $2, $3) "+
      "ON CONFLICT (telefono) DO UPDATE SET ultima_interaccion=now(), mensajes_conteo=$2, gasto_estimado_usd=$3",
      [numero, conteo, gasto]);

    if(gasto >= limite){
      await c.query("UPDATE bot_estado SET bot_activo=false WHERE telefono=$1",[numero]);
      await c.query("INSERT INTO bot_logs (evento, telefono, detalle) VALUES ('limite_gasto',$1,$2::jsonb)",
        [numero, JSON.stringify({gasto_estimado_usd:gasto, limite_usd:limite, mensajes:conteo})]);
      const notif = await telegram(`🛑 LIMITE DE GASTO alcanzado
Cliente: ${numero}
Gasto estimado: $${gasto} USD (tope $${limite})
Mensajes: ${conteo}
El bot quedo PAUSADO — atender manual.`);
      log('num='+numero+' LIMITE_GASTO gasto='+gasto+' tg='+notif);
      return true;
    }
    log('num='+numero+' paused=false conteo='+conteo+' gasto='+gasto+(reactivado?' (reactivado)':''));
    return false;
  } finally { await c.end(); }
}

const server = http.createServer((req,res)=>{
  const chunks=[]; req.on('data',d=>chunks.push(d));
  req.on('end', async ()=>{
    const raw = Buffer.concat(chunks);
    let paused=false;
    if(req.method==='POST' && req.url.indexOf('/kapso/webhook')===0){
      try{ const b=JSON.parse(raw.toString('utf8')||'{}'); const num=extractNum(b);
        if(num){ paused=await gate(num); } else { log('sin numero: '+raw.toString('utf8').slice(0,160)); }
      }catch(e){ paused=false; log('parse err '+e.message); }
    }
    if(paused){ res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({status:'ok',bot:'off'})); return; }
    const opts={hostname:'127.0.0.1',port:HERMES_PORT,path:req.url,method:req.method,headers:req.headers};
    const p=http.request(opts,pr=>{res.writeHead(pr.statusCode,pr.headers);pr.pipe(res);});
    p.on('error',()=>{res.writeHead(502);res.end('relay upstream error');});
    if(raw.length)p.write(raw); p.end();
  });
});
server.listen(PORT,'127.0.0.1',()=>console.log('relay 8649'));

(function(){try{require('fs').readFileSync('/root/.hermes/.env','utf8').split('\n').forEach(function(l){var m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2];});}catch(e){}})();
const fs = require('fs');
const { execSync } = require('child_process');
const OFFSET='/root/.hermes/.errores_offset';
const RX=/(error|exception|traceback|failed|fatal|crash|\b402\b|\b500\b|\b502\b|ECONNREFUSED|unhandled)/i;
const IGNORE=/(reasoning_effort|verbose|no error|0 error|pruning stale|left by a crashed gateway|Home-channel startup notification|gateway_restart_notification|Telegram polling|Telegram network error|telegram_platform|polling reconnect|polling heartbeat)/i;
async function telegram(text){
  try{ const r=await fetch(`https://api.telegram.org/bot${process.env.NS_TG_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.NS_TG_CHAT,text})}); const j=await r.json(); return !!(j&&j.ok);}catch(e){return false;}
}
function since(){ try{ return fs.readFileSync(OFFSET,'utf8').trim(); }catch(e){ return ''; } }
function grab(unit, sinceTs){
  try{
    const arg = sinceTs ? `--since "${sinceTs}"` : '--since "-15 min"';
    const out = execSync(`journalctl -u ${unit} ${arg} --no-pager -o short-iso 2>/dev/null || true`,{encoding:'utf8',maxBuffer:5*1024*1024});
    return out.split('\n').filter(l=>RX.test(l)&&!IGNORE.test(l));
  }catch(e){ return []; }
}
(async () => {
  const sinceTs = since();
  let lines = [].concat(grab('hermes-gateway',sinceTs), grab('ns-bot-relay',sinceTs));
  // relay.log (errores del relay)
  try{
    const rl = fs.readFileSync('/tmp/relay.log','utf8').split('\n').filter(l=>/err/i.test(l));
    lines = lines.concat(rl.slice(-30));
  }catch(e){}
  // dedupe + limitar
  lines = [...new Set(lines)].slice(-25);
  fs.writeFileSync(OFFSET, new Date().toISOString());
  if(!lines.length){ console.log(JSON.stringify({errores:0})); return; }
  let body = lines.join('\n');
  if(body.length>3200) body = body.slice(-3200);
  const notif = await telegram(`\u{1F41E} ERRORES/LOGS del bot (${lines.length} lineas):\n`+body);
  console.log(JSON.stringify({errores:lines.length, telegram:notif}));
})().catch(e => { console.error(JSON.stringify({error:e.message})); process.exit(1); });

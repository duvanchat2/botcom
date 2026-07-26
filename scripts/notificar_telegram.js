(function(){if(!process.env.NS_TG_TOKEN){try{require('fs').readFileSync('/root/.hermes/.env','utf8').split('\n').forEach(function(l){var m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2];});}catch(e){}}})();
const text=(process.argv.slice(2).join(' ')).trim()||'(mensaje vacio)';
fetch(`https://api.telegram.org/bot${process.env.NS_TG_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.NS_TG_CHAT,text})})
  .then(r=>r.json()).then(j=>console.log(JSON.stringify({ok:!!(j&&j.ok),desc:j&&j.description})))
  .catch(e=>{console.error(JSON.stringify({error:e.message}));process.exit(1);});

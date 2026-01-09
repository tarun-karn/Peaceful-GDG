const dns = require('dns').promises;
const fs = require('fs');

async function checkSrv() {
  const host = 'cluster0.iphpfrm.mongodb.net';
  let output = '';
  try {
    const records = await dns.resolveSrv(`_mongodb._tcp.${host}`);
    records.forEach(r => {
      output += `Target: ${r.name}, Port: ${r.port}\n`;
    });
    // Also get the TXT record for options
    try {
      const txt = await dns.resolveTxt(host);
      output += `TXT Records: ${JSON.stringify(txt)}\n`;
    } catch (e) {}
  } catch (err) {
    output = `Error: ${err.message}`;
  }
  fs.writeFileSync('dns_output.txt', output);
}

checkSrv();

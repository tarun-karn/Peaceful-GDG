const dns = require('dns').promises;
const fs = require('fs');
async function go() {
  const r = await dns.resolveSrv('_mongodb._tcp.cluster0.iphpfrm.mongodb.net');
  const t = await dns.resolveTxt('cluster0.iphpfrm.mongodb.net');
  fs.writeFileSync('final_dns.txt', JSON.stringify({srv: r, txt: t}, null, 2));
}
go();

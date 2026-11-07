// Çöp Adam Savaşı oda sunucusu. Kurulum: npm i ws && node server.js
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: process.env.PORT || 8080 });
const rooms = new Map();
const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode = () => { let c; do { c = Array.from({ length: 4 }, () => A[Math.random() * A.length | 0]).join(''); } while (rooms.has(c)); return c; };
const send = (ws, o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };
wss.on('connection', ws => {
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.t === 'create') {
      const c = newCode(); rooms.set(c, { a: ws, b: null }); ws.room = c;
      send(ws, { t: 'created', code: c });
    } else if (m.t === 'join') {
      const c = String(m.code || '').toUpperCase(), r = rooms.get(c);
      if (!r) return send(ws, { t: 'error', msg: 'Oda bulunamadı.' });
      if (r.b) return send(ws, { t: 'error', msg: 'Oda dolu.' });
      r.b = ws; ws.room = c; send(r.a, { t: 'start' }); send(r.b, { t: 'start' });
    } else if (m.t === 'act') {
      const r = rooms.get(ws.room); if (!r) return;
      send(r.a === ws ? r.b : r.a, { t: 'act', k: m.k, ty: m.ty, c: m.c });
    }
  });
  ws.on('close', () => {
    const r = rooms.get(ws.room); if (!r) return;
    const o = r.a === ws ? r.b : r.a; if (o) o.close(); rooms.delete(ws.room);
  });
});
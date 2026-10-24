import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const allowed=new Set(['index.html','style.css','app.mjs','algorithms.mjs','lessons.mjs']);
const types={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',mjs:'text/javascript; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  try {
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';
    if(!allowed.has(path)){res.writeHead(404);res.end('Not found');return;}
    const data=await readFile(fileURLToPath(new URL(path,import.meta.url)));
    res.writeHead(200,{'Content-Type':types[path.split('.').at(-1)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);
  }catch{res.writeHead(400);res.end('Bad request');}
});
server.listen(Number(process.env.PORT)||5173,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${server.address().port}`));

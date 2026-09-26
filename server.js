const http=require('http'),fs=require('fs'),path=require('path');
const ROOT='/Users/ishaandas/Documents/SP_Claude/valle-drafting';
const TYPES={'.html':'text/html; charset=utf-8','.png':'image/png','.js':'text/javascript','.css':'text/css'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);
  if(p==='/')p='/index.html';
  const f=path.join(ROOT,path.normalize(p).replace(/^(\.\.[/\\])+/,''));
  fs.readFile(f,(err,data)=>{
    if(err){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('Not found');}
    res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(data);
  });
}).listen(4900,()=>console.log('valle-drafting on http://localhost:4900'));

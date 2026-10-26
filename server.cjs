// 零依赖本地静态服务器；只暴露前端白名单文件，不暴露 .git、.env 等文件。
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const allowed={'/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/analytics.js':'analytics.js','/data.js':'data.js','/app.js':'app.js'};
const types={'.html':'text/html','.css':'text/css','.js':'application/javascript'};
const server=http.createServer((req,res)=>{const file=allowed[new URL(req.url,'http://localhost').pathname];if(!file){res.writeHead(404);res.end('Not found');return;}fs.readFile(path.join(__dirname,file),(error,data)=>{if(error){res.writeHead(500);res.end('File unavailable');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);});});
server.listen(Number(process.env.PORT)||3000,'127.0.0.1',()=>console.log('SVP 看板已启动：http://localhost:'+(Number(process.env.PORT)||3000)+'（Ctrl+C 停止）'));

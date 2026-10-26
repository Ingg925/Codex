const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../analytics.js'),D=require('../data.js');
test('模拟数据可重复且通过契约校验',()=>{assert.deepEqual(D.mock(),D.mock());assert.equal(D.validate(D.mock()).length,224);});
test('全部维度 AND 筛选且日期包含首尾',()=>{const rows=D.mock(),f={start:'2026-10-13',end:'2026-10-26',channel:'X',kol:'KOL-A',campaign:'交易赛'},r=A.filter(rows,f);assert.equal(r.length,14);assert(r.every(x=>x.channel==='X'&&x.kol==='KOL-A'&&x.campaign==='交易赛'));assert.equal(r[0].date,f.start);assert.equal(r.at(-1).date,f.end);});
test('互斥组合与零分母安全',()=>{assert.equal(A.filter(D.mock(),{channel:'自然访问',kol:'KOL-A'}).length,0);assert.equal(A.rate(0,0),null);assert.equal(A.sum([]).traders,0);});
test('渠道分组合计与首页一致且成本比率不求平均',()=>{const rows=A.filter(D.mock(),{start:'2026-10-13'}),total=A.sum(rows),groups=A.group(rows,'channel');for(const field of A.fields)assert.equal(groups.reduce((n,r)=>n+r[field],0),total[field]);assert.equal(A.rate(100,4),25);});
test('拒绝负数、漏斗逆序、重复行和无效日期',()=>{const row=D.mock()[0];for(const patch of [{visits:-1},{traders:99999},{date:'2026-02-30'},{registrations:1.5}])assert.throws(()=>D.validate([{...row,...patch}]));assert.throws(()=>D.validate([row,row]));});
test('CSV 包含 BOM、中文标题与当前渠道',()=>{const csv=A.csv(A.filter(D.mock(),{channel:'X'}));assert(csv.startsWith('\ufeff'));assert(csv.includes('首单CAC_USD'));assert(csv.includes('"X"'));assert(!csv.includes('Telegram'));});
test('真实 API 错误不会静默回退模拟数据',async()=>{const old=global.fetch;global.fetch=async()=>({ok:false,status:503});try{await assert.rejects(D.load({mode:'api'}),/503/);}finally{global.fetch=old;}});

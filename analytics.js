/* 浏览器和 Node 测试共用的纯计算模块。 */
(function(root){
  const fields=['visits','registrations','deposits','traders','shareClicks','inviteRegistrations','inviteDeposits','inviteTraders','volume','fees','depositAmount','withdrawalAmount','cost'];
  function filter(rows,f={}) {return rows.filter(r=>(!f.start||r.date>=f.start)&&(!f.end||r.date<=f.end)&&['channel','kol','campaign'].every(k=>!f[k]||r[k]===f[k]));}
  function sum(rows){return rows.reduce((a,r)=>{fields.forEach(k=>a[k]+=r[k]);return a;},Object.fromEntries(fields.map(k=>[k,0])));}
  function rate(n,d){return d>0?n/d:null;}
  function group(rows,key){return [...new Set(rows.map(r=>r[key]))].map(name=>({name,...sum(rows.filter(r=>r[key]===name))})).sort((a,b)=>b.traders-a.traders);}
  function csv(rows){const header=['渠道','访问人数','注册人数','首充人数','首单人数','访问到首单转化率','费用USD','首单CAC_USD'];return '\ufeff'+[header,...group(rows,'channel').map(r=>[r.name,r.visits,r.registrations,r.deposits,r.traders,rate(r.traders,r.visits)??'',r.cost,rate(r.cost,r.traders)??''])].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');}
  const api={fields,filter,sum,rate,group,csv}; if(typeof module!=='undefined')module.exports=api;root.SVPAnalytics=api;
})(globalThis);

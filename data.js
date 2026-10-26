/* 所有名称、费用、用户与交易数据均为虚构。固定种子使演示可重复。 */
(function(root){
  const sources=[['X','KOL-A','交易赛'],['X','KOL-B','空投'],['Telegram','KOL-A','AMA'],['Discord','无 KOL','邀请活动'],['广告','无 KOL','空投'],['自然访问','无 KOL','无活动'],['合作伙伴','KOL-C','交易赛'],['未知来源','无 KOL','无活动']];
  function mock(){let seed=925;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const rows=[];
    for(let day=0;day<28;day++)for(let s=0;s<sources.length;s++){
      const date=new Date(Date.UTC(2026,8,29+day)).toISOString().slice(0,10);
      const visits=Math.floor(90+random()*240+day*4),registrations=Math.floor(visits*(.12+random()*.2)),deposits=Math.floor(registrations*(.25+random()*.3)),traders=Math.floor(deposits*(.55+random()*.35));
      const inviteRegistrations=Math.floor(registrations*.22),inviteDeposits=Math.floor(deposits*.22),inviteTraders=Math.floor(traders*.22),volume=traders*(1800+Math.floor(random()*8000));
      rows.push({date,channel:sources[s][0],kol:sources[s][1],campaign:sources[s][2],visits,registrations,deposits,traders,shareClicks:Math.floor(visits*.3),inviteRegistrations,inviteDeposits,inviteTraders,volume,fees:Math.round(volume*.0003),depositAmount:deposits*320,withdrawalAmount:deposits*90,cost:s===5||s===7?0:Math.round(70+random()*200)});
    }return rows;
  }
  function validate(rows){if(!Array.isArray(rows))throw Error('接口必须返回 rows 数组');const keys=['visits','registrations','deposits','traders','shareClicks','inviteRegistrations','inviteDeposits','inviteTraders','volume','fees','depositAmount','withdrawalAmount','cost'];const seen=new Set();
    rows.forEach(r=>{if(!r||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(Date.parse(r.date))||new Date(r.date).toISOString().slice(0,10)!==r.date||['channel','kol','campaign'].some(k=>typeof r[k]!=='string'||!r[k]))throw Error('日期或维度不合法');
      if(keys.some(k=>!Number.isFinite(r[k])||r[k]<0))throw Error('指标需为非负数');
      if(keys.slice(0,8).some(k=>!Number.isInteger(r[k])))throw Error('人数必须为整数');
      if(r.visits<r.registrations||r.registrations<r.deposits||r.deposits<r.traders||r.inviteRegistrations>r.registrations||r.inviteDeposits>r.deposits||r.inviteTraders>r.traders||r.inviteRegistrations<r.inviteDeposits||r.inviteDeposits<r.inviteTraders)throw Error('转化人数关系不合法');
      const id=JSON.stringify([r.date,r.channel,r.kol,r.campaign]);if(seen.has(id))throw Error('重复的聚合行');seen.add(id);});return rows;
  }
  async function load(config={mode:'mock'}){if(config.mode==='mock')return {rows:validate(mock()),mode:'mock',asOf:'2026-10-26',timezone:'Asia/Shanghai'};
    if(config.mode!=='api')throw Error('未知数据模式');const response=await fetch(config.endpoint||'/api/marketing',{signal:AbortSignal.timeout(15000),credentials:'same-origin'});if(!response.ok)throw Error('数据接口错误：'+response.status);const data=await response.json();if(data.timezone!=='Asia/Shanghai'||!/^\d{4}-\d{2}-\d{2}$/.test(data.asOf))throw Error('接口缺少统计时区或截止日期');return {...data,rows:validate(data.rows),mode:'api'};
  }
  const api={mock,validate,load};if(typeof module!=='undefined')module.exports=api;root.SVPData=api;
})(globalThis);

/* 考勤数据中心：员工端(index.html)和后台(hr.html)共用。
   目前数据存在浏览器里（演示用）；以后接真正的数据库只需要改这个文件。 */
const DB=(()=>{
const KEY='hr_v2';
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const addDays=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return ymd(d)};
const at=(date,t)=>new Date(date+'T'+t+':00');
const hm=d=>pad(d.getHours())+':'+pad(d.getMinutes());
const dow=s=>new Date(s+'T12:00').getDay();
let S,idx={},uid=0;
const nid=p=>p+Date.now().toString(36)+(uid++).toString(36)+Math.floor(Math.random()*1e4).toString(36);
const PRESENT=['正常','迟到','早退','迟到早退','漏打卡','上班中','休息日出勤'];

function reindex(){idx={};S.records.forEach(r=>{const k=r.empId+'|'+ymd(new Date(r.t));(idx[k]=idx[k]||[]).push(r)});Object.values(idx).forEach(a=>a.sort((x,y)=>x.t<y.t?-1:1))}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){console.warn('保存失败',e)}reindex()}
function load(){let d=null;try{d=JSON.parse(localStorage.getItem(KEY))}catch(e){}S=d&&d.employees?d:seed();reindex();if(!d)save()}
function reload(){load()}
function prevWork(d){let x=addDays(d,-1);while(dow(x)%6===0)x=addDays(x,-1);return x}

/* ---------- 示范数据 ---------- */
function seed(){
  let s=42;const r=()=>{s=(s*1664525+1013904223)%4294967296;return s/4294967296};
  const today=ymd(new Date()),now=new Date();
  const shifts=[{id:'A',name:'日班',start:'09:00',end:'18:00',color:'#2f8cf0'},{id:'B',name:'早班',start:'08:00',end:'17:00',color:'#1fa760'},{id:'C',name:'晚班',start:'14:00',end:'23:00',color:'#a45be8'}];
  const E=[['e1','Tiffany Ng','销售部','employee','e2','A',22],['e2','Daniel Lim','销售部','manager','e12','A',35],['e3','Aisyah Rahman','销售部','employee','e2','A',20],['e4','Kumar Raj','销售部','employee','e2','A',20],
   ['e5','Mei Ling Tan','生产部','manager','e12','B',32],['e6','Hafiz Ismail','生产部','employee','e5','B',18],['e7','Chong Wei','生产部','employee','e5','B',18],['e8','Siti Nurhaliza','生产部','employee','e5','C',19],['e13','Amir Hakim','生产部','employee','e5','C',19],
   ['e9','Jason Wong','财务部','manager','e12','A',34],['e10','Priya Nair','财务部','employee','e9','A',24],['e11','Lucas Chan','财务部','employee','e9','A',24],['e12','Shannie Lee','人事部','hr',null,'A',36]]
   .map(([id,name,dept,role,managerId,shiftId,rate])=>({id,name,dept,role,managerId,shiftId,rate}));
  const D={employees:E,shifts,schedule:{},records:[],requests:[],audit:[],office:null,cfg:{grace:5,otMin:30,otMult:1.5}};
  const sh=id=>shifts.find(x=>x.id===id);
  const meth=['GPS定位','GPS定位','GPS定位','WiFi','NFC'];
  const start=e=>e.role==='employee'?'pm':'hr';
  const P=(e,type,t)=>D.records.push({id:nid('r'),empId:e.id,type,t:t.toISOString(),method:meth[Math.floor(r()*5)],dist:10+Math.floor(r()*110),face:r()>.03,photo:null,source:'self',byId:e.id,note:''});
  const Q=o=>D.requests.push(Object.assign({id:nid('q'),created:new Date(at(o.date,'09:00').getTime()-864e5).toISOString(),history:[]},o));
  for(let i=34;i>=0;i--){const d=addDays(today,-i),w=dow(d);if(w===0||w===6)continue;
    for(const e of E){const s0=sh(e.shiftId),st=at(d,s0.start),en=at(d,s0.end),x=r();
      if(x<.03)continue;
      if(x<.06&&d!==today){Q({type:'leave',empId:e.id,date:d,to:d,days:1,kind:r()<.5?'年假':'病假',reason:'个人事务',status:'ok',history:[{by:e.managerId||'e12',act:'ok',t:new Date().toISOString()}]});continue}
      const late=r()<.12,delay=late?6+Math.floor(r()*35):Math.floor(r()*8)-6;
      const inT=new Date(st.getTime()+delay*6e4);if(d===today&&inT>now)continue;
      P(e,'in',inT);
      const z=r();let outT;
      if(z<.18)outT=new Date(en.getTime()+(35+Math.floor(r()*110))*6e4);
      else if(z<.24)outT=new Date(en.getTime()-(15+Math.floor(r()*40))*6e4);
      else outT=new Date(en.getTime()+(Math.floor(r()*10)-3)*6e4);
      if(d===today&&outT>now)continue;
      if(d!==today&&r()<.02)continue;
      P(e,'out',outT);
      if(z<.18){const q=r();Q({type:'overtime',empId:e.id,date:d,hours:Math.max(.5,Math.round((outT-en)/36e5*2)/2),reason:'赶货 / 客户项目',status:i<3?start(e):(q<.78?'ok':'no'),history:i<3?[]:[{by:e.managerId||'e12',act:q<.78?'ok':'no',t:new Date().toISOString()}]})}
    }}
  // 一条“主管协助打卡”示范
  const ar=D.records.find(x=>x.empId==='e4'&&x.type==='in');if(ar){ar.source='assist';ar.byId='e2';ar.note='手机没电，主管协助打卡';ar.face=false}
  const pw=prevWork(today);
  Q({type:'leave',empId:'e3',date:addDays(today,3),to:addDays(today,4),days:2,kind:'年假',reason:'家庭旅行',status:'pm'});
  Q({type:'leave',empId:'e10',date:addDays(today,7),to:addDays(today,9),days:3,kind:'年假',reason:'回乡',status:'hr',history:[{by:'e9',act:'ok',t:new Date().toISOString()}]});
  Q({type:'overtime',empId:'e6',date:today,hours:2,reason:'设备维修',status:'pm'});
  Q({type:'fix',empId:'e7',date:pw,ptype:'out',time:'17:05',reason:'忘记打下班卡',status:'pm'});
  Q({type:'fix',empId:'e11',date:pw,ptype:'in',time:'09:00',reason:'手机没电，无法上班打卡',status:'hr',history:[{by:'e9',act:'ok',t:new Date().toISOString()}]});
  return D;
}

/* ---------- 基础查询 ---------- */
const emp=id=>S.employees.find(e=>e.id===id);
function shiftCode(id,date){const o=S.schedule[id]&&S.schedule[id][date];if(o!==undefined)return o;return dow(date)%6===0?'OFF':emp(id).shiftId}
function shiftOf(id,date){const c=shiftCode(id,date);return c==='OFF'?null:(S.shifts.find(x=>x.id===c)||null)}

/* 某人某天的考勤结果：核心规则都在这里 */
function summary(id,date){
  const sh=shiftOf(id,date),recs=idx[id+'|'+date]||[],now=new Date(),today=ymd(now),cfg=S.cfg;
  const b={id,date,sh,recs,flags:[],late:0,early:0,workMin:0,otRaw:0,otOk:0,inT:null,outT:null,status:''};
  const inR=recs.find(r=>r.type==='in'),outR=[...recs].reverse().find(r=>r.type==='out'&&(!inR||r.t>inR.t));
  b.inT=inR?new Date(inR.t):null;b.outT=outR?new Date(outR.t):null;b.inR=inR;b.outR=outR;
  const lv=S.requests.find(q=>q.type==='leave'&&q.empId===id&&q.status==='ok'&&q.date<=date&&date<=q.to);
  if(lv){b.status='请假';b.leave=lv;return b}
  const otReq=S.requests.filter(q=>q.type==='overtime'&&q.empId===id&&q.date===date&&q.status==='ok').reduce((a,q)=>a+q.hours*60,0);
  if(!sh){
    b.status=recs.length?'休息日出勤':'休息';
    if(b.inT&&b.outT){b.workMin=Math.round((b.outT-b.inT)/6e4);b.otRaw=b.workMin;b.otOk=Math.min(b.otRaw,otReq)}
    return b}
  const st=at(date,sh.start),en=at(date,sh.end);
  if(!b.inT){
    if(b.outT){b.status='漏打卡';b.flags.push('缺上班卡')}
    else if(date<today)b.status='缺勤';
    else if(date>today)b.status='未开始';
    else b.status=now<st?'未上班':'未到岗';
    return b}
  b.late=Math.round((b.inT-st)/6e4);if(b.late<=cfg.grace)b.late=0;
  if(b.outT){b.early=Math.round((en-b.outT)/6e4);if(b.early<=cfg.grace)b.early=0;b.workMin=Math.round((b.outT-b.inT)/6e4)}
  else if(date===today)b.workMin=Math.max(0,Math.round((now-b.inT)/6e4));
  if(b.workMin>300)b.workMin-=60;
  if(b.outT){b.otRaw=Math.max(0,Math.round((b.outT-en)/6e4));if(b.otRaw<cfg.otMin)b.otRaw=0}
  b.otOk=Math.min(b.otRaw,otReq);
  if(!b.outT&&date<today){b.status='漏打卡';b.flags.push('缺下班卡')}
  else if(!b.outT)b.status='上班中';
  else b.status=b.late&&b.early?'迟到早退':b.late?'迟到':b.early?'早退':'正常';
  if(recs.some(r=>r.source==='assist'))b.flags.push('主管协助');
  if(recs.some(r=>r.source==='fix'||r.source==='edit'))b.flags.push('已更正');
  return b}

/* 一段日期内的统计 */
function stats(id,dates){
  const o={due:0,present:0,late:0,lateMin:0,early:0,absent:0,leave:0,miss:0,workMin:0,otRaw:0,otOk:0,rest:0};
  dates.forEach(d=>{const x=summary(id,d);
    if(x.status==='请假')o.leave++;
    if(['休息','未开始','未上班','请假'].includes(x.status)){if(x.status==='休息')o.rest++;}
    else if(x.sh)o.due++;
    if(PRESENT.includes(x.status))o.present++;
    if(x.late){o.late++;o.lateMin+=x.late}
    if(x.early)o.early++;
    if(x.status==='缺勤'||x.status==='未到岗')o.absent++;
    if(x.status==='漏打卡')o.miss++;
    o.workMin+=x.workMin;o.otRaw+=x.otRaw;o.otOk+=x.otOk});
  o.rate=o.due?Math.min(1,o.present/o.due):1;return o}

/* ---------- 打卡 ---------- */
function nextType(id){const a=idx[id+'|'+ymd(new Date())]||[];return a.length&&a[a.length-1].type==='in'?'out':'in'}
function punch(id,type,o){const rec=Object.assign({id:nid('r'),empId:id,type,method:'GPS定位',dist:0,face:false,photo:null,source:'self',byId:id,note:''},o||{});
  rec.t=((o&&o.t)||new Date()).toISOString();S.records.push(rec);save();return rec}
function audit(byId,action,detail){S.audit.unshift({id:nid('a'),t:new Date().toISOString(),byId,action,detail});}
function editRecord(rid,patch,byId,reason){const r=S.records.find(x=>x.id===rid);if(!r)return;const old=`${r.type==='in'?'上班':'下班'} ${new Date(r.t).toLocaleString()}`;
  Object.assign(r,patch);if(patch.t)r.t=patch.t.toISOString();r.source='edit';r.note=reason;
  audit(byId,'修改',`${emp(r.empId).name}：${old} → ${r.type==='in'?'上班':'下班'} ${new Date(r.t).toLocaleString()}；原因：${reason}`);save()}
function deleteRecord(rid,byId,reason){const i=S.records.findIndex(x=>x.id===rid);if(i<0)return;const r=S.records[i];
  audit(byId,'删除',`${emp(r.empId).name}：${r.type==='in'?'上班':'下班'} ${new Date(r.t).toLocaleString()}；原因：${reason}`);S.records.splice(i,1);save()}
function addRecord(id,type,t,byId,reason,source){const r=punch(id,type,{t,source:source||'edit',byId,note:reason,method:'人工',face:false});
  audit(byId,source==='assist'?'协助打卡':'新增',`${emp(id).name}：${type==='in'?'上班':'下班'} ${t.toLocaleString()}；原因：${reason}`);save();return r}

/* ---------- 审批 ---------- */
const stepName={pm:'待主管审批',hr:'待HR审批',ok:'已批准',no:'已拒绝'};
function addRequest(o){const e=emp(o.empId);const q=Object.assign({id:nid('q'),created:new Date().toISOString(),history:[],status:e.role==='employee'?'pm':'hr'},o);
  if(q.status==='pm'&&!e.managerId)q.status='hr';S.requests.unshift(q);save();return q}
function canDecide(q,me){if(q.status==='pm')return me.role==='hr'||emp(q.empId).managerId===me.id;if(q.status==='hr')return me.role==='hr';return false}
function decide(qid,byId,ok,comment){const q=S.requests.find(x=>x.id===qid);if(!q)return;const me=emp(byId);if(!canDecide(q,me))return false;
  const from=q.status;
  if(!ok)q.status='no';
  else if(from==='pm'&&me.role!=='hr'&&q.type!=='overtime')q.status='hr';
  else q.status='ok';
  q.history.push({by:byId,act:ok?'ok':'no',t:new Date().toISOString(),comment:comment||''});
  if(q.status==='ok'&&q.type==='fix'){const r=punch(q.empId,q.ptype,{t:at(q.date,q.time),source:'fix',byId,method:'补卡',note:'补卡申请：'+q.reason});}
  save();return true}

/* ---------- 排班 ---------- */
function setShift(id,date,code){const def=dow(date)%6===0?'OFF':emp(id).shiftId;
  S.schedule[id]=S.schedule[id]||{};if(code===def)delete S.schedule[id][date];else S.schedule[id][date]=code;save()}

function reset(){localStorage.removeItem(KEY);load();save()}
load();
window.addEventListener('storage',e=>{if(e.key===KEY){load()}});
return {S:()=>S,reload,save,reset,emp,employees:()=>S.employees,shifts:()=>S.shifts,shiftOf,shiftCode,summary,stats,nextType,punch,addRecord,editRecord,deleteRecord,audit,addRequest,decide,canDecide,stepName,setShift,
  records:()=>S.records,requests:()=>S.requests,cfg:()=>S.cfg,office:()=>S.office,setOffice:o=>{S.office=o;save()},PRESENT,
  util:{pad,ymd,addDays,at,hm,dow,prevWork,nid}}})();

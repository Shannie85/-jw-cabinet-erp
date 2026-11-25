/* 考勤数据中心（连接 Supabase 线上数据库）。员工端(index.html)和后台(hr.html)共用。
   做法：登录后把"我有权限看的数据"一次读进内存，之后的计算（迟到、加班、出勤率…）都在内存里完成；
   所有修改都交给数据库，由数据库再检查一次权限。 */
const SUPA_URL='https://afrpwfmjrlarzqbzhsgc.supabase.co';
const SUPA_KEY='sb_publishable_5n2ZFRKNVgk20S2tiAn0rw_qyAH4mHz';
const DB=(()=>{
const sb=supabase.createClient(SUPA_URL,SUPA_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const addDays=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return ymd(d)};
const at=(date,t)=>new Date(date+'T'+t+':00');
const hm=d=>pad(d.getHours())+':'+pad(d.getMinutes());
const dow=s=>new Date(s+'T12:00').getDay();
const prevWork=d=>{let x=addDays(d,-1);while(dow(x)%6===0)x=addDays(x,-1);return x};
const PRESENT=['正常','迟到','早退','迟到早退','漏打卡','上班中','休息日出勤'];
const stepName={pm:'待主管审批',hr:'待HR审批',ok:'已批准',no:'已拒绝'};
let S={employees:[],shifts:[],schedule:{},records:[],requests:[],audit:[],office:null,cfg:{grace:5,otMin:30,otMult:1.5}};
let idx={},meId=null;
const must=({data,error})=>{if(error){const m=error.message||String(error);throw new Error(/duplicate key/.test(m)&&/email/.test(m)?'这个邮箱已经注册过了':m)}return data};
const normT=t=>new Date(t).toISOString();

function reindex(){idx={};S.records.forEach(r=>{const k=r.empId+'|'+ymd(new Date(r.t));(idx[k]=idx[k]||[]).push(r)});Object.values(idx).forEach(a=>a.sort((x,y)=>x.t<y.t?-1:1))}
async function fetchAll(make){const out=[];for(let i=0;;i+=1000){const d=must(await make().range(i,i+999));out.push(...d);if(d.length<1000)break}return out}

/* 把线上数据读进内存 */
async function reload(){
  const since=addDays(ymd(new Date()),-100)+'T00:00:00';
  const [pr,co,sh,so,se,pu,rq,au]=await Promise.all([
    sb.from('profiles').select('*').then(must),
    sb.from('compensation').select('*').then(must),
    sb.from('shifts').select('*').order('id').then(must),
    fetchAll(()=>sb.from('schedule_overrides').select('*').order('work_date')),
    sb.from('settings').select('*').then(must),
    fetchAll(()=>sb.from('punches').select('id,emp_id,type,t,method,dist,face,has_photo,source,by_id,note').gte('t',since).order('t')),
    fetchAll(()=>sb.from('requests').select('*').order('created_at',{ascending:false})),
    sb.from('audit').select('*').order('t',{ascending:false}).limit(300).then(r=>r.error?[]:r.data)]);
  const rate={};co.forEach(c=>rate[c.emp_id]=+c.rate);
  S.employees=pr.map(p=>({id:p.id,name:p.name,dept:p.dept,role:p.role,managerId:p.manager_id,shiftId:p.shift_id,rate:rate[p.id]||0,email:p.email,active:p.active,avatar:p.avatar||null}));
  S.shifts=sh.map(s=>({id:s.id,name:s.name,start:s.start_time,end:s.end_time,color:s.color}));
  S.schedule={};so.forEach(o=>{(S.schedule[o.emp_id]=S.schedule[o.emp_id]||{})[o.work_date]=o.code});
  const st={};se.forEach(x=>st[x.key]=x.value);
  S.office=st.office||null;S.cfg=Object.assign({grace:5,otMin:30,otMult:1.5},st.cfg||{});
  S.records=pu.map(r=>({id:r.id,empId:r.emp_id,type:r.type,t:normT(r.t),method:r.method,dist:r.dist,face:r.face,hasPhoto:r.has_photo,source:r.source,byId:r.by_id,note:r.note}));
  S.requests=rq.map(q=>({id:q.id,type:q.type,empId:q.emp_id,date:q.date,to:q.to_date||q.date,days:q.days,kind:q.kind,hours:q.hours==null?null:+q.hours,ptype:q.ptype,time:q.time,reason:q.reason,status:q.status,history:q.history||[],created:q.created_at}));
  S.audit=au.map(a=>({id:a.id,t:a.t,byId:a.by_id,action:a.action,detail:a.detail}));
  reindex();
}

/* ---------- 基础查询 ---------- */
const emp=id=>S.employees.find(e=>e.id===id);
const me=()=>emp(meId);
function shiftCode(id,date){const o=S.schedule[id]&&S.schedule[id][date];if(o!==undefined)return o;const e=emp(id);return dow(date)%6===0?'OFF':(e?e.shiftId:'OFF')}
function shiftOf(id,date){const c=shiftCode(id,date);return c==='OFF'?null:(S.shifts.find(x=>x.id===c)||null)}

/* 某人某天的考勤结果：迟到、早退、缺勤、加班等规则都在这里 */
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

function nextType(id){const a=idx[id+'|'+ymd(new Date())]||[];return a.length&&a[a.length-1].type==='in'?'out':'in'}
function canDecide(q,m){if(!m)return false;if(q.status==='pm')return m.role==='hr'||(emp(q.empId)&&emp(q.empId).managerId===m.id);if(q.status==='hr')return m.role==='hr';return false}

/* ---------- 修改（都交给数据库，并由数据库再检查权限） ---------- */
async function punch(id,type,o){o=o||{};
  must(await sb.from('punches').insert({emp_id:id,type,method:o.method||'GPS定位',face:!!o.face,photo:o.photo||null,lat:o.lat,lng:o.lng,source:'self'}));
  await reload()}
async function photo(rid){const d=must(await sb.from('punches').select('photo').eq('id',rid).single());return d.photo}
async function addRecord(empId,type,t,byId,reason,source){must(await sb.rpc('add_punch',{p_emp:empId,p_type:type,p_t:t.toISOString(),p_source:source||'edit',p_reason:reason}));await reload()}
async function editRecord(rid,patch,byId,reason){const r=S.records.find(x=>x.id===rid);must(await sb.rpc('edit_punch',{p_id:rid,p_type:patch.type||r.type,p_t:(patch.t||new Date(r.t)).toISOString(),p_reason:reason}));await reload()}
async function deleteRecord(rid,byId,reason){must(await sb.rpc('delete_punch',{p_id:rid,p_reason:reason}));await reload()}
async function addRequest(o){
  const row={type:o.type,emp_id:o.empId,date:o.date,reason:o.reason};
  if(o.type==='leave'){row.to_date=o.to;row.days=o.days;row.kind=o.kind}
  if(o.type==='overtime')row.hours=o.hours;
  if(o.type==='fix'){row.ptype=o.ptype;row.time=o.time}
  const d=must(await sb.from('requests').insert(row).select('status').single());await reload();return {status:d.status}}
async function decide(qid,byId,ok,comment){must(await sb.rpc('decide_request',{p_id:qid,p_ok:ok,p_comment:comment||''}));await reload();return true}
async function setShifts(changes){/* changes: [{id,date,code}] */
  const up=[],del=[];
  changes.forEach(({id,date,code})=>{const def=dow(date)%6===0?'OFF':emp(id).shiftId;
    S.schedule[id]=S.schedule[id]||{};
    if(code===def){delete S.schedule[id][date];del.push({id,date})}else{S.schedule[id][date]=code;up.push({emp_id:id,work_date:date,code})}});
  if(up.length)must(await sb.from('schedule_overrides').upsert(up));
  for(const d of del)must(await sb.from('schedule_overrides').delete().eq('emp_id',d.id).eq('work_date',d.date))}
const setShift=(id,date,code)=>setShifts([{id,date,code}]);
async function saveShift(s){must(await sb.from('shifts').upsert({id:s.id,name:s.name,start_time:s.start,end_time:s.end,color:s.color}))}
async function addShift(){const id='S'+(S.shifts.length+1);const s={id,name:'新班次',start:'10:00',end:'19:00',color:'#e5484d'};await saveShift(s);S.shifts.push(s)}
async function setOffice(o){must(await sb.from('settings').upsert({key:'office',value:o}));S.office=o}
async function saveCfg(c){must(await sb.from('settings').upsert({key:'cfg',value:c}));S.cfg=c}
async function createUser(o){const uid=must(await sb.rpc('hr_create_user',{p_email:o.email,p_password:o.password,p_name:o.name,p_dept:o.dept,p_role:o.role,p_manager:o.managerId||null,p_shift:o.shiftId||'A',p_rate:o.rate||0}));await reload();return uid}
async function updateUser(id,o){
  must(await sb.from('profiles').update({name:o.name,dept:o.dept,role:o.role,manager_id:o.managerId||null,shift_id:o.shiftId,active:o.active}).eq('id',id));
  must(await sb.from('compensation').upsert({emp_id:id,rate:o.rate||0}));await reload()}
async function setAvatar(id,dataUrl){must(await sb.rpc('set_avatar',{p_user:id,p_avatar:dataUrl}));await reload()}
/* 把选好的照片裁成正方形、缩到 160 像素，变成很小的图片再保存 */
function resizeImage(file,size){size=size||160;return new Promise((ok,no)=>{const img=new Image(),url=URL.createObjectURL(file);
  img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=size;const s=Math.min(img.width,img.height);
    c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,size,size);URL.revokeObjectURL(url);ok(c.toDataURL('image/jpeg',.82))};
  img.onerror=()=>no(new Error('图片打不开'));img.src=url})}
async function setPassword(id,pw){must(await sb.rpc('hr_set_password',{p_user:id,p_password:pw}))}
async function changeMyPassword(pw){const r=await sb.auth.updateUser({password:pw});if(r.error)throw new Error(r.error.message)}

/* ---------- 登录 ---------- */
const CSS=`#loginBox{position:fixed;inset:0;background:linear-gradient(180deg,#2f8cf0,#6bb6ff 60%,#f4f7fb);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,"PingFang SC","Microsoft YaHei",Segoe UI,Roboto,sans-serif}
#loginBox form{background:#fff;border-radius:20px;padding:26px 22px;width:min(380px,100%);box-shadow:0 20px 50px #0003;display:grid;gap:12px;color:#1d2433}
#loginBox .bn{text-align:center;font-weight:700;font-size:15px;letter-spacing:.6px;color:#2f8cf0}#loginBox h2{margin:0;font-size:22px}#loginBox p{margin:0;color:#7b8496;font-size:13px}
#loginBox label{display:grid;gap:4px;font-size:13px;color:#7b8496}
#loginBox input{font:inherit;font-size:16px;padding:12px;border:1px solid #d8dfeb;border-radius:10px;color:#1d2433}
#loginBox button{border:0;border-radius:12px;padding:13px;font-size:16px;font-weight:600;color:#fff;background:#2f8cf0;cursor:pointer}
#loginBox .lk{background:none;color:#2f8cf0;font-size:13px;font-weight:400;padding:2px}
#loginBox .er{color:#e5484d;font-size:13px;min-height:1em}`;
function loginScreen(setup){return new Promise(resolve=>{
  const box=document.createElement('div');box.id='loginBox';
  const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  let mode=setup?'setup':'login';
  const draw=()=>{box.innerHTML=`<form id="lf"><div class="bn">JW Attendance Record</div><h2>${mode==='setup'?'首次设置：创建管理员':'考勤系统登录'}</h2>
   <p>${mode==='setup'?'这是第一次使用。请输入设置码，并创建你自己的管理员（HR）账号。':'请用公司给你的邮箱和密码登录。'}</p>
   ${mode==='setup'?'<label>设置码<input id="lCode" autocomplete="off"></label><label>你的名字<input id="lName"></label>':''}
   <label>邮箱<input id="lMail" type="email" autocomplete="username" inputmode="email"></label>
   <label>密码${mode==='setup'?'（至少 8 位）':''}<input id="lPw" type="password" autocomplete="${mode==='setup'?'new-password':'current-password'}"></label>
   <div class="er" id="lErr"></div><button id="lGo" type="submit">${mode==='setup'?'创建并登录':'登录'}</button>
   ${setup?`<button type="button" class="lk" id="lSw">${mode==='setup'?'已经有账号？去登录':'第一次使用？去设置'}</button>`:''}<button type="button" class="lk" id="lLang">🌐 ${I18N.label()}</button></form>`;
   box.querySelector('#lLang').onclick=()=>I18N.toggle();
   const err=m=>box.querySelector('#lErr').textContent=m;
   if(setup)box.querySelector('#lSw').onclick=()=>{mode=mode==='setup'?'login':'setup';draw()};
   box.querySelector('#lf').onsubmit=async e=>{e.preventDefault();const go=box.querySelector('#lGo');go.disabled=true;err('');
     try{const em=box.querySelector('#lMail').value.trim(),pw=box.querySelector('#lPw').value;
       if(mode==='setup'){must(await sb.rpc('bootstrap_admin',{p_code:box.querySelector('#lCode').value.trim(),p_email:em,p_password:pw,p_name:box.querySelector('#lName').value.trim()||'管理员'}))}
       const r=await sb.auth.signInWithPassword({email:em,password:pw});if(r.error)throw new Error(r.error.message==='Invalid login credentials'?'邮箱或密码不对':r.error.message);
       box.remove();resolve(r.data.session)}catch(x){err(x.message);go.disabled=false}}};
  draw();document.body.appendChild(box)})}

/* 启动：没登录就先登录，登录后读入数据，再交给页面 */
async function boot(start){
  try{
    let {data:{session}}=await sb.auth.getSession();
    if(!session){let setup=false;try{const r=await sb.rpc('needs_setup');setup=r.data===true}catch(e){}
      session=await loginScreen(setup)}
    meId=session.user.id;
    await reload();
    if(!me()){await sb.auth.signOut();document.body.innerHTML='<p style="padding:30px;font-family:sans-serif">这个账号还没有开通权限，请联系 HR。 <a href="">重新登录</a></p>';return}
    await start(me());
  }catch(e){document.body.insertAdjacentHTML('afterbegin',`<p style="padding:20px;color:#e5484d;font-family:sans-serif">连接失败：${String(e.message).replace(/</g,'&lt;')} <a href="">重试</a></p>`)}}
async function logout(){await sb.auth.signOut();location.reload()}

return {boot,logout,reload,me,emp,employees:()=>S.employees.filter(e=>e.active),allEmployees:()=>S.employees,shifts:()=>S.shifts,S:()=>S,
  shiftOf,shiftCode,summary,stats,nextType,punch,photo,addRecord,editRecord,deleteRecord,addRequest,decide,canDecide,stepName,
  setShift,setShifts,saveShift,addShift,setOffice,saveCfg,createUser,updateUser,setPassword,changeMyPassword,setAvatar,resizeImage,
  records:()=>S.records,requests:()=>S.requests,cfg:()=>S.cfg,office:()=>S.office,PRESENT,
  util:{pad,ymd,addDays,at,hm,dow,prevWork}}})();

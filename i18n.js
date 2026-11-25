/* 中文 / English 双语。页面内部仍用中文运行；选择 English 时，屏幕上显示的文字会被自动换成英文。
   语言选择保存在浏览器里。换语言会重新载入页面（登录状态不会丢）。 */
const I18N=(()=>{
const KEY='lang';
let lang='zh';
try{const s=localStorage.getItem(KEY);lang=s||((navigator.language||'').toLowerCase().startsWith('zh')?'zh':'en')}catch(e){}
const CJK=/[㐀-鿿＀-￯　-〿]/;

/* 1) 整段文字完全相同时用这张表 */
const EXACT={
'请假申请':'Leave request','申请请假':'Leave','申请加班':'Overtime','申请补卡':'Make-up punch',
'员工打卡':'Staff Clock-in','HR 考勤后台':'HR Attendance Console','首页':'Home','记录':'History','申请':'Requests','设置':'Settings',
'正常':'Normal','迟到':'Late','早退':'Left early','迟到早退':'Late & left early','缺勤':'Absent','漏打卡':'Missed punch','未到岗':'Not arrived','请假':'On leave','休息':'Rest day','上班中':'Working','未上班':'Not started','未开始':'Upcoming','休息日出勤':'Rest-day work',
'你好':'Hello','快捷功能':'Quick access','打卡记录':'Clock history','我的排班':'My schedule','加班申请':'Overtime request','补卡申请':'Make-up punch request','我的申请':'My requests','主管后台':'Supervisor console',
'加班':'Overtime','补卡':'Make-up punch','我的账号':'My account','修改密码':'Change password','退出登录':'Log out','办公室打卡范围':'Office clock-in area',
'请看着镜头':'Look at the camera','拍一张自拍作为打卡证明':'Take a selfie as proof of clock-in','取消':'Cancel','拍照打卡':'Take photo & clock','摄像头还没准备好，等一下':'Camera not ready yet, please wait',
'今天班次':"Today's shift",'今天上班':'Clocked in today','今天下班':'Clocked out today','今天已工作':'Worked today','上班':'Clock in','下班':'Clock out','日班':'Day shift','早班':'Early shift','晚班':'Night shift','新班次':'New shift',
'保存':'Save','关闭':'Close','提交':'Submit','批准':'Approve','拒绝':'Reject','确定':'OK','删除':'Delete','编辑':'Edit','导出':'Export','打印':'Print',
'年假':'Annual leave','病假':'Sick leave','事假':'Personal leave','从':'From','到':'To','假别':'Leave type','原因':'Reason','加班日期':'Overtime date','加班多久':'Overtime duration','哪一天':'Which day','补哪一个':'Which punch','上班卡':'Clock-in','下班卡':'Clock-out','应该打卡的时间':'Time you should have clocked',
'周日':'Sun','周一':'Mon','周二':'Tue','周三':'Wed','周四':'Thu','周五':'Fri','周六':'Sat','日':'Sun','一':'Mon','二':'Tue','三':'Wed','四':'Thu','五':'Fri','六':'Sat',
'员工':'Employee','主管':'Supervisor','完成':'Done','部门':'Department','天':'days','实到':'Attended','总工时':'Total hours','出勤率':'Attendance rate','迟到次数':'Late count','缺勤天数':'Absent days','漏打卡':'Missed punch',
'销售部':'Sales','生产部':'Production','财务部':'Finance','人事部':'Human Resources','行政部':'Admin','管理部':'Management','司机':'Driver','安装':'Installer','安装部':'Installation',
'考勤总结':'Attendance Summary','实时监控':'Live Monitor','考勤数据':'Attendance Data','排班表':'Schedule','加班管理':'Overtime','审批流程':'Approvals','主管协助打卡':'Assisted Clock-in','报表':'Reports','人力分析':'Workforce Analytics','员工管理':'Staff',
'全部员工':'All employees','全部部门':'All departments','时间':'Time','类型':'Type','方式':'Method','来源':'Source','备注':'Note','距离':'Distance','人脸':'Face','状态':'Status','班次':'Shift','日期':'Date','内容':'Details','动作':'Action','操作人':'By','名称':'Name','颜色':'Colour','姓名':'Name','邮箱':'Email','角色':'Role','直属主管':'Reports to','在职':'Active','已停用':'Deactivated','本人':'Self','人工修改':'Manually edited','是':'Yes','否':'No','人数':'Headcount',
'上班卡 ':'Clock-in','密码':'Password','设置码':'Setup code','你的名字':'Your name','登录':'Log in','管理员':'Admin','重试':'Retry','重新登录':'Log in again',
'时薪':'Hourly rate','倍率':'Multiplier','纬度':'Latitude','经度':'Longitude','办公室':'Office','暂无':'None','没有':'None','本周':'This week','工时':'Hours','今天':'Today','月度考勤总表':'Monthly attendance summary','迟到早退明细':'Late / early-leave details','加班报表':'Overtime report','缺勤/请假/漏卡明细':'Absence / leave / missed-punch details',
'待我审批':'Awaiting my approval','全部申请':'All requests','原始打卡记录':'Raw clock records','每日汇总':'Daily summary','修改日志':'Edit log','上一周':'Previous week','下一周':'Next week'
};

/* 2) 句子/词组：在一段文字里按"长的先换"替换 */
const PH=[
['日班','Day shift'],['早班','Early shift'],['晚班','Night shift'],['新班次','New shift'],
['＋ ','+ '],['＋','+'],['⬇ 导出 Excel(CSV)','⬇ Export to Excel (CSV)'],['导出 Excel(CSV)','Export to Excel (CSV)'],['导出','Export'],['手机没电','Phone out of battery'],
['工时(h)','Hours (h)'],['上一周','Previous week'],['下一周','Next week'],['待我审批','Awaiting my approval'],['全部申请','All requests'],
['年假','Annual leave'],['病假','Sick leave'],['事假','Personal leave'],
['未上班','not started'],['未到岗','not arrived'],['上班中','working'],['休息日出勤','rest-day work'],['迟到早退','late & left early'],['漏打卡','missed punch'],['缺勤','absent'],['未开始','upcoming'],['正常','normal'],['今天','today '],['销售部','Sales'],['生产部','Production'],['财务部','Finance'],['人事部','Human Resources'],['行政部','Admin'],['管理部','Management'],
['应出勤','Scheduled days'],['时薪(RM)','Hourly (RM)'],['人脸','Face'],['语言 / Language','Language'],
['周日','Sun'],['周一','Mon'],['周二','Tue'],['周三','Wed'],['周四','Thu'],['周五','Fri'],['周六','Sat'],['打印','Print'],['发送','Send'],

['你好，','Hello, '],['办公室未设定（去设置里设定）','Office not set (go to Settings)'],['今天请假','On leave today'],['今天休息 😴','Day off today 😴'],['已上班，下班时再点一次','Clocked in. Tap again when you finish work.'],['还没上班打卡','Not clocked in yet'],
['点红色按钮：下班打卡','Tap the red button to clock out'],['点橙色按钮：上班打卡（定位 + 自拍）','Tap the orange button to clock in (location + selfie)'],
['打卡自拍','Clock-in selfie'],['没有打卡记录，可以提交补卡申请','No punches. You can submit a make-up punch request.'],['没有打卡记录','No punches'],['还没有打卡记录','No clock records yet'],['还没有申请','No requests yet'],
['主管协助','Supervisor-assisted'],['人工修改','Manually edited'],['补卡','make-up punch'],['人工','Manual'],['GPS定位','GPS'],['定位','location'],
['新密码（至少8位）','New password (at least 8 characters)'],['新密码（至少 8 位）','New password (at least 8 characters)'],['新密码','New password'],['密码太短','Password too short'],['至少8位','At least 8 characters'],['密码至少8位','Password must be at least 8 characters'],['密码至少 8 位','Password must be at least 8 characters'],['密码已修改','Password changed'],['没成功','Failed'],
['打不开','Cannot open'],['日期不对','Invalid date'],['结束日期不能早于开始日期','End date cannot be before start date'],['已提交','Submitted'],['提交没成功','Could not submit'],['请填写原因','Please enter a reason'],['例如：忘记打卡','e.g. forgot to clock'],['忘记打卡','Forgot to clock'],
['这个浏览器不支持定位','This browser does not support location'],['你没有允许定位，请在浏览器里打开定位权限','You did not allow location access. Please turn it on in your browser'],['暂时拿不到位置，请到信号好的地方再试','Cannot get your location. Please try again where the signal is better'],
['你今天请假，不需要打卡','You are on leave today, no need to clock in'],['HR 还没有设定办公室位置，暂时不能打卡。','HR has not set the office location yet, so clocking in is not available.'],['HR 还没有设定办公室位置，暂时不能打卡','HR has not set the office location yet, so clocking in is not available'],
['正在定位…','Locating…'],['正在提交…','Submitting…'],['已取消打卡','Clock-in cancelled'],['人脸已验证','Face verified'],['已拍照记录','Photo recorded'],['打卡没成功','Clock-in failed'],
['打不开摄像头，请允许浏览器使用摄像头','Cannot open the camera. Please allow camera access'],['没看到人脸，请正对镜头再拍','No face detected. Please face the camera and try again'],
['WiFi 打卡','Wi-Fi clock-in'],['网页读不到WiFi名称，需要做成手机App才能用','A web page cannot read the Wi-Fi name. This needs a mobile app.'],['这台手机/浏览器不支持（安卓 Chrome 才行）','Not supported on this phone/browser (Android Chrome only)'],['NFC 打卡','NFC clock-in'],['请把手机靠近打卡贴纸','Hold your phone near the clock-in tag'],['NFC 没打开','NFC is off'],
['点任意一行，查看这个人整月的日历','Click any row to see that person’s monthly calendar'],['已批准加班(小时)','Approved overtime (h)'],['应出勤(天)','Scheduled (days)'],['迟到(次/分钟)','Late (times / min)'],['总工时(h)','Total hours (h)'],['加班(h)','Overtime (h)'],['出勤率','Attendance rate'],['早退','Left early'],['缺勤','Absent'],['请假','Leave'],
['考勤日历','attendance calendar'],['你是普通员工，没有后台权限','You are a regular employee and do not have console access'],['请在右上角"登录身份"换成主管（例如 Daniel Lim）或 HR（Shannie Lee）。','Please log in with a supervisor or HR account.'],['回员工手机端','Back to the staff app'],['员工手机端','Staff app'],['改密码','Change password'],['退出登录','Log out'],
['每10秒自动刷新','Auto-refresh every 10 s'],['现在','now'],['今日应到','Due today'],['已到岗','Arrived'],['今日状态','Today’s status'],['方式/距离','Method / distance'],['异常提醒','Alerts'],['今天一切正常 👍','All normal today 👍'],['最新打卡动态','Latest clock activity'],
['所有对考勤记录的修改都会留下痕迹','Every change to attendance records is logged'],['暂时没有修改记录','No edits yet'],['每日考勤汇总','Daily attendance summary'],['迟到分','Late min'],['早退分','Early min'],['打卡原始记录','Raw clock records'],['距离米','Distance m'],['新增一条记录','Add a record'],
['修改、删除都需要填写原因，并会记入"修改日志"','Edits and deletions need a reason and are written to the Edit log'],['编辑打卡记录','Edit clock record'],['新增打卡记录','Add clock record'],['原因（必填，会记录下来）','Reason (required, will be logged)'],['例如：员工忘记打卡，已核实','e.g. Employee forgot to clock, verified'],['时间不对','Invalid time'],['删除这条打卡记录','Delete this clock record'],['为什么要删除？（必填，会记入修改日志）','Why delete it? (required, logged)'],
['选择后自动保存。蓝色底 = 与默认不同（手动调整过）','Saved automatically. Blue = changed from default.'],['整周套用：','Apply to the whole week: '],['选择班次…','Choose shift…'],['(周一至周五)','(Mon–Fri)'],['班次设定','Shift settings'],['新增班次','Add shift'],['修改班次时间会影响迟到/早退的计算','Changing shift times affects late / early-leave calculations'],
['系统检测到的超时(小时)','Overtime detected (h)'],['待审批加班单','Pending OT requests'],['加班费估算(RM)','Estimated OT pay (RM)'],['待审批的加班申请','Pending overtime requests'],['每人加班统计（加班费按时薪 × ','Overtime per person (pay = hourly rate × '],[' 倍估算）',' estimate)'],['系统检测超时(h)','Detected OT (h)'],['已批准(h)','Approved (h)'],['未批准(h)','Unapproved (h)'],['估算加班费(RM)','Est. OT pay (RM)'],
['超时下班，但没提交加班申请','Worked past shift end with no overtime request'],['下班时间','Clock-out time'],['超时','Over by'],['已批准','Approved'],['未批准','Not approved'],['已拒绝','Rejected'],['待主管审批','Awaiting supervisor approval'],['待HR审批','Awaiting HR approval'],['提交于','Submitted'],['提交','Submit'],
['拒绝申请','Reject request'],['拒绝原因（可不填）','Reason for rejecting (optional)'],['没有需要处理的申请 🎉','Nothing to review 🎉'],
['审批规则：加班 → 主管批准即可；请假、补卡 → 主管批准后，再交 HR 终审。主管自己的申请直接交 HR。补卡批准后，系统会自动补上那条打卡记录。','Approval rules: overtime needs supervisor approval only. Leave and make-up punches need supervisor approval, then final HR approval. A supervisor’s own requests go straight to HR. Once a make-up punch is approved, the clock record is added automatically.'],
['替员工打卡','Clock in for an employee'],['员工手机没电、忘带手机、定位出问题时，由主管代打。记录会标明"主管协助"并写明原因，HR 可以追溯。','Use this when an employee’s phone is dead, forgotten or location fails. The record is marked "Supervisor-assisted" with the reason, so HR can trace it.'],['原因（必填）','Reason (required)'],['例如：手机没电','e.g. Phone out of battery'],['确认协助打卡','Confirm assisted clock-in'],['最近的协助打卡','Recent assisted clock-ins'],['协助','assisted by'],['没有可协助的员工','No employees to assist'],['已协助打卡','Assisted clock-in recorded'],
['月度考勤总表','Monthly attendance summary'],['迟到次','Late times'],['迟到分钟','Late minutes'],['早退次','Early times'],['检测超时h','Detected OT h'],['批准加班h','Approved OT h'],['加班费RM','OT pay RM'],['时薪RM','Hourly RM'],['迟到分','Late min'],['总工时h','Total h'],['加班h','OT h'],['工时h','Hours h'],['这个月没有符合的记录','No matching records this month'],
['缺勤/请假/漏卡明细','Absence / leave / missed-punch details'],['迟到早退明细','Late / early-leave details'],['缺勤请假漏卡明细','Absence / leave / missed-punch details'],['加班报表','Overtime report'],['假别','Leave type'],
['在职人数','Headcount'],['平均出勤率','Avg attendance rate'],['人均日工时(h)','Avg daily hours (h)'],['人均加班(h)','Avg overtime / person (h)'],['迟到率','Late rate'],['自动洞察','Automatic insights'],['数据还不够','Not enough data yet'],['各部门出勤率','Attendance rate by department'],['各部门加班小时','Overtime hours by department'],['每日出勤率走势','Daily attendance trend'],['一周中哪天最容易迟到','Which weekday has the most lateness'],['各部门人数 / 加班费(RM)','Headcount / OT pay (RM) by department'],['迟到时间最长 Top5','Most late minutes – Top 5'],['加班最多 Top5','Most overtime – Top 5'],['数据不足','Not enough data'],
['出勤率最低的部门是','Lowest attendance rate:'],['加班最多的是','Most overtime:'],['迟到最容易发生在','Lateness most often happens on'],['加班费','OT pay'],['部门','Department'],['迟到次','Late times'],
['办公室打卡范围','Office clock-in area'],['员工只有在这个范围内，才能用手机定位打卡。','Employees can only clock in by phone location within this area.'],['多少米内可打卡','Allowed distance (m)'],['用我现在的位置','Use my current location'],['办公室名称','Office name'],['考勤规则','Attendance rules'],['迟到/早退宽限（分钟）','Late / early grace (minutes)'],['超过多少分钟才算加班','Minutes past shift end before overtime counts'],['加班费倍率','Overtime pay multiplier'],['登录邮箱：','Login email: '],['修改我的密码','Change my password'],
['拿不到位置，请允许浏览器定位','Cannot get location. Please allow location in your browser'],['请填写位置，或点"用我现在的位置"','Enter a location or tap "Use my current location"'],['已保存','Saved'],
['只有 HR 可以管理员工账号','Only HR can manage staff accounts'],['新增员工账号','Add staff account'],['新增后，把邮箱和临时密码告诉员工，员工就能登录。建议员工第一次登录后自己改密码。','After adding, give the employee the email and temporary password. Ask them to change the password after first login.'],['编辑员工','Edit employee'],['邮箱（不能改）','Email (cannot change)'],['登录邮箱','Login email'],['临时密码（至少8位）','Temporary password (at least 8 characters)'],['默认班次','Default shift'],['时薪 RM（算加班费用，只有 HR 看得到）','Hourly rate RM (for OT pay, visible to HR only)'],['停用（不能再登录）','Deactivate (can no longer log in)'],['重设密码','Reset password'],['请填写姓名','Please enter a name'],['已创建。邮箱：','Created. Email: '],['临时密码：','Temporary password: '],['已重设，请把新密码告诉员工','Reset. Please tell the employee the new password'],['（无）','(none)'],['状态','Status'],['在职','Active'],
['设置码','Setup code'],['首次设置：创建管理员','First-time setup: create admin'],['考勤系统登录','Attendance system login'],['这是第一次使用。请输入设置码，并创建你自己的管理员（HR）账号。','This is the first use. Enter the setup code and create your own admin (HR) account.'],['请用公司给你的邮箱和密码登录。','Please log in with the email and password your company gave you.'],['（至少 8 位）','(at least 8 characters)'],['创建并登录','Create & log in'],['已经有账号？去登录','Already have an account? Log in'],['第一次使用？去设置','First time? Set up'],['邮箱或密码不对','Wrong email or password'],['这个账号还没有开通权限，请联系 HR。','This account has no access yet. Please contact HR.'],['连接失败：','Connection failed: '],
['账号','account'],['打卡成功','successful'],['上班打卡成功','clocked in successfully'],['下班打卡成功','clocked out successfully'],['未到岗','Not arrived'],
['缺上班卡','Missing clock-in'],['缺下班卡','Missing clock-out'],['已更正','Corrected'],['协助打卡','Assisted clock-in'],['新增员工','Add staff'],['修改','Edit'],['新增','Add'],
['只能替自己打卡','You can only clock in for yourself'],['管理员还没有设定办公室位置，暂时不能打卡','The office location has not been set yet, so clocking in is not available'],['需要定位才能打卡','Location is required to clock in'],['找不到记录','Record not found'],['没有权限','No permission'],['不能协助自己打卡','You cannot assist your own clock-in'],['找不到申请','Request not found'],['这张申请现在不需要你审批','This request does not need your approval now'],['邮箱格式不对','Invalid email format'],['只有 HR 可以新增员工','Only HR can add staff'],['角色不对','Invalid role'],['只有 HR 可以重设密码','Only HR can reset passwords'],['系统已经设置过了','The system is already set up'],['设置码不对','Wrong setup code'],['不支持的类型','Unsupported type'],['这个邮箱已经注册过了','This email is already registered'],
['办公室','Office'],['小时','h'],['分钟','min'],['打卡','clock'],['迟到','late'],['加班','overtime'],['请假','leave'],['班次','shift'],['上班','clock-in'],['下班','clock-out'],['休息','rest'],
['员工','Employee'],['主管','Supervisor'],['原因：','Reason: '],['原因','Reason'],['我的','My'],['申请','request']
];
/* 3) 带数字/名字的句子：正则 */
const RX=[
[/你离(.+?)还有约(\d+)米，需要在(\d+)米内才能打卡/g,'You are about $2 m from $1. You must be within $3 m to clock in'],
[/(.+?) ?上班打卡成功$/,'$1 clocked in'],[/(.+?) ?下班打卡成功$/,'$1 clocked out'],
[/(.+?)，(\d+)米内可打卡（由HR设定）/,'$1, clock in within $2 m (set by HR)'],[/(.+?)，(\d+)米内可打卡/,'$1, clock in within $2 m'],
[/打卡记录（近(\d+)天）/,'Clock history (last $1 days)'],
[/迟到(\d+)分钟/g,'Late $1 min'],[/早退(\d+)分钟/g,'Left early $1 min'],[/加班(\d+(?:\.\d+)?)小时/g,'Overtime $1 h'],
[/（迟到(\d+)分）/g,' (late $1 min)'],[/迟(\d+)/g,'L$1'],[/早(\d+)/g,'E$1'],
[/(\d+)小时(\d+)分/g,'$1h $2m'],[/(\d+(?:\.\d+)?)\s*小时/g,'$1 h'],[/(\d+)\s*分钟/g,'$1 min'],[/(\d+)\s*分(?![钟])/g,'$1 min'],
[/(\d+)米/g,'$1 m'],[/（(\d+)天）/g,' ($1 days)'],[/(\d+)天/g,'$1 d'],[/共 (\d+) 条/g,'$1 records'],[/共 (\d+) 人/g,'$1 people'],
[/(.+) 已过上班时间，还没打卡/,'$1 is past start time and has not clocked in'],
[/(.+) 迟到 (\d+) 分钟/,'$1 late by $2 min'],
[/(.+) 打卡位置离办公室 (\d+) 米（偏远）/,'$1 clocked $2 m from the office (far)'],
[/(.+) (\d{2}:\d{2}) 的打卡没有通过人脸检测/,'$1 clock at $2 failed face detection'],
[/(.+) 由 (.+) 协助打卡：(.*)/,'$1 assisted by $2: $3'],
[/由 (.+?) 协助 · (.*)/,'Assisted by $1 · $2'],
[/，合计 (.+?) 小时，加班费约 RM (\d+)。/,', total $1 h, OT pay approx. RM $2.'],[/（(\d+) 次）。/,' ($1 times).'],[/（(.+?%)）。/,' ($1).'],
[/⚠️ (.+) 本月加班超过 20 小时，注意过劳风险。/,'⚠️ $1 worked over 20 h overtime this month. Watch for burnout.'],
[/ 本月迟到 (\d+) 次，建议面谈了解原因。/,' was late $1 times this month. Consider a conversation.'],
[/^(✅|❌) (.+) 批准(：.*)?$/,'$1 $2 approved$3'],[/^(✅|❌) (.+) 拒绝(：.*)?$/,'$1 $2 rejected$3'],
[/原因：(.*)/,'Reason: $1'],
[/补(上|下)班卡/g,(m,a)=>a==='上'?'Make-up clock-in':'Make-up clock-out'],
[/📝 补卡/g,'📝 Make-up punch'],
[/(\d{4}-\d{2}-\d{2}) 周(.)/g,(m,d,w)=>d+' '+({日:'Sun',一:'Mon',二:'Tue',三:'Wed',四:'Thu',五:'Fri',六:'Sat'}[w]||w)],
[/(\d{4}-\d{2}-\d{2}) ~ (\d{4}-\d{2}-\d{2})/g,'$1 ~ $2']
];
const PHS=PH.slice().sort((a,b)=>b[0].length-a[0].length);
const PUNC=[['（',' ('],['）',')'],['，',', '],['。','.'],['：',': '],['；','; '],['、',', '],['？','?'],['！','!'],['·','·']];
const cache=new Map();
function tr(s){
  if(lang==='zh'||!s||!CJK.test(s))return s;
  if(cache.has(s))return cache.get(s);
  const lead=s.match(/^\s*/)[0],trail=s.match(/\s*$/)[0],core=s.trim();
  let out;
  const pm=core.match(/^([^\u3400-\u9fff\uff00-\uffef\s]{1,5}) (.+)$/);
  if(EXACT[core]!==undefined)out=EXACT[core];
  else if(pm&&EXACT[pm[2]]!==undefined)out=pm[1]+' '+EXACT[pm[2]];
  else{
    out=core;
    for(const [re,to] of RX)out=out.replace(re,to);
    for(const [zh,en] of PHS){if(out.includes(zh))out=out.split(zh).join(en)}
    for(const [zh,en] of PUNC)out=out.split(zh).join(en);
    out=out.replace(/  +/g,' ').replace(/\( /g,'(').replace(/ \)/g,')').replace(/ ([,.;:?!])/g,'$1');
  }
  out=out.trim();const r=lead+out+trail;cache.set(s,r);return r}

/* 把页面上的文字换成英文 */
const ATTRS=['placeholder','title','aria-label','alt'];
function fix(n){
  if(n.nodeType===3){const p=n.parentNode&&n.parentNode.nodeName;if(p==='SCRIPT'||p==='STYLE'||p==='TEXTAREA')return;const v=n.nodeValue;if(CJK.test(v)){const t=tr(v);if(t!==v)n.nodeValue=t}return}
  if(n.nodeType!==1||n.nodeName==='SCRIPT'||n.nodeName==='STYLE')return;
  for(const a of ATTRS){if(n.hasAttribute&&n.hasAttribute(a)){const v=n.getAttribute(a);if(CJK.test(v)){const t=tr(v);if(t!==v)n.setAttribute(a,t)}}}
  for(let c=n.firstChild;c;c=c.nextSibling)fix(c)}
function start(){
  document.documentElement.lang=lang==='en'?'en':'zh';
  if(lang!=='en')return;
  document.title=tr(document.title);fix(document.body);
  new MutationObserver(ms=>{for(const m of ms){
    if(m.type==='characterData')fix(m.target);
    else if(m.type==='attributes')fix(m.target);
    else m.addedNodes.forEach(fix)}}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
function set(l){try{localStorage.setItem(KEY,l)}catch(e){}location.reload()}
return {lang,tr,set,toggle:()=>set(lang==='en'?'zh':'en'),label:()=>lang==='en'?'中文':'English'};
})();

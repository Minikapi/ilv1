(function(){
'use strict';
const DAYS=['ПН','ВТ','СР','ЧТ','ПТ','СБ','НД'];
const DAYS_FULL=['Понеділок','Вівторок','Середа','Четвер',"П'ятниця",'Субота','Неділя'];
const MON=['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
const MON_S=['січ','лют','бер','кві','тра','чер','лип','сер','вер','жов','лис','гру'];
const COLORS=['#2563eb','#16a34a','#dc2626','#f59e0b','#7c3aed','#db2777','#0891b2','#64748b','#0f172a','#ea580c'];
const SUPPORT_EMAIL='support@example.com'; // <-- підставте свою пошту
const FREE_MODE=true; // тимчасово: усі функції безкоштовні
const def=()=>({profile:{name:'',subject:'',bio:'',phone:'',priceInfo:'',slug:'',start:9,end:18,cur:'₴',pub:true},students:[],groups:[],events:[],blocks:[],payments:[],plan:'free',hideBanner:false});
const S=def();
function apply(s){
  const d=def();
  Object.keys(d).forEach(k=>{S[k]=(s&&s[k]!==undefined)?s[k]:d[k]});
  S.profile=Object.assign(d.profile,(s&&s.profile)||{});
  ['students','groups','events','blocks','payments'].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[]});
}

/* ---------- API ---------- */
async function api(method,url,body){
  let r;
  try{
    r=await fetch(url,{method,credentials:'same-origin',headers:Object.assign({'X-Requested-With':'minikapi'},body!==undefined?{'Content-Type':'application/json'}:{}),body:body!==undefined?JSON.stringify(body):undefined});
  }catch(e){const err=new Error('network');err.network=true;throw err}
  let j=null;try{j=await r.json()}catch(e){}
  if(!r.ok){const err=new Error((j&&j.error)||('http '+r.status));err.status=r.status;err.code=j&&j.error;throw err}
  return j;
}
let _timer=null,_dirty=false,_chain=Promise.resolve();
function save(){_dirty=true;clearTimeout(_timer);_timer=setTimeout(saveNow,250)}
function saveNow(){
  clearTimeout(_timer);_dirty=false;
  _chain=_chain.then(async()=>{
    try{await api('PUT','/api/data',S);return {ok:true}}
    catch(e){
      if(e.code==='slug_taken'||e.code==='bad_slug'){S.profile.slug='';toast(e.code==='slug_taken'?'Ця адреса вже зайнята':'Адреса: 3–30 символів a-z, 0-9, дефіс');return {ok:false,error:e.code}}
      if(e.status===401){location.href='login.html';return {ok:false,error:'auth'}}
      toast('Не вдалося зберегти на сервері');return {ok:false,error:e.code||'network'};
    }
  });
  return _chain;
}
window.addEventListener('pagehide',()=>{if(_dirty){try{fetch('/api/data',{method:'PUT',keepalive:true,credentials:'same-origin',headers:{'Content-Type':'application/json','X-Requested-With':'minikapi'},body:JSON.stringify(S)})}catch(e){}}});

const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const p=String(s).split('-').map(Number);return new Date(p[0],p[1]-1,p[2])};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const monday=d=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
const wd=s=>(parse(s).getDay()+6)%7;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-3);
const money=n=>{const v=Math.round((+n||0)*100)/100;return v.toLocaleString('uk-UA',{maximumFractionDigits:2})+' '+S.profile.cur};
const fdate=s=>{const d=parse(s);return d.getDate()+' '+MON[d.getMonth()]};
const student=id=>S.students.find(x=>x.id===id);
const group=id=>S.groups.find(x=>x.id===id);
const ref=e=>e.kind==='group'?group(e.refId):student(e.refId);
const evName=e=>{const o=ref(e);return o?o.name:'(видалено)'};
const evColor=e=>e.color||(ref(e)||{}).color||'#64748b';
const evPrice=e=>{if(e.kind==='group'){const g=group(e.refId);return g?(+g.price||0)*g.members.length:0}const s=student(e.refId);return s?(+s.price||0):0};
const evEnd=e=>{const d=parse(e.date);const t=String(e.time||'00:00').split(':').map(Number);d.setHours(t[0]||0,(t[1]||0)+(+e.dur||60));return d};
const evStart=e=>{const d=parse(e.date);const t=String(e.time||'00:00').split(':').map(Number);d.setHours(t[0]||0,t[1]||0);return d};
const isPast=e=>evEnd(e)<new Date();
function studentCharge(id){let t=0;S.events.forEach(e=>{if(e.status!=='done')return;if(e.kind==='student'&&e.refId===id)t+=(+(student(id)||{}).price||0);if(e.kind==='group'){const g=group(e.refId);if(g&&g.members.includes(id))t+=+g.price||0}});return t}
const studentPaid=id=>S.payments.filter(p=>p.studentId===id).reduce((a,p)=>a+(+p.amount||0),0);
const balance=id=>studentPaid(id)-studentCharge(id);
const $=s=>document.querySelector(s);

const LOGO='<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="12" fill="#f4a259"/><circle cx="20" cy="22" r="11" fill="#12302b"/><circle cx="14" cy="14" r="3.5" fill="#12302b"/><circle cx="26" cy="14" r="3.5" fill="#12302b"/><circle cx="16.5" cy="22" r="1.6" fill="#f4a259"/><circle cx="23.5" cy="22" r="1.6" fill="#f4a259"/><rect x="17" y="26" width="6" height="2.4" rx="1.2" fill="#f4a259"/></svg>';
const NAV=[
 {k:'home',h:'index.html',t:'Головна'},
 {k:'learn',t:'Навчання',kids:[{k:'students',h:'students.html',t:'Учні'},{k:'groups',h:'groups.html',t:'Групи'},{k:'schedule',h:'schedule.html',t:'Розклад'}]},
 {k:'payments',h:'payments.html',t:'Оплати'},
 {k:'calc',h:'calculator.html',t:'Калькулятор'},
 {k:'tariff',h:'tariff.html',t:'Тариф'},
 {k:'pages',h:'pages.html',t:'Публічні сторінки'},
 {k:'updates',h:'updates.html',t:'Оновлення',badge:'НОВЕ'},
 {k:'profile',h:'profile.html',t:'Профіль'},
 {k:'how',h:'how.html',t:'Як це працює'}
];
function shell(cfg){
  const nav=NAV.map(n=>{
    if(n.kids){const open=n.kids.some(k=>k.k===cfg.key);
      return `<div class="grp ${open?'open':''}"><button class="nv ${open?'on':''}" data-tog>${n.t}<span class="chev">⌄</span></button><div class="kids">${n.kids.map(k=>`<a class="nv sub ${k.k===cfg.key?'on':''}" href="${k.h}">${k.t}</a>`).join('')}</div></div>`}
    return `<a class="nv ${n.k===cfg.key?'on':''}" href="${n.h}">${n.t}${n.badge?`<span class="bdg">${n.badge}</span>`:''}</a>`}).join('');
  const nm=S.profile.name||'Користувач';
  return `<aside id="side"><div class="logo">${LOGO}<span>Mini<b>Kapi</b></span></div><nav>${nav}</nav>
  <div class="bot"><a class="nv ${cfg.key==='support'?'on':''}" href="support.html">Підтримка</a><button class="nv" id="logout">Вийти</button>
  <div class="me"><i>${esc(nm[0].toUpperCase())}</i>${esc(nm)}</div><div class="ver">v1.1.0</div></div></aside><div id="scrim"></div>
  <main id="main"><button id="burger" aria-label="Меню">☰</button><h1>${esc(cfg.title)}</h1><div class="sub">${cfg.sub||''}</div><div id="content"></div></main>
  <div class="modal" id="m1"><div class="box" id="b1"></div></div><div id="toast"></div>`;
}
let _cfg=null;
async function boot(){
  const me=await api('GET','/api/me');
  const d=await api('GET','/api/data');
  apply(d.data);
  M.user=me.user;
  if(!S.profile.name)S.profile.name=me.user.name;
}
async function page(cfg){
  _cfg=cfg;
  try{await boot()}
  catch(e){
    if(e.status===401){location.replace('login.html');return}
    document.body.style.justifyContent='center';
    document.body.innerHTML=`<div class="login"><h3>Немає зв'язку із сервером</h3><p style="color:var(--mut)">Запустіть сервер командою <code>node server.js</code> та відкрийте <b>http://localhost:3000</b>. Файли напряму з диска (file://) не працюють.</p><button class="btn pri" onclick="location.reload()">Спробувати ще раз</button></div>`;
    return;
  }
  document.title=cfg.title+' — MiniKapi';
  document.body.innerHTML=shell(cfg);
  document.querySelectorAll('[data-tog]').forEach(b=>b.onclick=()=>b.parentElement.classList.toggle('open'));
  $('#burger').onclick=()=>document.body.classList.toggle('nav');
  $('#scrim').onclick=()=>document.body.classList.remove('nav');
  $('#logout').onclick=async()=>{await saveNow();try{await api('POST','/api/logout',{})}catch(e){}location.href='login.html'};
  $('#m1').addEventListener('mousedown',e=>{if(e.target.id==='m1')closeM()});
  render();
}
function render(){const c=$('#content');if(!c||!_cfg)return;c.innerHTML='';_cfg.render(c)}
function openM(html){$('#b1').innerHTML=html;$('#m1').classList.add('open')}
function closeM(){const m=$('#m1');if(m)m.classList.remove('open')}
let _tt;
function toast(msg){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');clearTimeout(_tt);_tt=setTimeout(()=>t.classList.remove('show'),2200)}
function palette(id,sel){return `<div class="row" style="flex-wrap:nowrap"><input type="color" id="${id}" value="${sel}"><div class="sw" data-for="${id}">${COLORS.map(c=>`<i data-c="${c}" class="${c.toLowerCase()===String(sel).toLowerCase()?'sel':''}" style="background:${c}"></i>`).join('')}</div></div>`}
document.addEventListener('click',e=>{
  const t=e.target;if(!t||!t.closest)return;
  if(t.closest('[data-close]')){closeM();return}
  const i=t.closest('.sw i');if(!i)return;
  const sw=i.parentElement,inp=document.getElementById(sw.dataset.for);if(!inp)return;
  inp.value=i.dataset.c;sw.querySelectorAll('i').forEach(x=>x.classList.remove('sel'));i.classList.add('sel');
  inp.dispatchEvent(new Event('input',{bubbles:true}));
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeM()});
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'application/json'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function importData(obj){if(!obj||typeof obj!=='object'||!Array.isArray(obj.students)||!Array.isArray(obj.events))throw new Error('bad');apply(obj)}
function resetData(){apply(null)}
const M={S,api,load:()=>{},save,saveNow,apply,page,render,openM,closeM,toast,palette,download,importData,resetData,user:null,
 DAYS,DAYS_FULL,MON,MON_S,COLORS,SUPPORT_EMAIL,FREE_MODE,LOGO,pad,iso,parse,addDays,monday,wd,esc,uid,money,fdate,
 student,group,evName,evColor,evPrice,evEnd,evStart,isPast,studentCharge,studentPaid,balance,$};
window.MK=M;
})();

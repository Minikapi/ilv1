(function(){
const {S,save,iso,parse,addDays,monday,pad,esc,uid,money,evName,evColor,evPrice,evStart,student,group,DAYS,DAYS_FULL,MON_S,wd,fdate,palette,openM,closeM,toast}=MK;
let view='grid',tool='lesson',weekStart=monday(new Date()),dayCur=iso(new Date());
const STATUS={planned:'Заплановано',done:'Проведено',cancelled:'Скасовано'};
const hours=()=>{const a=[];for(let h=+S.profile.start;h<+S.profile.end;h++)a.push(h);return a};
const fm=d=>d.getDate()+' '+MON_S[d.getMonth()]+'.';
const hasPeople=()=>S.students.length||S.groups.length;

MK.page({key:'schedule',title:'Розклад',sub:`Інтерактивний тижневий розклад занять<br><small style="color:var(--mut)">Графік ${pad(S.profile.start)}:00–${pad(S.profile.end)}:00 · <a href="profile.html">Змінити</a></small>`,render(el){
  const end=addDays(weekStart,6);
  let h=`<div class="row" style="margin-bottom:14px">
   <div class="row" style="gap:6px"><button class="btn" id="pv">‹</button><span class="btn">${view==='day'?fdate(dayCur):fm(weekStart)+' – '+fm(end)}</span><button class="btn" id="nx">›</button><button class="btn" id="tdy">Сьогодні</button></div>
   <div class="seg"><button class="btn ${tool==='lesson'?'on':''}" data-tool="lesson">Урок</button><button class="btn ${tool==='block'?'on':''}" data-tool="block">Недост.</button></div>
   <a class="btn" href="pages.html">Поширити</a>
   <div class="seg" style="margin-left:auto"><button class="btn ${view==='grid'?'on':''}" data-v="grid">Сітка</button><button class="btn ${view==='day'?'on':''}" data-v="day">День</button><button class="btn ${view==='list'?'on':''}" data-v="list">Список</button></div>
   <div class="legend"><span><i style="background:#14201e"></i>Заплановано</span><span><i style="background:#2f9e7f"></i>Проведено</span><span><i style="background:#d64545"></i>Скасовано</span><span><i style="background:#aab3b0"></i>Недоступно</span></div></div>
  ${hasPeople()?'':'<div class="hint">Щоб створювати уроки, спочатку <a href="students.html">додайте учнів</a> або <a href="groups.html">створіть групу</a>.</div>'}
  ${tool==='block'?'<div class="hint">Режим «Недоступно»: клікніть по клітинці, щоб позначити/зняти недоступний час.</div>':''}
  <div id="view"></div>`;
  el.innerHTML=h;
  const V=el.querySelector('#view');
  if(view==='grid')grid(V);else if(view==='day')dayView(V);else listView(V);
  el.querySelector('#pv').onclick=()=>shift(-1);
  el.querySelector('#nx').onclick=()=>shift(1);
  el.querySelector('#tdy').onclick=()=>{weekStart=monday(new Date());dayCur=iso(new Date());MK.render()};
  el.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;MK.render()});
  el.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{view=b.dataset.v;MK.render()});
}});
function shift(n){if(view==='day')dayCur=iso(addDays(parse(dayCur),n));else weekStart=addDays(weekStart,7*n);MK.render()}
function evChip(e){return `<div class="ev ${e.status}" data-ev="${e.id}" style="background:${evColor(e)}" title="${esc(e.title||'')}">${e.time} ${esc(evName(e))}${e.title?`<small>${esc(e.title)}</small>`:''}</div>`}
function cellHtml(ds,t){
  const evs=S.events.filter(e=>e.date===ds&&parseInt(e.time)===t).sort((a,b)=>a.time.localeCompare(b.time));
  const bl=S.blocks.filter(b=>b.date===ds&&parseInt(b.time)===t);
  return bl.map(b=>`<div class="blk" data-blk="${b.id}">Недоступно</div>`).join('')+evs.map(evChip).join('');
}
function grid(V){
  const todayIso=iso(new Date());
  let h='<table class="grid"><thead><tr><th style="width:70px">ЧАС</th>';
  for(let i=0;i<7;i++){const d=addDays(weekStart,i);h+=`<th class="${iso(d)===todayIso?'today':''}">${DAYS[i]}<span class="d">${d.getDate()}</span></th>`}
  h+='</tr></thead><tbody>';
  hours().forEach(t=>{h+=`<tr><td class="t">${t}:00</td>`;for(let i=0;i<7;i++){const ds=iso(addDays(weekStart,i));h+=`<td data-d="${ds}" data-t="${pad(t)}:00">${cellHtml(ds,t)}</td>`}h+='</tr>'});
  V.innerHTML=h+'</tbody></table>';
  V.querySelectorAll('td[data-d]').forEach(td=>td.onclick=ev=>clickCell(ev,td.dataset.d,td.dataset.t));
}
function dayView(V){
  let h=`<div class="card"><div class="row sp" style="margin-bottom:8px"><b>${DAYS_FULL[wd(dayCur)]}, ${fdate(dayCur)}</b><input type="date" id="dp" value="${dayCur}" style="width:170px"></div>`;
  hours().forEach(t=>{h+=`<div class="it" data-d="${dayCur}" data-t="${pad(t)}:00" style="cursor:pointer;align-items:flex-start"><b style="width:56px">${t}:00</b><div class="grow">${cellHtml(dayCur,t)||'<small>вільно — клік, щоб додати</small>'}</div></div>`});
  V.innerHTML=h+'</div>';
  V.querySelector('#dp').onclick=e=>e.stopPropagation();
  V.querySelector('#dp').onchange=e=>{if(e.target.value){dayCur=e.target.value;MK.render()}};
  V.querySelectorAll('.it[data-d]').forEach(r=>r.onclick=ev=>clickCell(ev,r.dataset.d,r.dataset.t));
}
function listView(V){
  const from=iso(addDays(new Date(),-7));
  const L=S.events.filter(e=>e.date>=from).sort((a,b)=>evStart(a)-evStart(b));
  if(!L.length){V.innerHTML='<div class="card"><div class="empty">Немає занять від минулого тижня і далі</div></div>';return}
  let h='<div class="card">',last='';
  L.forEach(e=>{if(e.date!==last){last=e.date;h+=`<div style="margin:14px 0 4px;font-weight:700">${DAYS_FULL[wd(e.date)]}, ${fdate(e.date)}</div>`}
    h+=`<div class="it"><span class="dot" style="background:${evColor(e)}"></span><div class="grow"><b>${e.time} · ${esc(evName(e))}</b><small>${esc(e.title||'')}${e.desc?' — '+esc(e.desc):''}</small></div><span class="pill">${STATUS[e.status]}</span><button class="btn sm" data-ev="${e.id}">Змінити</button></div>`});
  V.innerHTML=h+'</div>';
  V.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>eventModal(b.dataset.ev));
}
function clickCell(ev,date,time){
  const evEl=ev.target.closest('[data-ev]'),bl=ev.target.closest('[data-blk]');
  if(evEl){eventModal(evEl.dataset.ev);return}
  if(bl){S.blocks=S.blocks.filter(b=>b.id!==bl.dataset.blk);save();toast('Час знову доступний');MK.render();return}
  if(tool==='block'){S.blocks.push({id:uid(),date,time});save();MK.render();return}
  eventModal(null,date,time);
}

function eventModal(id,date,time){
  if(!id&&!hasPeople()){openM(`<h3>Немає учнів</h3><p>Спочатку додайте учня або створіть групу.</p><div class="row" style="justify-content:flex-end"><a class="btn pri" href="students.html">До учнів</a><a class="btn" href="groups.html">До груп</a></div>`);return}
  const e=id?S.events.find(x=>x.id===id):{kind:'student',refId:(S.students[0]||{}).id,title:'',desc:'',homework:'',notes:'',date,time,dur:60,status:'planned',color:''};
  if(!e){return}
  if(!id&&!S.students.length){e.kind='group';e.refId=S.groups[0].id}
  const cur=e.kind+':'+e.refId;
  const opts=(S.students.length?`<optgroup label="Учні">${S.students.map(s=>`<option value="student:${s.id}" ${cur==='student:'+s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</optgroup>`:'')+
             (S.groups.length?`<optgroup label="Групи">${S.groups.map(g=>`<option value="group:${g.id}" ${cur==='group:'+g.id?'selected':''}>${esc(g.name)}</option>`).join('')}</optgroup>`:'');
  const col=e.color||evColor(e);
  openM(`<h3>${id?'Редагувати заняття':'Нове заняття'}</h3>
  <label>Учень / група</label><select id="es">${opts}</select>
  <label>Тема / назва</label><input id="et" value="${esc(e.title)}" placeholder="Напр.: Квадратні рівняння">
  <label>Опис / матеріали</label><textarea id="ed" rows="2">${esc(e.desc)}</textarea>
  <label>Домашнє завдання</label><textarea id="eh" rows="2">${esc(e.homework||'')}</textarea>
  <label>Приватні нотатки (бачите лише ви)</label><textarea id="en" rows="2">${esc(e.notes||'')}</textarea>
  <div class="two"><div><label>Дата</label><input type="date" id="edt" value="${e.date}"></div><div><label>Час</label><input type="time" id="etm" value="${e.time}"></div></div>
  <div class="two"><div><label>Тривалість, хв</label><input type="number" id="edu" min="15" step="15" value="${e.dur||60}"></div><div><label>Статус</label><select id="est">${Object.keys(STATUS).map(k=>`<option value="${k}" ${e.status===k?'selected':''}>${STATUS[k]}</option>`).join('')}</select></div></div>
  ${id?'':'<label>Повторювати щотижня (додаткових разів)</label><input type="number" id="er2" min="0" max="52" value="0">'}
  <label>Колір комірки</label>${palette('ec',col)}
  <div class="row" style="margin-top:6px"><button class="btn sm" id="rc" type="button">Скинути до кольору учня/групи</button></div>
  <div class="err" id="er"></div>
  <div class="row sp" style="margin-top:12px"><div>${id?'<button class="btn dng" id="del">Видалити…</button>':''}</div><div class="row"><button class="btn" data-close>Скасувати</button><button class="btn pri" id="ok">Зберегти</button></div></div>`);
  const $=s=>document.getElementById(s);
  let own=!!e.color;
  $('ec').addEventListener('input',()=>own=true);
  $('rc').onclick=()=>{own=false;const [k,r]=$('es').value.split(':');const o=k==='group'?group(r):student(r);$('ec').value=o?o.color:'#64748b';document.querySelectorAll('.sw i').forEach(i=>i.classList.remove('sel'))};
  $('ok').onclick=()=>{
    const [kind,refId]=$('es').value.split(':');
    const d={kind,refId,title:$('et').value.trim(),desc:$('ed').value.trim(),homework:$('eh').value.trim(),notes:$('en').value.trim(),date:$('edt').value,time:$('etm').value,dur:parseInt($('edu').value)||60,status:$('est').value,color:own?$('ec').value:''};
    if(!d.date||!d.time){$('er').textContent='Вкажіть дату і час';return}
    if(d.dur<5){$('er').textContent='Тривалість замала';return}
    const hr=parseInt(d.time);
    const clash=S.events.find(x=>x.id!==id&&x.date===d.date&&parseInt(x.time)===hr&&x.status!=='cancelled');
    const blocked=S.blocks.find(b=>b.date===d.date&&parseInt(b.time)===hr);
    if(blocked&&!confirm('Цей час позначено як недоступний. Все одно зберегти?'))return;
    if(clash&&!confirm('На цю годину вже є заняття. Все одно зберегти?'))return;
    if(id){
      const same=e.seriesId?S.events.filter(x=>x.seriesId===e.seriesId&&x.id!==id):[];
      if(same.length&&confirm(`Це повторюване заняття (ще ${same.length}). Застосувати учня, тему, опис, домашнє, тривалість і колір до всієї серії?\nОК — до всієї серії, Скасувати — лише до цього заняття.`))
        same.forEach(x=>Object.assign(x,{kind:d.kind,refId:d.refId,title:d.title,desc:d.desc,homework:d.homework,dur:d.dur,color:d.color}));
      Object.assign(e,d);
    }else{
      const rep=Math.max(0,Math.min(52,parseInt($('er2').value)||0)),sid=rep?uid():null,d0=parse(d.date);
      for(let k=0;k<=rep;k++)S.events.push(Object.assign({id:uid(),seriesId:sid},d,{date:iso(addDays(d0,7*k))}));
    }
    save();closeM();toast('Збережено');MK.render();
  };
  if(id)$('del').onclick=()=>deleteModal(e);
}

function deleteModal(e){
  const dayCnt=S.events.filter(x=>x.date===e.date).length;
  const w=wd(e.date),wdCnt=S.events.filter(x=>wd(x.date)===w).length;
  const serCnt=e.seriesId?S.events.filter(x=>x.seriesId===e.seriesId).length:0;
  openM(`<h3>Видалити заняття</h3><p style="color:var(--mut);margin-top:0">${esc(evName(e))}${e.title?' · '+esc(e.title):''} — ${fdate(e.date)}, ${e.time}</p>
  <div style="display:flex;flex-direction:column;gap:8px">
   <button class="btn" data-k="one"><b>Лише це заняття</b></button>
   <button class="btn" data-k="day"><b>Усі заняття цієї колонки</b> — ${DAYS_FULL[w]}, ${fdate(e.date)} (${dayCnt} шт.)</button>
   <button class="btn" data-k="wd"><b>Усі заняття цього дня тижня</b> у всіх тижнях — ${DAYS_FULL[w]} (${wdCnt} шт.)</button>
   ${serCnt>1?`<button class="btn" data-k="ser"><b>Усю серію повторів</b> (${serCnt} шт.)</button>`:''}
   <button class="btn" data-close>Скасувати</button></div>`);
  document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.k,before=S.events.length;
    if(k==='one')S.events=S.events.filter(x=>x.id!==e.id);
    if(k==='day')S.events=S.events.filter(x=>x.date!==e.date);
    if(k==='wd'){if(!confirm('Видалити всі заняття цього дня тижня за весь час?'))return;S.events=S.events.filter(x=>wd(x.date)!==w)}
    if(k==='ser')S.events=S.events.filter(x=>x.seriesId!==e.seriesId);
    save();closeM();toast('Видалено занять: '+(before-S.events.length));MK.render();
  });
}
})();

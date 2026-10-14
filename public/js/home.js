(function(){
const {S,save,iso,esc,money,fdate,evName,evColor,evPrice,evStart,isPast,addDays,pad,MON_S,balance,student,toast}=MK;
let tab='overview';
function sum(list){return list.reduce((a,e)=>a+evPrice(e),0)}
MK.page({key:'home',title:'Головна',sub:'Огляд вашого репетиторського бізнесу',render(el){
  const now=new Date(),today=iso(now),ym=today.slice(0,7);
  const doneM=S.events.filter(e=>e.date.startsWith(ym)&&e.status==='done');
  const planM=S.events.filter(e=>e.date.startsWith(ym)&&e.status==='planned');
  const earnedToday=sum(S.events.filter(e=>e.date===today&&e.status==='done'));
  const hours=doneM.reduce((a,e)=>a+(+e.dur||60),0)/60;
  const paidM=S.payments.filter(p=>String(p.date).startsWith(ym)).reduce((a,p)=>a+(+p.amount||0),0);
  const payCnt=S.payments.filter(p=>String(p.date).startsWith(ym)).length;
  const active=S.students.filter(s=>s.active!==false).length;
  let h='';
  if(!S.hideBanner)h+=`<div class="banner"><div><b>Зміст уроку в картці заняття</b><p>Додавайте тему, опис і домашнє завдання в картці заняття (Розклад → клік по уроку). Приватні нотатки бачите лише ви.</p></div><div class="row" style="flex-wrap:nowrap"><a class="btn" href="schedule.html">До розкладу</a><button class="btn" id="hb" aria-label="Закрити">✕</button></div></div>`;
  h+=`<div class="seg"><button class="btn ${tab==='overview'?'on':''}" data-t="overview">Огляд</button><button class="btn ${tab==='analytics'?'on':''}" data-t="analytics">Аналітика</button></div>`;
  if(tab==='overview'){
    h+=`<div class="stats">
     <div class="card stat"><div class="l">Учнів</div><div class="v">${active}</div><div class="n">активні учні</div></div>
     <div class="card stat"><div class="l">Зароблено сьогодні</div><div class="v">${money(earnedToday)}</div><div class="n">${now.getDate()} ${MON_S[now.getMonth()]}. ${now.getFullYear()}</div></div>
     <div class="card stat"><div class="l">Проведено уроків</div><div class="v">${doneM.length}</div><div class="n">${Math.round(hours*10)/10} год цього місяця</div></div>
     <div class="card stat"><div class="l">Дохід за місяць</div><div class="v">${money(sum(doneM))}</div><div class="n">за завершені уроки</div></div>
     <div class="card stat"><div class="l">Отримано оплат</div><div class="v">${money(paidM)}</div><div class="n">${payCnt} оплат цього місяця</div></div>
     <div class="card stat"><div class="l">Плановий дохід</div><div class="v">${money(sum(planM))}</div><div class="n">${planM.length} уроків ще заплановано</div></div></div>`;
    const td=S.events.filter(e=>e.date===today).sort((a,b)=>a.time.localeCompare(b.time));
    const next=S.events.filter(e=>e.status==='planned'&&evStart(e)>=now).sort((a,b)=>evStart(a)-evStart(b))[0];
    h+=`<div class="cols"><div class="card"><h3>Сьогодні</h3>${td.length?td.map(e=>`<div class="it"><span class="dot" style="background:${evColor(e)}"></span><div class="grow"><b>${e.time} · ${esc(evName(e))}</b><small>${esc(e.title||'')}</small></div><span class="pill">${{planned:'заплановано',done:'проведено',cancelled:'скасовано'}[e.status]}</span></div>`).join(''):'<div class="empty">Уроків немає. Вільний день.</div>'}<a class="btn sm" href="schedule.html">Запланувати →</a></div>
     <div class="card"><h3>Наступний урок</h3>${next?`<div class="it"><span class="dot" style="background:${evColor(next)}"></span><div class="grow"><b>${esc(evName(next))}</b><small>${fdate(next.date)}, ${next.time}${next.title?' · '+esc(next.title):''}</small></div></div>`:'<div class="empty">Немає запланованих. Додайте урок у розкладі.</div>'}<a class="btn sm" href="schedule.html">До розкладу →</a></div></div>`;
    const fut=planM.filter(e=>evStart(e)>=now);
    h+=`<div class="card" style="margin-bottom:14px"><h3>Прогноз доходу</h3>${planM.length?`<div class="it"><div class="grow"><b>${money(sum(planM))} очікується до кінця місяця</b><small>${planM.length} запланованих уроків, з них ${fut.length} ще попереду</small></div></div>`:'<div class="empty">Ще нічого не заплановано. Додайте уроки, щоб побачити прогноз доходу.</div>'}</div>`;
    let wk='';for(let i=0;i<7;i++){const d=addDays(now,i),ds=iso(d),L=S.events.filter(e=>e.date===ds&&e.status!=='cancelled');wk+=`<div class="it"><div class="grow"><b>${fdate(ds)}${i===0?' (сьогодні)':''}</b><small>${L.length?L.map(e=>e.time+' '+esc(evName(e))).join(', '):'вільно'}</small></div><span class="pill">${L.length}</span></div>`}
    const need=S.events.filter(e=>e.status==='planned'&&isPast(e)).sort((a,b)=>evStart(a)-evStart(b)).slice(0,8);
    const debt=S.students.filter(s=>balance(s.id)<0);
    h+=`<div class="cols"><div class="card"><h3>Тиждень попереду</h3>${wk}</div>
     <div class="card"><h3>Потребують уваги</h3>${need.length||debt.length?
      need.map(e=>`<div class="it"><div class="grow"><b>${esc(evName(e))}</b><small>${fdate(e.date)} ${e.time} — позначте результат</small></div><button class="btn sm" data-st="done" data-id="${e.id}">Проведено</button><button class="btn sm dng" data-st="cancelled" data-id="${e.id}">Скасовано</button></div>`).join('')+
      debt.map(s=>`<div class="it"><div class="grow"><b>${esc(s.name)}</b><small>Борг: ${money(-balance(s.id))}</small></div><span class="pill bad">борг</span></div>`).join('')
      :'<div class="empty">Все гаразд ✔</div>'}</div></div>`;
  }else{
    const months=[];for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({ym:d.getFullYear()+'-'+pad(d.getMonth()+1),l:MON_S[d.getMonth()]})}
    const vals=months.map(m=>sum(S.events.filter(e=>e.status==='done'&&e.date.startsWith(m.ym))));
    const max=Math.max(1,...vals);
    const cnt=st=>S.events.filter(e=>e.status===st).length;
    const top=S.students.map(s=>({s,v:S.events.filter(e=>e.status==='done'&&e.kind==='student'&&e.refId===s.id).reduce((a,e)=>a+evPrice(e),0)})).sort((a,b)=>b.v-a.v).slice(0,5);
    h+=`<div class="card" style="margin:16px 0"><h3>Дохід за останні 6 місяців (проведені уроки)</h3><div class="bars">${months.map((m,i)=>`<div class="bar" title="${money(vals[i])}"><div style="height:${Math.round(vals[i]/max*140)}px"></div><span>${m.l}</span></div>`).join('')}</div></div>
    <div class="cols"><div class="card"><h3>Уроки за статусами</h3><div class="it"><div class="grow">Заплановано</div><b>${cnt('planned')}</b></div><div class="it"><div class="grow">Проведено</div><b>${cnt('done')}</b></div><div class="it"><div class="grow">Скасовано</div><b>${cnt('cancelled')}</b></div></div>
    <div class="card"><h3>Топ учнів за доходом</h3>${top.some(t=>t.v>0)?top.filter(t=>t.v>0).map(t=>`<div class="it"><span class="dot" style="background:${t.s.color}"></span><div class="grow">${esc(t.s.name)}</div><b>${money(t.v)}</b></div>`).join(''):'<div class="empty">Даних поки немає</div>'}</div></div>`;
  }
  el.innerHTML=h;
  el.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;MK.render()});
  const hb=el.querySelector('#hb');if(hb)hb.onclick=()=>{S.hideBanner=true;save();MK.render()};
  el.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{const e=S.events.find(x=>x.id===b.dataset.id);if(e){e.status=b.dataset.st;save();toast('Збережено');MK.render()}});
}});
})();

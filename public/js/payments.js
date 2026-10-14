(function(){
const {S,save,iso,esc,uid,money,fdate,student,balance,studentCharge,studentPaid,openM,closeM,toast}=MK;
MK.page({key:'payments',title:'Оплати',sub:'Облік надходжень та балансу учнів',render(el){
  const ym=iso(new Date()).slice(0,7);
  const m=S.payments.filter(p=>String(p.date).startsWith(ym)).reduce((a,p)=>a+(+p.amount||0),0);
  const debt=S.students.reduce((a,s)=>a+Math.max(0,-balance(s.id)),0);
  const list=[...S.payments].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  el.innerHTML=`<div class="row sp"><div></div><button class="btn pri" id="add">+ Додати оплату</button></div>
  <div class="stats"><div class="card stat"><div class="l">Отримано цього місяця</div><div class="v">${money(m)}</div></div><div class="card stat"><div class="l">Загальний борг учнів</div><div class="v">${money(debt)}</div></div><div class="card stat"><div class="l">Усього оплат</div><div class="v">${S.payments.length}</div></div></div>
  <div class="cols"><div class="card"><h3>Баланс учнів</h3>${S.students.length?`<table class="t"><tr><th>Учень</th><th>Нараховано</th><th>Оплачено</th><th>Баланс</th></tr>${S.students.map(s=>{const b=balance(s.id);return `<tr><td><span class="dot" style="background:${s.color}"></span> ${esc(s.name)}</td><td>${money(studentCharge(s.id))}</td><td>${money(studentPaid(s.id))}</td><td><span class="pill ${b<0?'bad':'ok'}">${money(b)}</span></td></tr>`}).join('')}</table>`:'<div class="empty">Додайте учнів</div>'}<small style="color:var(--mut)">Нараховується за проведені уроки (статус «Проведено»).</small></div>
  <div class="card"><h3>Історія оплат</h3>${list.length?list.map(p=>`<div class="it"><div class="grow"><b>${money(p.amount)}</b> · ${esc((student(p.studentId)||{}).name||'(видалено)')}<small>${fdate(p.date)}${p.note?' · '+esc(p.note):''}</small></div><button class="btn sm dng" data-d="${p.id}">✕</button></div>`).join(''):'<div class="empty">Оплат ще немає</div>'}</div></div>`;
  el.querySelector('#add').onclick=modal;
  el.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{if(confirm('Видалити оплату?')){S.payments=S.payments.filter(p=>p.id!==b.dataset.d);save();MK.render()}});
}});
function modal(){
  if(!S.students.length){openM('<h3>Немає учнів</h3><p>Спочатку додайте учня.</p><div class="row" style="justify-content:flex-end"><a class="btn pri" href="students.html">До учнів</a></div>');return}
  openM(`<h3>Нова оплата</h3><label>Учень</label><select id="ps">${S.students.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select>
  <div class="two"><div><label>Сума, ${esc(S.profile.cur)}</label><input id="pa" type="number" min="0.01" step="any"></div><div><label>Дата</label><input id="pd" type="date" value="${iso(new Date())}"></div></div>
  <label>Примітка</label><input id="pn"><div class="err" id="er"></div>
  <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" data-close>Скасувати</button><button class="btn pri" id="ok">Зберегти</button></div>`);
  document.getElementById('ok').onclick=()=>{
    const amount=parseFloat(document.getElementById('pa').value),date=document.getElementById('pd').value;
    if(!Number.isFinite(amount)||amount<=0){document.getElementById('er').textContent='Введіть суму більше 0';return}
    if(!date){document.getElementById('er').textContent='Вкажіть дату';return}
    S.payments.push({id:uid(),studentId:document.getElementById('ps').value,amount,date,note:document.getElementById('pn').value.trim()});
    save();closeM();toast('Оплату додано');MK.render();
  };
}
})();

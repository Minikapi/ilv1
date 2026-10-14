(function(){
const {S,save,esc,uid,money,COLORS,balance,studentCharge,studentPaid,palette,openM,closeM,toast,student}=MK;
let q='',showArch=false;
MK.page({key:'students',title:'Учні',sub:'Кожному учню можна задати свій колір — він використовується в розкладі',render(el){
  const list=S.students.filter(s=>(showArch||s.active!==false)&&s.name.toLowerCase().includes(q.toLowerCase()));
  el.innerHTML=`<div class="row sp" style="margin-bottom:14px"><div class="row"><input id="q" placeholder="Пошук…" value="${esc(q)}" style="width:220px"><label class="chk"><input type="checkbox" id="ar" ${showArch?'checked':''}> Показати архівних</label></div><button class="btn pri" id="add">+ Додати учня</button></div>
  <div class="card">${list.length?list.map(s=>{const b=balance(s.id);return `<div class="it"><span class="dot" style="background:${s.color}"></span><div class="grow"><b>${esc(s.name)}</b>${s.active===false?' <span class="pill">архів</span>':''}<small>${money(s.price)} за урок${s.contact?' · '+esc(s.contact):''}</small>${s.notes?`<small>${esc(s.notes)}</small>`:''}</div><div style="text-align:right"><span class="pill ${b<0?'bad':'ok'}">${b<0?'борг '+money(-b):'баланс '+money(b)}</span></div><button class="btn sm" data-e="${s.id}">Змінити</button><button class="btn sm dng" data-d="${s.id}">Видалити</button></div>`}).join(''):'<div class="empty">Учнів ще немає</div>'}</div>`;
  el.querySelector('#q').oninput=e=>{q=e.target.value;const p=e.target.selectionStart;MK.render();const n=document.querySelector('#q');n.focus();n.setSelectionRange(p,p)};
  el.querySelector('#ar').onchange=e=>{showArch=e.target.checked;MK.render()};
  el.querySelector('#add').onclick=()=>modal();
  el.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>modal(b.dataset.e));
  el.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{
    const s=student(b.dataset.d);
    if(!confirm(`Видалити учня «${s.name}» разом з його уроками та оплатами?\n(Щоб зберегти історію, краще перенести в архів через «Змінити».)`))return;
    S.students=S.students.filter(x=>x.id!==s.id);
    S.events=S.events.filter(e=>!(e.kind==='student'&&e.refId===s.id));
    S.payments=S.payments.filter(p=>p.studentId!==s.id);
    S.groups.forEach(g=>g.members=g.members.filter(m=>m!==s.id));
    save();toast('Учня видалено');MK.render();
  });
}});
function modal(id){
  const s=id?student(id):{name:'',price:0,color:COLORS[S.students.length%COLORS.length],contact:'',notes:'',active:true};
  openM(`<h3>${id?'Редагувати учня':'Новий учень'}</h3>
  <label>Ім'я</label><input id="sn" value="${esc(s.name)}">
  <div class="two"><div><label>Ціна за урок, ${esc(S.profile.cur)}</label><input id="sp" type="number" min="0" step="any" value="${s.price||0}"></div><div><label>Контакт (телефон / Telegram)</label><input id="sc" value="${esc(s.contact||'')}"></div></div>
  <label>Колір у розкладі</label>${palette('scol',s.color)}
  <label>Нотатки</label><textarea id="snt" rows="3">${esc(s.notes||'')}</textarea>
  <label class="chk"><input type="checkbox" id="sa" ${s.active!==false?'checked':''}> Активний учень</label>
  <div class="err" id="er"></div>
  <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" data-close>Скасувати</button><button class="btn pri" id="ok">Зберегти</button></div>`);
  document.getElementById('ok').onclick=()=>{
    const name=document.getElementById('sn').value.trim(),price=parseFloat(document.getElementById('sp').value);
    if(!name){document.getElementById('er').textContent="Введіть ім'я";return}
    if(!Number.isFinite(price)||price<0){document.getElementById('er').textContent='Ціна має бути числом від 0';return}
    const d={name,price,contact:document.getElementById('sc').value.trim(),notes:document.getElementById('snt').value.trim(),color:document.getElementById('scol').value,active:document.getElementById('sa').checked};
    if(id)Object.assign(s,d);else S.students.push(Object.assign({id:uid()},d));
    save();closeM();toast('Збережено');MK.render();
  };
}
})();

(function(){
const {S,save,esc,uid,money,COLORS,palette,openM,closeM,toast,student,group}=MK;
MK.page({key:'groups',title:'Групи',sub:'Групові заняття: ціна вказується за одного учня',render(el){
  el.innerHTML=`<div class="row" style="margin-bottom:14px"><button class="btn pri" id="add">+ Створити групу</button></div>
  <div class="card">${S.groups.length?S.groups.map(g=>`<div class="it"><span class="dot" style="background:${g.color}"></span><div class="grow"><b>${esc(g.name)}</b><small>${money(g.price)} з учня · ${g.members.length} учн.${g.members.length?': '+g.members.map(id=>esc((student(id)||{}).name||'?')).join(', '):''}</small></div><button class="btn sm" data-e="${g.id}">Змінити</button><button class="btn sm dng" data-d="${g.id}">Видалити</button></div>`).join(''):'<div class="empty">Груп ще немає</div>'}</div>`;
  el.querySelector('#add').onclick=()=>modal();
  el.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>modal(b.dataset.e));
  el.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{
    const g=group(b.dataset.d);if(!confirm(`Видалити групу «${g.name}» і всі її заняття?`))return;
    S.groups=S.groups.filter(x=>x.id!==g.id);S.events=S.events.filter(e=>!(e.kind==='group'&&e.refId===g.id));save();toast('Групу видалено');MK.render();
  });
}});
function modal(id){
  const g=id?group(id):{name:'',price:0,color:COLORS[(S.groups.length+3)%COLORS.length],members:[]};
  openM(`<h3>${id?'Редагувати групу':'Нова група'}</h3>
  <label>Назва</label><input id="gn" value="${esc(g.name)}">
  <label>Ціна за урок з одного учня, ${esc(S.profile.cur)}</label><input id="gp" type="number" min="0" step="any" value="${g.price||0}">
  <label>Колір</label>${palette('gc',g.color)}
  <label>Учасники</label>${S.students.length?S.students.map(s=>`<label class="chk"><input type="checkbox" class="gm" value="${s.id}" ${g.members.includes(s.id)?'checked':''}><span class="dot" style="background:${s.color}"></span>${esc(s.name)}</label>`).join(''):'<div class="empty">Спочатку додайте учнів</div>'}
  <div class="err" id="er"></div>
  <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" data-close>Скасувати</button><button class="btn pri" id="ok">Зберегти</button></div>`);
  document.getElementById('ok').onclick=()=>{
    const name=document.getElementById('gn').value.trim(),price=parseFloat(document.getElementById('gp').value);
    if(!name){document.getElementById('er').textContent='Введіть назву';return}
    if(!Number.isFinite(price)||price<0){document.getElementById('er').textContent='Ціна має бути числом від 0';return}
    const d={name,price,color:document.getElementById('gc').value,members:[...document.querySelectorAll('.gm:checked')].map(x=>x.value)};
    if(id)Object.assign(g,d);else S.groups.push(Object.assign({id:uid()},d));
    save();closeM();toast('Збережено');MK.render();
  };
}
})();

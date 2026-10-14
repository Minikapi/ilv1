(function(){
const {S,iso,esc,money,student}=MK;
MK.page({key:'calc',title:'Калькулятор доходу',sub:'Розрахунок заробітку з урахуванням знижки, податку та витрат',render(el){
  el.innerHTML=`<div class="cols" style="align-items:start"><div class="card">
   <label>Учень (необов'язково — підставить ціну та кількість уроків за місяць)</label><select id="cs"><option value="">—</option>${S.students.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select>
   <div class="two"><div><label>Ціна за урок</label><input id="cp" type="number" min="0" step="any" value="0"></div><div><label>Кількість уроків</label><input id="cn" type="number" min="0" step="1" value="0"></div></div>
   <div class="two"><div><label>Знижка, %</label><input id="cd" type="number" min="0" max="100" step="any" value="0"></div><div><label>Податок, %</label><input id="ct" type="number" min="0" max="100" step="any" value="0"></div></div>
   <label>Витрати</label><input id="cx" type="number" min="0" step="any" value="0">
   <div class="err" id="ce"></div><button class="btn" id="cr">Скинути</button></div>
  <div class="card"><table class="t"><tr><td>Сума без знижки</td><td id="r1"></td></tr><tr><td>Знижка</td><td id="r2"></td></tr><tr><td>Податок</td><td id="r3"></td></tr><tr><td>Витрати</td><td id="r4"></td></tr></table>
   <div style="margin-top:14px;color:var(--mut);font-size:12px;text-transform:uppercase;letter-spacing:.08em">Чистий дохід</div><div class="res" id="rn"></div></div></div>
  <div class="card" style="margin-top:14px"><h3>Дохід за поточний місяць за розкладом</h3><table class="t" id="mt"></table></div>`;
  const $=id=>el.querySelector('#'+id);
  const num=id=>{const raw=String($(id).value).replace(',','.').trim();if(raw==='')return 0;const v=Number(raw);return Number.isFinite(v)?v:NaN};
  function calc(){
    const p=num('cp'),n=num('cn'),d=num('cd'),t=num('ct'),x=num('cx');
    let err='';
    if([p,n,d,t,x].some(Number.isNaN))err='Введіть коректні числа';
    else if(p<0||n<0||x<0)err="Значення не можуть бути від'ємними";
    else if(d>100||t>100)err='Відсотки мають бути від 0 до 100';
    else if(!Number.isInteger(n))err='Кількість уроків має бути цілою';
    $('ce').textContent=err;
    if(err){['r1','r2','r3','r4','rn'].forEach(i=>$(i).textContent='—');return}
    const gross=p*n,disc=gross*d/100,base=gross-disc,tax=base*t/100,net=base-tax-x;
    $('r1').textContent=money(gross);$('r2').textContent='−'+money(disc);$('r3').textContent='−'+money(tax);$('r4').textContent='−'+money(x);
    $('rn').textContent=money(net);$('rn').style.color=net<0?'var(--danger)':'#16795c';
  }
  ['cp','cn','cd','ct','cx'].forEach(i=>$(i).addEventListener('input',calc));
  const ym=iso(new Date()).slice(0,7);
  const cnt=id=>S.events.filter(e=>e.kind==='student'&&e.refId===id&&e.date.startsWith(ym)&&e.status!=='cancelled').length;
  $('cs').onchange=()=>{const s=student($('cs').value);if(s){$('cp').value=s.price||0;$('cn').value=cnt(s.id)}calc()};
  $('cr').onclick=()=>{['cp','cn','cd','ct','cx'].forEach(i=>$(i).value=0);$('cs').value='';calc()};
  $('mt').innerHTML='<tr><th>Учень</th><th>Уроків</th><th>Сума</th></tr>'+(S.students.length?S.students.map(s=>`<tr><td><span class="dot" style="background:${s.color}"></span> ${esc(s.name)}</td><td>${cnt(s.id)}</td><td>${money(cnt(s.id)*(s.price||0))}</td></tr>`).join(''):'<tr><td colspan="3" class="empty">Немає учнів</td></tr>');
  calc();
}});
})();

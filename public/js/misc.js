(function(){
const key=document.body.dataset.page;
const M=window.MK,S=M.S;
const {esc,iso,addDays,pad,fdate,toast,DAYS_FULL}=M;
const ERR={invalid_credentials:'Невірна пошта або пароль',email_taken:'Ця пошта вже зареєстрована',weak_password:'Пароль: мінімум 6 символів',bad_email:'Введіть коректну пошту',bad_name:"Введіть ім'я",rate_limited:'Забагато спроб, спробуйте за кілька хвилин',network:'Немає зв\'язку із сервером',unauthorized:'Потрібно увійти'};
const errText=e=>ERR[e&&(e.code||(e.network&&'network'))]||'Помилка. Спробуйте ще раз';

/* ---------- LOGIN / REGISTER ---------- */
if(key==='login'){
  document.title='Вхід — MiniKapi';
  (async()=>{
    try{await M.api('GET','/api/me');location.replace('index.html');return}catch(e){}
    let mode='login';
    document.body.style.justifyContent='center';
    const draw=()=>{
      document.body.innerHTML=`<div class="login"><div class="logo">${M.LOGO}<span>Mini<b>Kapi</b></span></div><p style="color:var(--mut)">Планувальник репетитора</p>
      <div class="seg" style="margin-bottom:8px"><button class="btn ${mode==='login'?'on':''}" data-m="login">Вхід</button><button class="btn ${mode==='reg'?'on':''}" data-m="reg">Реєстрація</button></div>
      <form id="f" style="text-align:left" autocomplete="on">
       ${mode==='reg'?'<label>Ваше ім\'я</label><input id="ln" autocomplete="name">':''}
       <label>Пошта</label><input id="le" type="email" autocomplete="email">
       <label>Пароль</label><input id="lp" type="password" autocomplete="${mode==='reg'?'new-password':'current-password'}" placeholder="мінімум 6 символів">
       <div class="err" id="er"></div>
       <button class="btn pri" id="go" type="submit" style="width:100%;justify-content:center;margin-top:6px">${mode==='reg'?'Створити акаунт':'Увійти'}</button></form></div>`;
      document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{mode=b.dataset.m;draw()});
      document.getElementById('f').onsubmit=async ev=>{
        ev.preventDefault();
        const er=document.getElementById('er'),btn=document.getElementById('go');er.textContent='';btn.disabled=true;
        const body={email:document.getElementById('le').value,password:document.getElementById('lp').value};
        if(mode==='reg')body.name=document.getElementById('ln').value;
        try{await M.api('POST',mode==='reg'?'/api/register':'/api/login',body);location.href='index.html'}
        catch(e){er.textContent=errText(e);btn.disabled=false}
      };
    };
    draw();
  })();
  return;
}

/* ---------- PUBLIC VIEW (без входу) ---------- */
if(key==='view'){
  document.title='MiniKapi';
  document.body.style.display='block';
  const slug=(new URLSearchParams(location.search).get('u')||'').toLowerCase();
  const wrap=h=>{document.body.innerHTML=`<div class="pub"><div class="logo" style="color:var(--ink)">${M.LOGO}<span>Mini<b>Kapi</b></span></div>${h}</div>`};
  if(!slug){wrap('<div class="card">Не вказано адресу сторінки.</div>');return}
  M.api('GET','/api/public/'+encodeURIComponent(slug)+'?from='+iso(new Date())).then(p=>{
    document.title=(p.name||'Репетитор')+' — MiniKapi';
    const now=new Date(),today=iso(now);
    const days=p.days.map(d=>{
      const free=d.free.filter(h=>d.date!==today||h>now.getHours());
      return `<div class="it" style="align-items:flex-start"><b style="width:140px">${DAYS_FULL[d.wd]}, ${fdate(d.date)}</b><div class="slots">${free.length?free.map(h=>`<span class="slot">${pad(h)}:00</span>`).join(''):'<small>зайнято</small>'}</div></div>`}).join('');
    wrap(`<div class="card" style="margin-bottom:14px"><h1 style="font-size:26px">${esc(p.name||'Репетитор')}</h1><div class="sub">${esc(p.subject)}</div><p style="white-space:pre-wrap">${esc(p.bio)}</p>${p.priceInfo?`<p><b>Вартість:</b> ${esc(p.priceInfo)}</p>`:''}${p.phone?`<p><b>Контакт:</b> ${esc(p.phone)}</p>`:''}</div><div class="card"><h3>Вільний час на найближчі 7 днів</h3>${days}<small style="color:var(--mut)">Час вказано за графіком репетитора.</small></div>`);
  }).catch(e=>wrap(`<div class="card">${e.status===403?'Ця сторінка вимкнена власником.':e.status===404?'Сторінку не знайдено.':'Не вдалося завантажити сторінку.'}</div>`));
  return;
}

/* ---------- PAGES WITH SHELL ---------- */
const pages={
tariff:{title:'Тариф',sub:'Тимчасово всі функції безкоштовні — для тестування',render(el){
  const P=[{n:'Free',p:'0 ₴',f:['Учні та групи','Розклад і оплати','Публічна сторінка']},{n:'Pro',p:'199 ₴/міс',f:['Необмежено учнів','Групові заняття','Аналітика доходу','Експорт даних']},{n:'Max',p:'399 ₴/міс',f:['Усе з Pro','Кілька репетиторів','Пріоритетна підтримка']}];
  el.innerHTML=`<div class="hint"><b>Тестовий період:</b> усі можливості тарифів Free, Pro і Max відкриті безкоштовно, обмежень немає. Оплата не підключена.</div>
  <div class="plans">${P.map(x=>`<div class="card plan ${x.n==='Max'?'cur':''}"><h3>${x.n}</h3><div class="price"><s style="color:var(--mut);font-size:18px">${x.p}</s> 0 ₴</div><ul>${x.f.map(f=>`<li>${f}</li>`).join('')}</ul><span class="pill ok">${x.n==='Max'?'Активний (безкоштовно)':'Доступно безкоштовно'}</span></div>`).join('')}</div>`;
}},
pages:{title:'Публічні сторінки',sub:'Візитка для учнів: профіль і вільні години',render(el){
  const p=S.profile;
  const link=()=>p.slug?new URL('view.html?u='+encodeURIComponent(p.slug),location.href).href:'';
  el.innerHTML=`<div class="cols" style="align-items:start"><div class="card"><label class="chk"><input type="checkbox" id="pp" ${p.pub?'checked':''}> Публічна сторінка увімкнена</label>
  <label>Адреса сторінки (a-z, 0-9, дефіс; 3–30 символів)</label><input id="psl" value="${esc(p.slug)}" placeholder="напр.: viktoriya-math">
  <label>Спеціалізація / предмет</label><input id="ps" value="${esc(p.subject)}">
  <label>Про себе</label><textarea id="pb" rows="4">${esc(p.bio)}</textarea>
  <label>Вартість (текстом)</label><input id="pi" value="${esc(p.priceInfo)}" placeholder="Напр.: 400 ₴ / 60 хв">
  <label>Контакт</label><input id="pt" value="${esc(p.phone)}"><div class="err" id="er"></div>
  <div class="row" style="margin-top:12px"><button class="btn pri" id="sv">Зберегти</button><button class="btn" id="op">Відкрити сторінку ↗</button><button class="btn" id="cp">Копіювати посилання</button></div></div>
  <div class="card"><h3>Як це працює</h3><p style="color:var(--mut)">Сторінка за адресою <code>view.html?u=ваша-адреса</code> доступна будь-кому без входу. Вона показує профіль і вільні години на 7 днів уперед (з урахуванням розкладу та «Недоступного» часу). Імена учнів та оплати не публікуються.</p></div></div>`;
  const read=()=>{p.pub=el.querySelector('#pp').checked;p.slug=el.querySelector('#psl').value.trim().toLowerCase();p.subject=el.querySelector('#ps').value.trim();p.bio=el.querySelector('#pb').value.trim();p.priceInfo=el.querySelector('#pi').value.trim();p.phone=el.querySelector('#pt').value.trim()};
  const persist=async()=>{read();if(p.slug&&!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(p.slug)){el.querySelector('#er').textContent='Адреса: 3–30 символів, a-z, 0-9 та дефіс, не на краях';return false}
    el.querySelector('#er').textContent='';const r=await M.saveNow();if(r.ok)toast('Збережено');else if(r.error==='slug_taken'||r.error==='bad_slug'){el.querySelector('#psl').value='';}return r.ok};
  el.querySelector('#sv').onclick=persist;
  el.querySelector('#op').onclick=async()=>{if(!(await persist()))return;if(!p.slug){toast('Вкажіть адресу сторінки');return}window.open(link(),'_blank','noopener')};
  el.querySelector('#cp').onclick=async()=>{if(!(await persist()))return;if(!p.slug){toast('Вкажіть адресу сторінки');return}const u=link();(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>toast('Посилання скопійовано'),()=>prompt('Скопіюйте посилання:',u))};
}},
updates:{title:'Оновлення',sub:'Що нового в MiniKapi',render(el){
  const L=[['1.1.0','Сервер','Реєстрація, вхід, дані зберігаються на сервері, публічна сторінка за адресою.'],['1.1.0','Тариф','Тимчасово всі функції безкоштовні.'],['1.0.0','Кольори','Власний колір для кожного заняття та учня/групи.'],['1.0.0','Видалення','Вибір типу видалення: лише це, вся колонка, день тижня, вся серія.'],['1.0.0','Калькулятор','Виправлено розрахунки та валідацію введення.']];
  el.innerHTML=`<div class="card">${L.map(x=>`<div class="it"><span class="pill ok">v${x[0]}</span><div class="grow"><b>${x[1]}</b><small>${x[2]}</small></div></div>`).join('')}</div>`;
}},
profile:{title:'Профіль',sub:'Налаштування акаунта та даних',render(el){
  const p=S.profile;
  el.innerHTML=`<div class="cols" style="align-items:start"><div><div class="card" style="margin-bottom:14px"><label>Ім'я</label><input id="n" value="${esc(p.name)}">
  <label>Пошта (логін)</label><input value="${esc((M.user||{}).email)}" disabled>
  <div class="two"><div><label>Початок робочого дня (година)</label><input id="s" type="number" min="0" max="23" value="${p.start}"></div><div><label>Кінець (година)</label><input id="e" type="number" min="1" max="24" value="${p.end}"></div></div>
  <label>Валюта</label><select id="c">${['₴','$','€','₽','zł','£'].map(c=>`<option ${p.cur===c?'selected':''}>${c}</option>`).join('')}</select><div class="err" id="er"></div>
  <button class="btn pri" id="sv" style="margin-top:8px">Зберегти</button></div>
  <div class="card"><h3>Змінити пароль</h3><label>Поточний пароль</label><input id="po" type="password" autocomplete="current-password"><label>Новий пароль</label><input id="pn" type="password" autocomplete="new-password"><div class="err" id="er2"></div><button class="btn" id="cpw" style="margin-top:8px">Змінити пароль</button></div></div>
  <div class="card"><h3>Дані</h3><p style="color:var(--mut)">Дані зберігаються на сервері. Робіть резервні копії.</p>
  <div class="row"><button class="btn" id="ex">Експорт (JSON)</button><label class="btn" style="margin:0;color:var(--ink)">Імпорт<input type="file" id="im" accept=".json" hidden></label><button class="btn dng" id="rs">Очистити всі дані</button></div>
  <hr style="border:0;border-top:1px solid var(--line);margin:16px 0"><button class="btn dng" id="da">Видалити акаунт…</button></div></div>`;
  el.querySelector('#sv').onclick=async()=>{const n=el.querySelector('#n').value.trim(),a=+el.querySelector('#s').value,b=+el.querySelector('#e').value;
    if(!n){el.querySelector('#er').textContent="Введіть ім'я";return}
    if(!(Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b<=24&&a<b)){el.querySelector('#er').textContent='Початок має бути раніше за кінець (цілі години 0–24)';return}
    p.name=n;p.start=a;p.end=b;p.cur=el.querySelector('#c').value;const r=await M.saveNow();if(r.ok){toast('Збережено');setTimeout(()=>location.reload(),400)}};
  el.querySelector('#cpw').onclick=async()=>{const e2=el.querySelector('#er2');e2.textContent='';
    try{await M.api('POST','/api/password',{old:el.querySelector('#po').value,new:el.querySelector('#pn').value});el.querySelector('#po').value='';el.querySelector('#pn').value='';toast('Пароль змінено')}catch(e){e2.textContent=errText(e)}};
  el.querySelector('#ex').onclick=()=>M.download('minikapi-backup-'+iso(new Date())+'.json',JSON.stringify(S,null,1));
  el.querySelector('#im').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const obj=JSON.parse(r.result);if(!confirm('Замінити поточні дані імпортованими?'))return;M.importData(obj);const res=await M.saveNow();if(res.ok){toast('Імпортовано');setTimeout(()=>location.reload(),400)}}catch(x){toast('Файл не підходить')}};r.readAsText(f)};
  el.querySelector('#rs').onclick=async()=>{if(!confirm('Очистити ВСІ дані (учні, уроки, оплати)? Це не можна скасувати.'))return;const nm=p.name;M.resetData();S.profile.name=nm;const r=await M.saveNow();if(r.ok)location.reload()};
  el.querySelector('#da').onclick=async()=>{const pw=prompt('Щоб видалити акаунт назавжди, введіть пароль:');if(!pw)return;
    try{await M.api('POST','/api/delete-account',{password:pw});location.href='login.html'}catch(e){toast(errText(e))}};
}},
how:{title:'Як це працює',sub:'Короткий посібник',render(el){
  const st=[['Додайте учнів','Розділ «Навчання → Учні»: ім\'я, ціна за урок і колір.'],['Створіть групи','За потреби — групові заняття, ціна вказується з одного учня.'],['Плануйте в розкладі','Клік по клітинці створює заняття. Можна повторювати щотижня.'],['Редагуйте та видаляйте','Клік по заняттю відкриває картку: тема, опис, домашнє, колір, статус. «Видалити…» дає вибір типу.'],['Позначайте результат','Статус «Проведено» нараховує вартість і формує дохід.'],['Ведіть оплати','У розділі «Оплати» видно баланс кожного учня.'],['Діліться візиткою','У «Публічних сторінках» задайте адресу і надішліть посилання учням.']];
  el.innerHTML=`<div class="steps">${st.map(s=>`<div class="card"><div><b>${s[0]}</b><div style="color:var(--mut)">${s[1]}</div></div></div>`).join('')}</div>`;
}},
support:{title:'Підтримка',sub:'Відповіді на поширені питання',render(el){
  const Q=[['Де зберігаються дані?','На сервері, в акаунті. Робіть експорт у «Профілі».'],['Як змінити робочі години?','Профіль → початок і кінець робочого дня.'],['Як видалити багато занять?','Відкрийте заняття → «Видалити…» і оберіть тип видалення.'],['Як змінити колір заняття?','У картці заняття оберіть колір; кнопка скидання поверне колір учня.']];
  el.innerHTML=`<div class="card faq">${Q.map(q=>`<details><summary>${q[0]}</summary><p>${q[1]}</p></details>`).join('')}<p style="margin-top:14px">Не знайшли відповідь? Напишіть: <a href="mailto:${M.SUPPORT_EMAIL}" style="text-decoration:underline">${M.SUPPORT_EMAIL}</a></p></div>`;
}}
};
const cfg=pages[key];
if(cfg)M.page({key:key,title:cfg.title,sub:cfg.sub,render:cfg.render});
})();

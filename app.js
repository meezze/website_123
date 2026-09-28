(() => {
  'use strict';
  const C = window.DAXI_CONFIG;
  const DICT = window.DAXI_I18N;
  const STORE = 'daxi_site_state_v1';
  const LANG_KEY = 'daxi_lang';
  const INTRO_KEY = 'daxi_intro_seen_v2';
  const PATHS = ['driver','car','owner','business'];
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const t = (key) => (DICT[state.lang] && DICT[state.lang][key]) || DICT.ru[key] || key;
  const fmt = (n) => new Intl.NumberFormat(state.lang === 'ro' ? 'ro-MD' : 'ru-MD', {maximumFractionDigits:0}).format(Math.round(n));
  const esc = (v='') => String(v).replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const pathKey = {driver:'pathDriver',car:'pathCar',owner:'pathOwner',business:'pathBusiness'};
  const classKey = {standard:'standard',comfort:'comfort',comfortPlus:'comfortPlus',electric:'electric'};
  const steps = {
    driver:['experience','car','schedule','driving'],
    car:['experience','class','buyout','schedule','driving'],
    owner:['car','location','ready'],
    business:['fleet','drivers','classes','priority']
  };
  const defaults = () => ({hours:8,days:5,fleet:5,classes:[]});
  let state = {lang:'ru', view:'choose', path:null, step:0, answers:defaults(), returning:false, utm:{}};
  let introTimer = 0;
  let lenis;

  function init() {
    const params = new URLSearchParams(location.search);
    const routePath = PATHS.includes(location.pathname.split('/').filter(Boolean).pop()) ? location.pathname.split('/').filter(Boolean).pop() : null;
    const queryPath = PATHS.includes(params.get('path')) ? params.get('path') : null;
    const saved = loadState();
    const savedLang = localStorage.getItem(LANG_KEY);
    state.lang = ['ru','ro'].includes(params.get('lang')) ? params.get('lang') : (['ru','ro'].includes(savedLang) ? savedLang : 'ru');
    state.utm = Object.fromEntries([...params.entries()].filter(([k]) => k.startsWith('utm_')));
    const forced = routePath || queryPath;
    if (forced) {
      state.path = forced;
      if (saved && saved.path === forced) {
        state.answers = {...defaults(), ...saved.answers};
        state.step = Math.min(saved.step || 0, steps[forced].length - 1);
        state.view = saved.completed ? 'result' : 'quiz';
        state.returning = !!saved.completed;
      } else {
        state.answers = defaults();
        state.view = 'quiz';
      }
    } else if (saved && PATHS.includes(saved.path)) {
      state.path = saved.path;
      state.answers = {...defaults(), ...saved.answers};
      state.step = Math.min(saved.step || 0, steps[saved.path].length - 1);
      state.view = saved.completed ? 'result' : 'quiz';
      state.returning = !!saved.completed;
      state.utm = {...saved.utm, ...state.utm};
    } else {
      state.view = 'choose';
    }
    document.documentElement.lang = state.lang;
    renderAll();
    initMotion();
    if (!localStorage.getItem(INTRO_KEY)) showIntro();
    bindGlobal();
    installPixels();
  }

  function loadState(){ try { return JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { return null; } }
  function persist(completed = state.view === 'result') {
    localStorage.setItem(LANG_KEY, state.lang);
    if (!state.path) return;
    localStorage.setItem(STORE, JSON.stringify({version:C.schemaVersion, lang:state.lang, path:state.path, step:state.step, answers:state.answers, completed, utm:state.utm, savedAt:Date.now()}));
  }

  function renderAll(){
    const inFlow = state.view !== 'home';
    document.body.classList.toggle('flow-lock', inFlow);
    renderHeader();
    renderHome();
    renderFlow();
    renderFooter();
    renderAppModal();
    updateMeta();
    requestAnimationFrame(() => refreshMotion());
  }

  function renderHeader(){
    const header=$('#site-header');
    const focused = state.view!=='home';
    header.classList.toggle('flow-mode',focused);
    if(focused){
      header.innerHTML = `
        <div class="nav-inner flow-nav">
          <div class="wordmark-static">${logoSvg(false)}</div>
          <div class="nav-actions"><button class="lang-switch" data-lang aria-label="Language">${state.lang.toUpperCase()} <span>/</span> ${t('other')}</button></div>
        </div>`;
      return;
    }
    header.innerHTML = `
      <div class="nav-inner">
        <button class="wordmark" data-go-home aria-label="Daxi">${logoSvg(false)}</button>
        <nav class="nav-links" aria-label="Navigation">
          <button data-scroll="how">${t('navHow')}</button>
          <button data-scroll="app">${t('navApp')}</button>
          <button data-scroll="faq">${t('navFaq')}</button>
        </nav>
        <div class="nav-actions">
          <button class="lang-switch" data-lang aria-label="Language">${state.lang.toUpperCase()} <span>/</span> ${t('other')}</button>
          <button class="pill pill-black" data-app>${t('navStart')} <span>↗</span></button>
          <button class="menu-button" data-menu aria-label="Menu"><i></i><i></i></button>
        </div>
      </div>`;
  }

  function renderHome(){
    const home = $('#home');
    home.hidden = state.view !== 'home';
    if (state.view !== 'home') return;
    const pillars = ['p1','p2','p3','p4','p5','p6','p7'];
    home.innerHTML = `
      <section class="hero dark" id="top">
        <div class="hero-map">${routeSvg('hero')}</div>
        <div class="section hero-grid">
          <div class="hero-copy" data-reveal>
            <span class="kicker">${t('heroEyebrow')}</span>
            <h1 class="mega"><span>${t('heroA')}</span><span class="amber">${t('heroB')}</span></h1>
            <p>${t('heroText')}</p>
            <div class="hero-actions"><button class="pill pill-amber" data-scroll="paths">${t('heroCta')} <b>→</b></button><button class="text-link light" data-app>${t('heroApp')} ↗</button></div>
          </div>
          <div class="hero-object" data-reveal>
            <div class="phone phone-tilt">${appScreen('finance')}</div>
            <div class="float-ticket"><small>${t('p1')}</small><strong>0<em> lei</em></strong><span>${state.lang==='ru'?'если нет заказов':'dacă nu sunt comenzi'}</span></div>
            <div class="platform-line"><span>Yandex</span><span>Bolt</span><span>Letz</span></div>
          </div>
        </div>
        <div class="section hero-stats">
          <div><strong>${C.facts.cars}+</strong><span>${t('factCars')}</span></div>
          <div><strong>0 lei</strong><span>${t('factFee')}</span></div>
          <div><strong>${C.facts.support}</strong><span>${t('factSupport')}</span></div>
          <button data-scroll="how"><span>${t('navHow')}</span><b>↓</b></button>
        </div>
      </section>
      <section class="how section" id="how">
        ${sectionHead('01',t('howTitle'),t('howSub'))}
        <div class="how-scroller" tabindex="0" aria-label="${t('howTitle')}">
          ${howScene(1,t('scene1'),t('scene1p'),'request')}
          ${howScene(2,t('scene2'),t('scene2p'),'hub')}
          ${howScene(3,t('scene3'),t('scene3p'),'services')}
          ${howScene(4,t('scene4'),t('scene4p'),'finance')}
        </div>
        <div class="how-footer"><div class="scroll-hint"><span></span>${state.lang==='ru'?'Листай':'Glisează'}</div><button class="pill pill-black" data-scroll="paths">${t('calculate')} →</button></div>
      </section>
      <section class="paths section" id="paths">
        <span class="kicker">02 / ${state.lang==='ru'?'ВАШ ВАРИАНТ':'VARIANTA DVS.'}</span>
        <h2 class="display">${t('who')}</h2><p class="lead">${t('whoSub')}</p>
        <div class="path-grid">
          ${pathCard('driver','01')}${pathCard('car','02')}${pathCard('owner','03')}${pathCard('business','04')}
        </div>
      </section>
      <section class="pillars dark" id="pillars"><div class="section">
        <span class="kicker">03 / DAXI</span><h2 class="display light-title" data-reveal>${t('pillarsTitle')}</h2>
        <div class="pillar-grid">${pillars.map((p,i)=>`<article class="pillar-card ${i===0?'wide':''}" data-reveal><span class="pillar-index">0${i+1}</span><div><h3>${t(p)}</h3><p>${t(p+'d')}</p></div>${i===0?'<strong class="zero-big">0</strong>':''}</article>`).join('')}</div>
      </div></section>
      <section class="app-section" id="app"><div class="section">
        <div class="split-head"><div><span class="kicker">04 / DAXI APP</span><h2 class="display" data-reveal>${t('appTitle')}</h2></div><div><p>${t('appText')}</p><button class="pill pill-black" data-app>${t('navStart')} ↗</button></div></div>
        <div class="phones-row">
          ${appShowcase('finance',t('finance'),'01')}${appShowcase('bonus',t('bonus'),'02')}${appShowcase('pulse',t('pulse'),'03')}${appShowcase('owner',t('ownerBalance'),'04')}
        </div>
      </div></section>
      <section class="services section">
        <article class="feature"><div class="feature-copy"><span class="kicker">05 / SERVICE</span><h2>${t('serviceTitle')}</h2><p>${t('serviceText')}</p><button class="pill pill-outline" data-path="driver">${t('calculate')} →</button></div><div class="media-placeholder service-media"><span>${state.lang==='ru'?'МЕСТО ДЛЯ ФОТО СЕРВИСА DAXI':'LOC PENTRU FOTO SERVICE DAXI'}</span></div></article>
        <article class="feature feature-card"><div class="feature-copy"><span class="kicker">06 / BUYOUT</span><h2>${t('buyoutTitle')}</h2><p>${t('buyoutText')}</p><button class="pill pill-black" data-path="car">${t('calculate')} →</button></div><img src="https://daxi.md/assets/themes/daxi/img/catalog/10.webp" alt="Volkswagen ID.4 Daxi" loading="lazy" onerror="this.style.display='none'"/></article>
        <div class="two-cards"><article><span class="kicker">07 / OWNER</span><h2>${t('ownersTitle')}</h2><p>${t('ownersText')}</p><button class="text-link" data-path="owner">${t('calculate')} ↗</button></article><article class="dark-card"><span class="kicker">08 / BUSINESS</span><h2>${t('businessTitle')}</h2><p>${t('businessText')}</p><button class="text-link light" data-path="business">${t('calculate')} ↗</button></article></div>
      </section>
      <section class="faq section" id="faq"><div class="faq-title"><span class="kicker">09 / FAQ</span><h2 class="display">${t('faqTitle')}</h2><p>${t('faqSub')}</p></div><div class="faq-list">${[1,2,3,4,5].map(i=>`<details><summary>${t('faq'+i)}<b>+</b></summary><p>${t('faq'+i+'a')}</p></details>`).join('')}</div></section>
      <section class="referral dark"><div class="section referral-grid"><div><span class="kicker">10 / REFERRAL</span><h2>${t('referralTitle')}</h2><p>${t('referralText')}</p></div><div class="referral-num"><strong>${fmt(C.facts.referralBonus)}</strong><span>lei</span><button class="pill pill-amber" data-path="driver">${t('calculate')} →</button></div></div></section>`;
  }

  function renderFlow(){
    const flow = $('#flow');
    flow.hidden = state.view === 'home';
    if(state.view==='home'){ flow.innerHTML=''; return; }
    if(state.view==='choose' || !state.path){ renderChooser(flow); return; }
    if(state.view==='quiz') renderQuiz(flow); else renderResult(flow);
  }

  function renderChooser(flow){
    const ru=state.lang==='ru';
    const cards=[
      ['driver',ru?'Есть своя машина':'Am mașina mea',ru?'Работать в такси на своём авто':'Lucrez în taxi cu mașina mea','01'],
      ['car',ru?'Нужна машина':'Am nevoie de o mașină',ru?'Работа, аренда и вариант выкупа':'Muncă, chirie și opțiune de cumpărare','02'],
      ['owner',ru?'Есть машина, пусть работает':'Am o mașină, să lucreze',ru?'Передать одну машину в управление':'Dau o mașină în administrare','03'],
      ['business',ru?'Компания или автопарк':'Companie sau flotă',ru?'Несколько машин, с водителями или без':'Mai multe mașini, cu șoferi sau fără','04']
    ];
    flow.innerHTML=`<main class="chooser-page" id="main">
      <section class="chooser-intro dark">
        <div class="chooser-route">${routeSvg('chooser')}</div>
        <div class="chooser-intro-inner">
          <span class="kicker">${ru?'ТВОЙ ПУТЬ В DAXI':'TRASEUL TĂU ÎN DAXI'}</span>
          <h1>${ru?'Сначала твоя ситуация.':'Începem cu situația ta.'}</h1>
          <p>${ru?'Выбери один вариант. Дальше покажем только то, что относится к тебе.':'Alege o variantă. Mai departe arătăm doar ce este relevant pentru tine.'}</p>
          <div class="chooser-facts"><span><b>0 lei</b>${ru?' без заказов':' fără comenzi'}</span><span><b>24/7</b>${ru?' поддержка':' suport'}</span><span><b>5–10</b>${ru?' дней оформление':' zile pentru acte'}</span></div>
        </div>
      </section>
      <section class="chooser-panel">
        <div class="chooser-top"><span>${ru?'Кто вы?':'Cine sunteți?'}</span><small>${ru?'1 нажатие':'1 atingere'}</small></div>
        <div class="chooser-cards">
          ${cards.map(([p,title,sub,n])=>`<button class="chooser-card" data-path="${p}"><span class="chooser-num">${n}</span><div><strong>${title}</strong><small>${sub}</small></div><i>↗</i></button>`).join('')}
        </div>
        <p class="chooser-note">${ru?'Без звонка и регистрации. Сначала просто разберём твой вариант.':'Fără apel și înregistrare. Mai întâi vedem varianta potrivită.'}</p>
      </section>
    </main>`;
    requestAnimationFrame(()=>animateFlowIn());
  }

  function renderQuiz(flow){
    const key = steps[state.path][state.step];
    const progress = ((state.step+1)/steps[state.path].length)*100;
    flow.innerHTML = `<main class="quiz-page" id="main"><div class="quiz-context dark"><div>${logoSvg(true)}<span class="kicker">${t(pathKey[state.path])}</span><h2>${contextTitle()}</h2><p>${contextText()}</p></div><div class="quiz-zero"><strong>0<small> lei</small></strong><span>${t('p1d')}</span></div></div><div class="quiz-panel"><div class="quiz-bar"><button data-back>← ${t('back')}</button><span>${state.step+1} / ${steps[state.path].length}</span></div><div class="progress"><i style="width:${progress}%"></i></div><div class="question" id="question" data-step="${key}">${questionMarkup(key)}</div></div></main>`;
    bindQuestion(key);
    requestAnimationFrame(()=>animateFlowIn());
  }

  function contextTitle(){
    if(state.path==='driver') return state.lang==='ru'?'Своя машина. Свой график.':'Mașina ta. Programul tău.';
    if(state.path==='car') return state.lang==='ru'?'Выбираем машину под твою работу.':'Alegem mașina pentru munca ta.';
    if(state.path==='owner') return state.lang==='ru'?'Машина работает. Вы всё видите.':'Mașina lucrează. Dvs. vedeți tot.';
    return state.lang==='ru'?'Одна машина. Потом масштаб.':'O mașină. Apoi scalare.';
  }
  function contextText(){
    if(state.path==='driver') return state.lang==='ru'?'Проверим авто, график и путь до подключения.':'Verificăm mașina, programul și drumul până la conectare.';
    if(state.path==='car') return state.lang==='ru'?'Покажем класс, пример расчёта и вариант выкупа.':'Arătăm clasa, calculul și varianta de cumpărare.';
    if(state.path==='owner') return state.lang==='ru'?'Сначала считаем одну машину.':'Mai întâi calculăm o mașină.';
    return state.lang==='ru'?'Считаем парк и показываем пример отчёта.':'Calculăm flota și arătăm un raport.';
  }

  function questionMarkup(key){
    if(key==='experience') return qWrap(t('qExperience'), chips([{v:'other',k:'expOther'},{v:'past',k:'expPast'},{v:'new',k:'expNew'}], 'experience'));
    if(key==='car') return qWrap(t('qCar'), carPicker());
    if(key==='schedule') return qWrap(t('qSchedule'), scheduleQuestion());
    if(key==='driving') return qWrap(t('qYears'), chips([{v:'under',k:'yearsUnder'},{v:'3-5',k:'years3'},{v:'5+',k:'years5'}], 'driving'));
    if(key==='class') return qWrap(t('qClass'), classCards());
    if(key==='buyout') return qWrap(t('qBuyout'), chips([{v:'yes',k:'buyYes'},{v:'no',k:'buyNo'}], 'buyout'));
    if(key==='location') return qWrap(t('qLocation'), chips([{v:'md',k:'locMD'},{v:'abroad',k:'locAbroad'}], 'location'));
    if(key==='ready') return qWrap(t('qReady'), chips([{v:'now',k:'readyNow'},{v:'month',k:'readyMonth'},{v:'explore',k:'readyLook'}], 'ready'));
    if(key==='fleet') return qWrap(t('qFleet'), `<div class="fleet-value"><strong>${state.answers.fleet||5}</strong><span>${state.lang==='ru'?'машин':'mașini'}</span></div><input class="range" type="range" min="2" max="100" value="${state.answers.fleet||5}" data-range="fleet" aria-label="${t('qFleet')}"><div class="range-ends"><span>2</span><span>100</span></div>`);
    if(key==='drivers') return qWrap(t('qDrivers'), chips([{v:'yes',k:'driversYes'},{v:'no',k:'driversNo'},{v:'some',k:'driversSome'}], 'drivers'));
    if(key==='classes') return qWrap(t('qClasses'), multiClass());
    if(key==='priority') return qWrap(t('qPriority'), chips([{v:'load',k:'priorityLoad'},{v:'records',k:'priorityRecords'},{v:'service',k:'priorityService'}], 'priority'));
    return '';
  }
  function autoStep(key){ return ['experience','driving','class','buyout','location','ready','drivers','priority'].includes(key); }
  function qWrap(title,body){ const key=steps[state.path][state.step]; return `<span class="kicker">${state.lang==='ru'?'ВОПРОС':'ÎNTREBARE'} ${String(state.step+1).padStart(2,'0')}</span><h1 tabindex="-1">${title}</h1><div class="question-body">${body}</div>${autoStep(key)?'':`<button class="pill pill-black question-next" data-next ${canNext()?'':'disabled'}>${t('next')} →</button>`}<p class="question-note">${state.lang==='ru'?'Ответы сохраняются на этом устройстве.':'Răspunsurile se salvează pe acest dispozitiv.'}</p>`; }
  function chips(items,key){ return `<div class="chips">${items.map(x=>`<button class="chip ${state.answers[key]===x.v?'active':''}" data-answer="${key}" data-value="${x.v}">${t(x.k)}<span>${state.answers[key]===x.v?'✓':'→'}</span></button>`).join('')}</div>`; }
  function classCards(){
    const defs=[['standard','Dacia Logan'],['comfort','Toyota Prius 50'],['comfortPlus','Lexus ES'],['electric','Volkswagen ID.4']];
    return `<div class="class-grid">${defs.map(([v,ex],i)=>`<button class="class-card ${state.answers.class===v?'active':''}" data-answer="class" data-value="${v}"><div class="car-silhouette">${carSvg(i===3)}</div><div><strong>${t(classKey[v])}</strong><small>${ex}</small></div><span>${state.answers.class===v?'✓':'↗'}</span></button>`).join('')}</div>`;
  }
  function multiClass(){
    return `<div class="class-grid multi">${['standard','comfort','comfortPlus','electric'].map(v=>`<button class="class-card ${state.answers.classes?.includes(v)?'active':''}" data-multi="${v}"><div>${carSvg(v==='electric')}</div><strong>${t(classKey[v])}</strong><span>${state.answers.classes?.includes(v)?'✓':'+'}</span></button>`).join('')}</div>`;
  }
  function scheduleQuestion(){
    return `<div class="schedule-presets"><button data-preset="evenings">${t('evenings')}</button><button data-preset="half">${t('half')}</button><button data-preset="full">${t('full')}</button></div><div class="slider-row"><label>${t('hours')}<strong>${state.answers.hours||8}</strong></label><input class="range" type="range" min="2" max="12" value="${state.answers.hours||8}" data-range="hours"><div class="range-ends"><span>2</span><span>12</span></div></div><div class="slider-row"><label>${t('days')}<strong>${state.answers.days||5}</strong></label><input class="range" type="range" min="1" max="7" value="${state.answers.days||5}" data-range="days"><div class="range-ends"><span>1</span><span>7</span></div></div>`;
  }
  function carPicker(){
    const full = state.answers.brand && state.answers.model ? `${state.answers.brand} ${state.answers.model}` : '';
    const cls = full ? C.modelToClass[full] : null;
    return `<div class="car-pickers">${picker('brand',t('brand'),Object.keys(C.catalog),state.answers.brand)}${picker('model',t('model'),state.answers.brand?C.catalog[state.answers.brand]:[],state.answers.model,!state.answers.brand)}${picker('year',t('year'),C.years.map(String),state.answers.year?String(state.answers.year):'',!state.answers.model)}</div><button class="not-listed ${state.answers.carUnknown?'active':''}" data-unknown>${state.answers.carUnknown?'✓':'+'} ${t('notListed')}</button>${state.answers.carUnknown?`<div class="inline-note">${t('managerCheck')}</div>`:cls?`<div class="inline-note"><span>${t('derivedClass')}</span><strong>${t(classKey[cls])}</strong>${demoBadge()}</div>`:''}`;
  }
  function picker(key,label,options,value,disabled=false){
    const shown = value || t('select');
    return `<div class="picker ${disabled?'disabled':''}" data-picker="${key}"><label>${label}</label><button class="picker-button" ${disabled?'disabled':''} aria-haspopup="listbox" aria-expanded="false"><span>${esc(shown)}</span><b>⌄</b></button><div class="picker-pop" hidden><input type="search" placeholder="${t('search')}" aria-label="${t('search')}"><div class="picker-list" role="listbox">${options.map(o=>`<button role="option" data-pick="${esc(o)}">${esc(o)}</button>`).join('')}</div></div></div>`;
  }

  function bindQuestion(key){
    const q = $('#question'); if(!q) return;
    q.addEventListener('click', e => {
      const chip = e.target.closest('[data-answer]');
      if(chip){
        const answerKey=chip.dataset.answer;
        state.answers[answerKey]=chip.dataset.value;
        persist(false);
        q.querySelectorAll('[data-answer="'+answerKey+'"]').forEach(x=>x.classList.toggle('active',x===chip));
        chip.classList.add('choice-pop');
        if(autoStep(key)) setTimeout(()=>nextQuestion(),180); else renderQuiz($('#flow'));
        return;
      }
      const multi=e.target.closest('[data-multi]');
      if(multi){ const v=multi.dataset.multi; const arr=new Set(state.answers.classes||[]); arr.has(v)?arr.delete(v):arr.add(v); state.answers.classes=[...arr]; persist(false); renderQuiz($('#flow')); return; }
      const preset=e.target.closest('[data-preset]');
      if(preset){ const p=preset.dataset.preset; const vals=p==='evenings'?[3,3]:p==='half'?[6,5]:[10,6]; state.answers.hours=vals[0]; state.answers.days=vals[1]; persist(false); renderQuiz($('#flow')); return; }
      const unknown=e.target.closest('[data-unknown]');
      if(unknown){ state.answers.carUnknown=!state.answers.carUnknown; if(state.answers.carUnknown){state.answers.brand='';state.answers.model='';state.answers.year='';persist(false);setTimeout(()=>nextQuestion(),180);} else renderQuiz($('#flow')); return; }
      const btn=e.target.closest('.picker-button');
      if(btn){ const wrap=btn.closest('.picker'); closePickers(wrap); const pop=$('.picker-pop',wrap); pop.hidden=!pop.hidden; btn.setAttribute('aria-expanded',String(!pop.hidden)); if(!pop.hidden) setTimeout(()=>$('.picker-pop input',wrap)?.focus(),0); return; }
      const opt=e.target.closest('[data-pick]');
      if(opt){
        const wrap=opt.closest('.picker'); const k=wrap.dataset.picker; let v=opt.dataset.pick;
        if(k==='year') v=Number(v);
        state.answers[k]=v; state.answers.carUnknown=false;
        if(k==='brand'){state.answers.model='';state.answers.year='';}
        if(k==='model') state.answers.year='';
        persist(false);
        if(k==='year') setTimeout(()=>nextQuestion(),180); else renderQuiz($('#flow'));
        return;
      }
      if(e.target.closest('[data-next]')) nextQuestion();
    });
    q.addEventListener('input', e => {
      if(e.target.matches('.picker-pop input')){ const term=e.target.value.toLowerCase(); $$('.picker-list button',e.target.closest('.picker')).forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(term)); }
      if(e.target.matches('[data-range]')){ const k=e.target.dataset.range; state.answers[k]=Number(e.target.value); if(k==='fleet') $('.fleet-value strong').textContent=e.target.value; else e.target.closest('.slider-row').querySelector('strong').textContent=e.target.value; persist(false); }
    });
    $('[data-back]', $('#flow'))?.addEventListener('click', () => {
      if(state.step>0){ transitionFlow(()=>{state.step--;renderFlow();scrollTop();},-1); }
      else {
        transitionFlow(()=>{
          state.path=null;state.step=0;state.answers=defaults();state.view='choose';
          const url=new URL(location.href);url.searchParams.delete('path');url.pathname=basePath();history.pushState({},'',url);
          renderAll();scrollTop();
        },-1);
      }
    });
    document.addEventListener('click', outsidePicker, {once:true,capture:true});
  }

  function outsidePicker(e){ if(!e.target.closest('.picker')) closePickers(); }
  function closePickers(except){ $$('.picker').forEach(p=>{ if(p!==except){$('.picker-pop',p).hidden=true;$('.picker-button',p)?.setAttribute('aria-expanded','false');} }); }
  function canNext(){ const k=steps[state.path][state.step],a=state.answers; if(k==='experience')return !!a.experience;if(k==='car')return !!a.carUnknown||!!(a.brand&&a.model&&a.year);if(k==='schedule')return !!(a.hours&&a.days);if(k==='driving')return !!a.driving;if(k==='class')return !!a.class;if(k==='buyout')return !!a.buyout;if(k==='location')return !!a.location;if(k==='ready')return !!a.ready;if(k==='fleet')return a.fleet>=2;if(k==='drivers')return !!a.drivers;if(k==='classes')return !!a.classes?.length;if(k==='priority')return !!a.priority;return false; }
  function nextQuestion(){
    if(!canNext()) return;
    const k=steps[state.path][state.step];
    track('question_answered',{path:state.path,question:k,step:state.step+1}); sendCRM('question_answered');
    if(state.step===steps[state.path].length-1){
      transitionFlow(()=>{state.view='result';state.returning=false;persist(true);renderAll();track('result_viewed',{path:state.path});sendCRM('result_viewed');scrollTop();},1);
    } else {
      transitionFlow(()=>{state.step++;persist(false);renderFlow();scrollTop();},1);
    }
  }

  function renderResult(flow){
    const r = calculate(); const a=state.answers; const blocked=['driver','car'].includes(state.path) && a.driving==='under';
    const title = blocked?t('resultUnder'):state.path==='owner'?t('resultOwner'):state.path==='business'?t('resultBusiness'):a.experience==='other'?t('resultOther'):a.buyout==='yes'?t('resultBuyout'):t('resultDriver');
    const elig = ['driver','owner'].includes(state.path) ? eligibility() : null;
    flow.innerHTML = `<main class="result dark" id="main"><div class="section result-shell"><div class="result-top"><button data-edit>← ${t('change')}</button><span>${t(pathKey[state.path])}</span></div><span class="kicker amber-text">${state.returning?t('returnTitle'):(state.lang==='ru'?'ВАШ ВАРИАНТ В DAXI':'VARIANTA DVS. ÎN DAXI')}</span><h1 class="display result-title">${title}</h1><div class="answer-tags">${answerSummary().slice(1).map(x=>`<span>${esc(x)}</span>`).join('')}</div>
      ${blocked?blockedResult():estimateMarkup(r)}
      ${elig?eligibilityMarkup(elig):''}
      <div class="result-layout"><div class="result-main">${!blocked && ['driver','car'].includes(state.path)?moneyMarkup(r)+comparisonMarkup(r):''}${state.path==='car'&&a.buyout==='yes'&&!blocked?buyoutMarkup():''}${state.path==='owner'?ownerMarkup(r):''}${state.path==='business'?businessMarkup(r):''}${!blocked?timelineMarkup():''}${checklistMarkup()}</div><aside>${conversionMarkup()}</aside></div>
    </div></main>`;
    bindResult(r);
    requestAnimationFrame(()=>{animateFlowIn();animateResult();});
  }
  function calculate(){
    const a=state.answers; let cls=a.class || 'standard';
    if(a.brand&&a.model) cls=C.modelToClass[`${a.brand} ${a.model}`] || 'standard';
    if(state.path==='business'&&a.classes?.length) cls=a.classes[0];
    const rate=C.finance.grossPerHourByClass[cls]||C.finance.grossPerHourByClass.standard;
    const hours=a.hours||8, days=a.days||5; const orders=hours*days*C.finance.ordersPerHour;
    let tier=C.finance.commissionTiers[0]; C.finance.commissionTiers.forEach(x=>{if(orders>=x.ordersFrom)tier=x});
    const weeklyGross=rate*hours*days, weeklyNet=weeklyGross*(1-tier.percent/100), monthly=weeklyNet*C.finance.weeksPerMonth, range=C.finance.rangePercent/100;
    const ownerBase=rate*10*6*C.finance.weeksPerMonth; const operating=1-C.finance.ownerOperatingExpensePercent/100;
    const ownerMonthly=ownerBase*operating*(C.finance.ownerSharePercent/100); const businessMonthly=ownerBase*operating*(C.finance.businessSharePercent/100)*(a.fleet||5);
    return {cls,rate,hours,days,orders,commission:tier.percent,weeklyGross,weeklyNet,weekLow:weeklyNet*(1-range),weekHigh:weeklyNet*(1+range),monthLow:monthly*(1-range),monthHigh:monthly*(1+range),ownerLow:ownerMonthly*(1-range),ownerHigh:ownerMonthly*(1+range),businessLow:businessMonthly*(1-range),businessHigh:businessMonthly*(1+range)};
  }
  function estimateMarkup(r){
    const isOwner=state.path==='owner'||state.path==='business'; const low=state.path==='owner'?r.ownerLow:state.path==='business'?r.businessLow:r.monthLow; const high=state.path==='owner'?r.ownerHigh:state.path==='business'?r.businessHigh:r.monthHigh;
    return `<section class="estimate"><div><span>${isOwner?t('ownerMonth'):t('perMonth')} ${demoBadge()}</span><strong><i data-count="${Math.round(low)}">0</i><b>–</b><i data-count="${Math.round(high)}">0</i><small> lei</small></strong><p>${isOwner?t('ownerEstimateNote'):t('preFuel')}</p></div>${!isOwner?`<div class="week-est"><span>${t('perWeek')}</span><strong>${fmt(r.weekLow)}–${fmt(r.weekHigh)} lei</strong>${demoBadge()}</div>`:''}</section><p class="estimate-note">${t('demoReason')}</p>`;
  }
  function blockedResult(){ return `<section class="blocked"><div class="shield">✓</div><h2>${t('underMessage')}</h2><p>${state.lang==='ru'?'Ответы сохранены. Вернись, когда стаж будет 3 года.':'Răspunsurile sunt salvate. Revino când ai 3 ani vechime.'}</p></section>`; }
  function eligibility(){ const a=state.answers;if(a.carUnknown)return 'check';const full=`${a.brand} ${a.model}`;if(C.eligibility.eligibleModels.includes(full)&&Number(a.year)>=C.eligibility.minCarYear)return 'yes';return 'no'; }
  function eligibilityMarkup(v){ const title=v==='yes'?t('eligible'):v==='no'?t('ineligible'):t('checkRequired');return `<section class="eligibility"><span class="elig-icon">✓</span><div><strong>${title}</strong><p>${t('demoRules')}</p>${v==='no'&&state.path==='driver'?`<button data-switch-car>${t('offerDaxiCar')} →</button>`:''}</div>${demoBadge()}</section>`; }
  function moneyMarkup(r){ return `<section class="result-card"><div class="card-head"><h2>${t('moneyTitle')}</h2>${demoBadge()}</div><div class="money-grid"><div><span>${t('gross')}</span><strong>${fmt(r.weeklyGross)} lei</strong></div><div><span>${t('commission')}</span><strong>${r.commission}%</strong></div><div><span>${t('yours')}</span><strong class="amber-text">${fmt(r.weeklyNet)} lei</strong></div></div><div class="money-bar"><i style="width:${100-r.commission}%"></i><b style="width:${r.commission}%"></b></div><p>${t('commissionDown')}</p></section>`; }
  function comparisonMarkup(r){
    const shortGross=r.rate*3, shortDaxi=shortGross*(1-r.commission/100); const fixed=C.facts.fixedRentPerDay; const rows=[['emptyDay',-fixed,0],['shortShift',shortGross-fixed,shortDaxi],['week',r.weeklyGross-fixed*r.days,r.weeklyNet]];
    const max=Math.max(...rows.flatMap(x=>[Math.abs(x[1]),Math.abs(x[2])]),1);
    return `<section class="result-card"><div class="card-head"><div><span class="kicker">${t('compareText')}</span><h2>${t('compareTitle')}</h2></div>${demoBadge()}</div><div class="compare-table"><div class="compare-head"><span></span><span>${t('fixed')}</span><span>${t('daxiPercent')}</span></div>${rows.map(([k,f,d])=>`<div class="compare-row"><strong>${t(k)}</strong><div><i class="bar fixedbar" style="width:${Math.abs(f)/max*100}%"></i><span>${f>=0?'+':''}${fmt(f)}</span></div><div><i class="bar daxibar" style="width:${Math.abs(d)/max*100}%"></i><span>${d>=0?'+':''}${fmt(d)}</span></div></div>`).join('')}</div><p class="fine">${state.lang==='ru'?'Сравнение показывает платёж парку при одинаковой выручке. Топливо, налоги и другие расходы не включены.':'Comparația arată plata către parc la același venit. Combustibilul, taxele și alte cheltuieli nu sunt incluse.'}</p></section>`;
  }
  function buyoutMarkup(){ return `<section class="result-card"><span class="kicker">BUYOUT</span><h2>${t('buyoutResult')}</h2><p>${t('buyoutExplain')}</p><div class="buy-progress"><span style="width:42%"></span></div><div class="buyout-cars">${C.buyoutCars.map(c=>`<article><img src="${c.image}" alt="${esc(c.model)}" loading="lazy" onerror="this.remove()"><h3>${c.model}</h3><span>${c.year} / ${t(classKey[c.class])}</span></article>`).join('')}</div><p class="fine">${state.lang==='ru'?'42% на шкале, пример. Наличие, взнос, срок и график выкупа подтвердит менеджер.':'42% pe bară este un exemplu. Disponibilitatea, avansul, termenul și graficul sunt confirmate de manager.'}</p></section>`; }
  function ownerMarkup(){ return `<section class="result-card owner-result"><div><span class="kicker">DAXI OWNER</span><h2>${state.answers.location==='abroad'?(state.lang==='ru'?'Всё видно из любой страны.':'Totul se vede din orice țară.'):(state.lang==='ru'?'Машина работает. Вы в курсе.':'Mașina lucrează. Dvs. sunteți la curent.')}</h2><p>${t('ownersText')}</p><strong>${state.lang==='ru'?'Заберём машину сами.':'Preluăm noi mașina.'}</strong></div><div class="phone small-phone">${appScreen('owner')}</div></section>`; }
  function businessMarkup(r){ const rows=[['Toyota Prius 50',18200,3100,1],['Ford Fusion',16900,2800,2],['Volkswagen ID.4',20100,3500,0]];return `<section class="result-card"><div class="card-head"><div><span class="kicker">FLEET REPORT</span><h2>${t('reportTitle')}</h2></div>${demoBadge()}</div><button class="pill pill-light" data-report>${t('businessReport')} →</button><div class="report-table" hidden><div><strong>${state.lang==='ru'?'Машина':'Mașină'}</strong><strong>${state.lang==='ru'?'Доход':'Venit'}</strong><strong>${state.lang==='ru'?'Расходы':'Cheltuieli'}</strong><strong>${state.lang==='ru'?'Простой':'Staționare'}</strong></div>${rows.map(x=>`<div><span>${x[0]}</span><span>${fmt(x[1])}</span><span>${fmt(x[2])}</span><span>${x[3]}</span></div>`).join('')}</div><p>${t('startOne')}</p></section>`; }
  function timelineMarkup(){
    const a=state.answers; let items=[];
    if(state.path==='owner') items=[['ownerStep1','ownerStep1d'],['ownerStep2','ownerStep2d'],['ownerStep3','ownerStep3d'],['ownerStep4','ownerStep4d'],['ownerStep5','ownerStep5d']];
    else if(state.path==='business') items=[[null,state.lang==='ru'?'Начинаем с одной машины и согласуем учёт.':'Începem cu o mașină și stabilim evidența.'],[null,state.lang==='ru'?'Оформляем документы и водителей.':'Pregătim actele și șoferii.'],[null,state.lang==='ru'?'Смотрим 30 дней и масштабируем.':'Urmărim 30 de zile și apoi scalăm.']];
    else { if(a.experience==='new')items.push(['cert','certText'],['med','medText']); if(a.experience==='other')items.push(['transfer','transferText']); if(state.path==='driver')items.push(['docs','docsText']); items.push(['registration','registrationText'],['firstShift','firstShiftText']); }
    return `<section class="result-card"><span class="kicker">${state.lang==='ru'?'ОТ ЗНАКОМСТВА ДО СТАРТА':'DE LA PRIMUL CONTACT LA START'}</span><h2>${t('timeline')}</h2><ol class="timeline">${items.map((x,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><div><h3>${x[0]?t(x[0]):(state.lang==='ru'?'Шаг '+(i+1):'Pas '+(i+1))}</h3><p>${x[0]?t(x[1]):x[1]}</p></div></li>`).join('')}</ol></section>`;
  }
  function checklistMarkup(){ const a=state.answers; let items=[]; if(state.path==='driver')items=state.lang==='ru'?['Водительское удостоверение','Паспорт или ID','Документы на автомобиль','Страховка','Телефон с приложением Daxi']:['Permis de conducere','Buletin sau pașaport','Actele mașinii','Asigurare','Telefon cu aplicația Daxi']; else if(state.path==='car')items=state.lang==='ru'?['Водительское удостоверение','Паспорт или ID','Документы для трудового оформления','Телефон с приложением Daxi']:['Permis de conducere','Buletin sau pașaport','Acte pentru angajare','Telefon cu aplicația Daxi']; else if(state.path==='owner')items=state.lang==='ru'?['Документы на автомобиль','Страховка','Документ владельца','Ключи и комплект автомобиля']:['Actele mașinii','Asigurare','Actul proprietarului','Cheile și dotarea mașinii']; else items=state.lang==='ru'?['Список автомобилей','Документы на машины','Данные водителей, если есть','Контакт ответственного лица']:['Lista mașinilor','Actele mașinilor','Datele șoferilor, dacă există','Contactul persoanei responsabile']; return `<section class="result-card"><span class="kicker">CHECKLIST</span><h2>${t('checklist')}</h2><ul class="check-list">${items.map(x=>`<li><b>✓</b>${x}</li>`).join('')}</ul></section>`; }
  function conversionMarkup(){ const msg=leadMessage(); const wa=`https://wa.me/${C.contact.whatsapp}?text=${encodeURIComponent(msg)}`; const tg=`https://t.me/share/url?url=${encodeURIComponent(location.origin)}&text=${encodeURIComponent(msg)}`; const vb=`viber://forward?text=${encodeURIComponent(msg)}`; return `<div class="conversion"><div class="app-dot">D</div><h2>${t('appModalTitle')}</h2><p>${t('appModalText')}</p><button class="pill pill-amber full" data-app>${t('registerApp')} →</button><span class="or">${t('discuss')}</span><div class="messengers"><a href="${wa}" target="_blank" data-msg="whatsapp">WhatsApp ↗</a><a href="${vb}" data-msg="viber">Viber ↗</a><a href="${tg}" target="_blank" data-msg="telegram">Telegram ↗</a></div><button class="copy-button" data-copy>${t('copy')}</button><div class="manager"><div class="avatar">${C.managers[0].initials}</div><div><strong>${t('manager')}</strong><span>${t('call15')}</span><a href="tel:${C.managers[0].phone}">${C.contact.phones[1]}</a></div></div></div>${['driver','car'].includes(state.path)?`<div class="referral-mini"><strong>${fmt(C.facts.referralBonus)} lei</strong><p>${state.lang==='ru'?'За друга со своей машиной после выполнения условий программы.':'Pentru un prieten cu mașina proprie după îndeplinirea condițiilor programului.'}</p></div>`:''}`; }
  function bindResult(r){
    $('[data-edit]')?.addEventListener('click',()=>transitionFlow(()=>{state.view='quiz';state.step=0;persist(false);renderAll();scrollTop();},-1));
    $('[data-switch-car]')?.addEventListener('click',()=>selectPath('car'));
    $('[data-report]')?.addEventListener('click',e=>{const tbl=$('.report-table');tbl.hidden=!tbl.hidden;e.currentTarget.textContent=tbl.hidden?t('businessReport')+' →':(state.lang==='ru'?'Скрыть пример':'Ascunde exemplul')});
    $('[data-copy]')?.addEventListener('click',async e=>{try{await navigator.clipboard.writeText(leadMessage());e.currentTarget.textContent=t('copied')}catch{}});
    $$('[data-msg]').forEach(a=>a.addEventListener('click',()=>track('messenger_click',{channel:a.dataset.msg,path:state.path})));
  }
  function animateResult(){ if(window.gsap && !reduced()){ gsap.utils.toArray('[data-count]').forEach(el=>{gsap.fromTo(el,{textContent:0},{textContent:Number(el.dataset.count),duration:.8,ease:'power3.out',snap:{textContent:1},onUpdate(){el.textContent=fmt(Number(el.textContent))}})}); gsap.from('.result-card,.conversion,.estimate',{y:22,opacity:0,duration:.6,stagger:.06,ease:'power3.out'});} else $$('[data-count]').forEach(el=>el.textContent=fmt(Number(el.dataset.count))); }

  function bindGlobal(){
    document.addEventListener('click', e => {
      const lang=e.target.closest('[data-lang]'); if(lang){state.lang=state.lang==='ru'?'ro':'ru';localStorage.setItem(LANG_KEY,state.lang);renderAll();return;}
      const path=e.target.closest('[data-path]'); if(path){selectPath(path.dataset.path);return;}
      const scroll=e.target.closest('[data-scroll]'); if(scroll){ if(state.view!=='home'){state.path=null;state.step=0;state.answers=defaults();state.view='choose';renderAll();scrollTop();} else scrollToId(scroll.dataset.scroll); return; }
      if(e.target.closest('[data-go-home]')){state.path=null;state.step=0;state.answers=defaults();state.view='choose';renderAll();scrollTop();return;}
      if(e.target.closest('[data-app]')){openApp();return;}
      if(e.target.closest('[data-menu]')) toggleMenu(true);
      if(e.target.closest('[data-menu-close]')) toggleMenu(false);
    });
    window.addEventListener('popstate',()=>{
      const p=PATHS.includes(location.pathname.split('/').filter(Boolean).pop())?location.pathname.split('/').filter(Boolean).pop():new URLSearchParams(location.search).get('path');
      if(PATHS.includes(p)){state.path=p;state.view='quiz';state.step=0;}else{state.path=null;state.view='choose';state.step=0;}
      renderAll();scrollTop();
    });
  }
  function selectPath(p){
    if(!PATHS.includes(p))return;
    transitionFlow(()=>{
      state.path=p;state.answers=defaults();state.step=0;state.view='quiz';state.returning=false;persist(false);
      track('path_selected',{path:p});
      const url=new URL(location.href);url.searchParams.set('path',p);url.pathname=basePath();history.pushState({},'',url);
      renderAll();scrollTop();
    },1);
  }
  function animateFlowIn(){
    const el=$('#flow main'); if(!el)return;
    if(window.gsap&&!reduced()) gsap.fromTo(el,{opacity:0,y:18,scale:.994},{opacity:1,y:0,scale:1,duration:.48,ease:'power3.out',clearProps:'transform'});
  }
  function transitionFlow(next,direction=1){
    const el=$('#flow main');
    if(window.gsap&&el&&!reduced()){
      gsap.to(el,{opacity:0,y:-10*direction,scale:.996,duration:.2,ease:'power2.in',onComplete:next});
    } else next();
  }

  function basePath(){ const m=location.pathname.match(/^(.*?)(?:\/(?:driver|car|owner|business)\/?)?$/);return (m&&m[1])||'/'; }
  function scrollToId(id){ document.getElementById(id)?.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'}); }
  function scrollTop(){ window.scrollTo({top:0,behavior:'auto'}); }

  function showIntro(){
    const el=$('#intro'); let closing=false;
    el.hidden=false;
    el.innerHTML=`<div class="intro-dark"><div class="intro-controls"><button data-intro-lang>${state.lang.toUpperCase()} / ${t('other')}</button><button data-intro-skip>${t('skip')}</button></div><div class="intro-route">${routeSvg('intro')}</div><div class="intro-copy"><div class="intro-logo">${logoSvg(true)}</div><h1><span>${t('introA')}</span><span>${t('introB')}</span></h1><ul><li>${t('intro1')}</li><li>${t('intro2')}</li><li>${t('intro3')}</li></ul><div class="intro-handoff"><i></i><span>${state.lang==='ru'?'Подбираем твой путь':'Pregătim traseul tău'}</span></div></div></div>`;
    const finish=(reason)=>{
      if(closing)return; closing=true; clearTimeout(introTimer);
      localStorage.setItem(INTRO_KEY,'1'); track('intro_continue',{reason});
      const done=()=>{el.hidden=true;document.body.style.overflow='';requestAnimationFrame(()=>animateFlowIn());};
      if(window.gsap&&!reduced()) gsap.to(el,{opacity:0,scale:1.008,duration:.5,ease:'power2.inOut',onComplete:done}); else done();
    };
    document.body.style.overflow='hidden';
    $('[data-intro-skip]',el).onclick=()=>finish('skip');
    $('[data-intro-lang]',el).onclick=()=>{clearTimeout(introTimer);state.lang=state.lang==='ru'?'ro':'ru';localStorage.setItem(LANG_KEY,state.lang);renderAll();el.hidden=true;showIntro();};
    if(window.gsap&&!reduced()) introTimeline(el);
    introTimer=setTimeout(()=>finish('auto'),4300);
  }
  function introTimeline(el){
    const tl=gsap.timeline();
    tl.from('.intro-logo',{opacity:0,scale:.76,rotationY:-55,duration:.62,ease:'back.out(1.35)'})
      .from('.intro-route .route-line',{strokeDasharray:1,strokeDashoffset:1,duration:1.1,ease:'power2.inOut'},.05)
      .to('.intro-route .car-dot',{motionPath:{path:'.intro-route .route-line',align:'.intro-route .route-line',alignOrigin:[.5,.5]},duration:1.35,ease:'power1.inOut'},.1)
      .from('.intro-copy h1 span',{y:'110%',duration:.52,stagger:.16,ease:'power3.out'},.42)
      .from('.intro-copy li',{opacity:0,y:10,duration:.3,stagger:.12,ease:'power2.out'},1.05)
      .from('.intro-handoff',{opacity:0,y:8,duration:.35,ease:'power2.out'},1.7);
  }

  function openApp(){ $('#app-modal').hidden=false;document.body.style.overflow='hidden';track('register_app_click',{path:state.path||'general',stage:'modal'}); }
  function renderAppModal(){ const el=$('#app-modal');el.innerHTML=`<div class="modal-backdrop" data-modal-close></div><div class="app-modal" role="dialog" aria-modal="true" aria-labelledby="app-title"><button class="modal-x" data-modal-close>×</button>${logoSvg(false)}<h2 id="app-title">${t('appModalTitle')}</h2><p>${t('appModalText')}</p><div class="store-buttons"><a href="${C.app.googlePlay}" target="_blank" data-store="google"><small>${state.lang==='ru'?'Скачать в':'Descarcă din'}</small><strong>${t('google')}</strong><b>↗</b></a><a href="${C.app.appStore}" target="_blank" data-store="apple"><small>${state.lang==='ru'?'Скачать в':'Descarcă din'}</small><strong>${t('apple')}</strong><b>↗</b></a></div></div>`; el.onclick=e=>{if(e.target.closest('[data-modal-close]')){el.hidden=true;document.body.style.overflow='';}const s=e.target.closest('[data-store]');if(s)track('register_app_click',{path:state.path||'general',store:s.dataset.store});}; }
  function toggleMenu(open){ const m=$('#menu');m.hidden=!open;if(open){m.innerHTML=`<div class="menu-panel"><button class="modal-x" data-menu-close>×</button>${logoSvg(false)}<button data-scroll="how">${t('navHow')} ↗</button><button data-scroll="paths">${t('calculate')} ↗</button><button data-scroll="app">${t('navApp')} ↗</button><button data-scroll="faq">${t('navFaq')} ↗</button></div>`;} }

  function renderFooter(){ const footer=$('#footer'); const focused=state.view!=='home'; footer.hidden=focused; if(focused){footer.innerHTML='';return;} footer.innerHTML=`<div class="section footer-grid"><div class="footer-brand">${logoSvg(true)}<p>${t('footerLine')}</p></div><div><span class="kicker">${t('addressLabel')}</span><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(C.contact.address)}" target="_blank">${C.contact.address} ↗</a></div><div><span class="kicker">${t('phonesLabel')}</span>${C.contact.phones.map((p,i)=>`<a href="tel:${C.contact.phoneLinks[i]}">${p}</a>`).join('')}</div><div><span class="kicker">${t('socialLabel')}</span><a href="${C.contact.telegram}" target="_blank">Telegram ↗</a><a href="${C.contact.tiktok}" target="_blank">TikTok ↗</a></div></div><div class="section footer-bottom"><span>DAXI / CHIȘINĂU</span><button data-lang>${state.lang.toUpperCase()} / ${t('other')}</button></div>`; }

  function howScene(n,title,text,type){ return `<article class="how-scene" data-scene="${n}"><div class="scene-copy"><span class="scene-num">0${n}</span><h3>${title}</h3><p>${text}</p>${n===4?`<button class="pill pill-black" data-scroll="paths">${t('calculate')} →</button>`:''}</div><div class="scene-art">${sceneArt(type)}</div></article>`; }
  function sceneArt(type){ if(type==='request')return `<div class="request-card"><span>◉</span><strong>${state.lang==='ru'?'Куда едем?':'Unde mergem?'}</strong><i></i><button>${state.lang==='ru'?'Найти машину':'Găsește mașina'} <b>→</b></button></div><div class="scene-platforms"><b>Yandex</b><b>Bolt</b><b>Letz</b></div>`; if(type==='hub')return `<div class="hub"><div class="hub-top"><span>Yandex</span><span>Bolt</span><span>Letz</span></div>${routeSvg('hub')}<div class="hub-node">DAXI</div><div class="driver-node">🚕 <span>${state.lang==='ru'?'Твой заказ':'Comanda ta'}</span></div></div>`; if(type==='services')return `<div class="service-grid">${[['▣',state.lang==='ru'?'Лицензия':'Licență'],['▤',state.lang==='ru'?'Касса':'Casă fiscală'],['✓',state.lang==='ru'?'Документы':'Acte'],['◆',state.lang==='ru'?'Страховка':'Asigurare'],['⌁',state.lang==='ru'?'Сервис':'Service'],['◎','24/7']].map(x=>`<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>`; return `<div class="finance-art"><div class="phone small-phone">${appScreen('finance')}</div><div class="balance-card"><span>${state.lang==='ru'?'Баланс':'Sold'}</span><strong>12 480<small> lei</small></strong>${demoBadge()}</div></div>`; }
  function pathCard(p,n){ const descKey={driver:'pathDriverD',car:'pathCarD',owner:'pathOwnerD',business:'pathBusinessD'}[p];return `<button class="path-card ${p==='car'?'invert':''}" data-path="${p}"><div><span>${n}</span><b>↗</b></div><h3>${t(pathKey[p])}</h3><p>${t(descKey)}</p></button>`; }
  function appShowcase(type,title,n){ return `<article class="app-phone-card" data-reveal><span>${n}</span><div class="phone">${appScreen(type)}</div><h3>${title}</h3></article>`; }
  function appScreen(type){
    if(type==='finance'||type==='bonus') { const src=type==='finance'?C.appScreens[0]:C.appScreens[1];return `<div class="phone-notch"></div><img src="${src}" alt="Daxi app" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><div class="fake-screen" style="display:none">${fakeScreen(type)}</div>`; }
    return `<div class="phone-notch"></div><div class="fake-screen">${fakeScreen(type)}</div>`;
  }
  function fakeScreen(type){ if(type==='owner') return `<span class="app-kicker">DAXI / OWNER</span><strong>${state.lang==='ru'?'Баланс владельца':'Sold proprietar'}</strong><b>18 420 lei</b><div class="mini-chart"><i style="height:45%"></i><i style="height:68%"></i><i style="height:54%"></i><i style="height:82%"></i><i style="height:76%"></i></div><ul><li>${state.lang==='ru'?'Доход':'Venit'}<b>+ 1 240</b></li><li>${state.lang==='ru'?'Сервис':'Service'}<b>- 320</b></li><li>${state.lang==='ru'?'Выплата':'Plată'}<b>- 3 000</b></li></ul>`; if(type==='pulse') return `<span class="app-kicker">DAXI / PULSE</span><strong>${state.lang==='ru'?'Сегодня':'Astăzi'}</strong><b>18 ${state.lang==='ru'?'заказов':'comenzi'}</b><div class="pulse-ring">72%</div><ul><li>Yandex<b>9</b></li><li>Bolt<b>6</b></li><li>Letz<b>3</b></li></ul>`; return `<span class="app-kicker">DAXI</span><strong>${state.lang==='ru'?'Финансы':'Finanțe'}</strong><b>12 480 lei</b><div class="mini-chart"><i style="height:38%"></i><i style="height:52%"></i><i style="height:71%"></i><i style="height:64%"></i><i style="height:88%"></i></div>`; }
  function sectionHead(n,title,sub){ return `<div class="section-head"><div><span class="kicker">${n}</span><h2 class="display" data-reveal>${title}</h2></div><p>${sub}</p></div>`; }
  function demoBadge(){ return C.isDemo?`<span class="demo-badge"><i></i>${t('demo')}</span>`:''; }
  function carSvg(electric=false){ return `<svg viewBox="0 0 130 54" aria-hidden="true"><path d="M14 37h7l7-15c2-4 6-6 11-6h47c5 0 9 2 12 6l10 15h7c5 0 9 4 9 9v2H5v-2c0-5 4-9 9-9Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="32" cy="47" r="6" fill="currentColor"/><circle cx="99" cy="47" r="6" fill="currentColor"/>${electric?'<path d="m65 22-6 11h7l-5 10 15-15h-8l5-6Z" fill="#FDA621"/>':''}</svg>`; }
  function routeSvg(cls=''){ return `<svg class="route-svg ${cls}" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="map-lines" fill="none" stroke="currentColor" stroke-width="1" opacity=".16"><path d="M-20 90 180 30l110 100 170-70 100 110 240-80"/><path d="M50 520 180 330l160 20 100-110 180 30 200-160"/><path d="M80 0 100 180 280 220l70 200 240 70"/><path d="M650 0 610 140 500 180 520 370 760 420"/></g><path class="route-line" pathLength="1" d="M70 405 C165 325 188 212 298 246 C405 279 407 122 530 161 C632 193 653 283 748 93" fill="none" stroke="#FDA621" stroke-width="7" stroke-linecap="round"/><circle class="car-dot" cx="70" cy="405" r="10" fill="#FDA621"/><circle cx="748" cy="93" r="10" fill="#FDA621"/></svg>`; }
  function logoSvg(dark=false){ return `<svg class="logo-svg" width="111" height="36" viewBox="0 0 74 24" fill="none" aria-label="Daxi" role="img"><path d="M20.39 5.96c0-2.47-1.35-4.58-3.52-5.5-2.17-.92-4.62-.43-6.4 1.29L1.88 10.05C.19 11.69-.43 14.17.31 16.38c.68 2.02 2.38 3.43 4.45 3.68l2.65.32c.63.08 1.23.33 1.73.74l2.07 1.68c.4.32.83.58 1.29.78.66.28 1.36.42 2.06.42.8 0 1.62-.19 2.39-.56 2.1-1 3.45-3.17 3.45-5.53L20.39 5.96Z" fill="${dark?'#fff':'#2B2B31'}"/><path d="M18.58 17.91 18.57 5.96c0-1.73-.92-3.2-2.41-3.83-1.49-.63-3.19-.28-4.43.92l-8.58 8.3c-1.2 1.16-1.63 2.9-1.12 4.45.46 1.37 1.56 2.29 2.95 2.46l2.64.32c.98.12 1.9.51 2.66 1.13l2.07 1.68c.27.22.56.39.86.52.92.39 1.98.36 2.96-.11 1.47-.7 2.41-2.23 2.41-3.89Z" fill="#FDA621"/><text x="29" y="19" font-family="Arial, sans-serif" font-weight="700" font-size="17" fill="${dark?'#fff':'#2B2B31'}">Daxi</text></svg>`; }

  function answerSummary(){ const a=state.answers; const out=[t(pathKey[state.path])]; if(a.experience)out.push(t({other:'expOther',past:'expPast',new:'expNew'}[a.experience])); if(a.brand&&a.model)out.push(`${a.brand} ${a.model} ${a.year||''}`.trim()); if(a.class)out.push(t(classKey[a.class])); if(a.hours)out.push(`${a.hours} ${state.lang==='ru'?'ч/день':'ore/zi'}, ${a.days} ${state.lang==='ru'?'дн/нед':'zile/săpt'}`); if(a.location)out.push(t(a.location==='abroad'?'locAbroad':'locMD')); if(a.fleet)out.push(`${a.fleet} ${state.lang==='ru'?'машин':'mașini'}`); return out; }
  function leadMessage(){ return `${state.lang==='ru'?'Здравствуйте. Хочу узнать условия Daxi.':'Bună ziua. Vreau să aflu condițiile Daxi.'}\n\n${answerSummary().join('\n')}\n\n${location.href}`; }
  function sendCRM(event){ const payload={event,path:state.path,lang:state.lang,answers:state.answers,result:state.path?calculate():null,utm:state.utm,page:location.href,createdAt:new Date().toISOString()}; window.__lastDaxiLead=payload;if(!C.integrations.crmWebhook)return;fetch(C.integrations.crmWebhook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});if(event==='result_viewed')track('lead_submitted',{path:state.path}); }
  function track(name,detail={}){ window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:name,...detail});window.dispatchEvent(new CustomEvent('daxi:'+name,{detail}));if(window.fbq)window.fbq('trackCustom',name,detail);if(window.ttq?.track)window.ttq.track(name,detail); }
  function installPixels(){ if(C.integrations.metaPixelId && !window.fbq){ /* configurable placeholder, intentionally not injected without ID */ } if(C.integrations.tiktokPixelId && !window.ttq){ /* configurable placeholder */ } }

  function initMotion(){
    if(reduced()) return;
    if(window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if(window.gsap && window.MotionPathPlugin) gsap.registerPlugin(MotionPathPlugin);
    if(window.Lenis){ lenis=new Lenis({duration:1.05,smoothWheel:true});const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};requestAnimationFrame(raf); }
    refreshMotion();
  }
  function refreshMotion(){ if(!window.gsap||reduced())return; if(window.ScrollTrigger)gsap.registerPlugin(ScrollTrigger); if(window.ScrollTrigger)ScrollTrigger.getAll().forEach(x=>x.kill()); gsap.utils.toArray('[data-reveal]').forEach(el=>gsap.fromTo(el,{y:34,opacity:0},{y:0,opacity:1,duration:.7,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}})); gsap.utils.toArray('.app-phone-card .phone').forEach((el,i)=>gsap.fromTo(el,{y:70,rotate:i%2?-2:2},{y:0,rotate:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}})); }
  function reduced(){ return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function updateMeta(){ document.documentElement.lang=state.lang;document.title=state.lang==='ru'?'Daxi | Ты едешь. Остальное на нас.':'Daxi | Tu conduci. De restul ne ocupăm noi.'; const d=$('meta[name="description"]'); if(d)d.content=state.lang==='ru'?'Лицензированный таксопарк в Кишинёве. Своя машина, машина Daxi с выкупом или управление автопарком. Без фиксированной платы.':'Parc de taxi autorizat în Chișinău. Mașina ta, o mașină Daxi cu cumpărare sau administrarea flotei. Fără taxă fixă.'; }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
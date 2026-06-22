/* ============================================================
 * BreadVenture B2B — Календарь и регулярные поставки
 * Календарь нерабочих дней, регулярные поставки, персональная настройка кабинета партнёра.
 * Файл #4 из 11. Весь код в общем (глобальном) scope —
 * порядок подключения в index.html важен: 01 первым, далее по номерам.
 * ============================================================ */

/* ---- календарь нерабочих дней ---- */
var calYear, calMonth;
var HOL_TYPES={weekend:'Выходной',holiday:'Праздничные выходные',maintenance:'Технические работы'};
var HOL_COLORS={weekend:'#47A2DA',holiday:'#c0577e',maintenance:'#c98a2b'};
function calYmd(y,m,d){return y+'-'+(''+(m+1)).padStart(2,'0')+'-'+(''+d).padStart(2,'0');}
function holDate(h){return (typeof h==='string')?h:(h&&h.date)||'';}
function holType(h){return (typeof h==='string')?'holiday':((h&&h.type)||'holiday');}
function holFind(ymd){for(var i=0;i<holidays.length;i++)if(holDate(holidays[i])===ymd)return i;return -1;}
function markCalDirty(){var st=document.getElementById('calStatus');if(st){st.textContent='\u25cf есть несохранённые изменения';st.style.color='#c98a2b';}}
function renderCalendar(){
  var wrap=document.getElementById('calWrap');if(!wrap)return;
  var now=new Date();if(calYear==null){calYear=now.getFullYear();calMonth=now.getMonth();}
  var MN=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  var DOW=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  var first=new Date(calYear,calMonth,1);var startDow=(first.getDay()+6)%7;
  var days=new Date(calYear,calMonth+1,0).getDate();
  var today=new Date();today.setHours(0,0,0,0);
  var h='<div class="cal-head">'+
    '<div style="display:flex;gap:5px;"><button class="btn btn-line btn-sm" id="calPY" title="Год назад">\u00ab</button><button class="btn btn-line btn-sm" id="calPrev" title="Месяц назад">\u2190</button></div>'+
    '<b>'+MN[calMonth]+' '+calYear+'</b>'+
    '<div style="display:flex;gap:5px;"><button class="btn btn-line btn-sm" id="calNext" title="Месяц вперёд">\u2192</button><button class="btn btn-line btn-sm" id="calNY" title="Год вперёд">\u00bb</button></div></div>';
  h+='<div class="cal-grid">';
  DOW.forEach(function(d){h+='<div class="cal-dow">'+d+'</div>';});
  for(var i=0;i<startDow;i++)h+='<div class="cal-day empty"></div>';
  for(var d=1;d<=days;d++){
    var dt=new Date(calYear,calMonth,d);dt.setHours(0,0,0,0);
    var ymd=calYmd(calYear,calMonth,d);
    var cls='cal-day';var sun=dt.getDay()===0,past=dt<today,hi=holFind(ymd);
    if(sun)cls+=' sun';else if(past)cls+=' past';
    if(dt.getTime()===today.getTime())cls+=' today';
    var clickable=!sun&&!past,style='';
    if(hi>=0){var tp=holType(holidays[hi]),col=HOL_COLORS[tp]||'#47A2DA';style=' style="background:'+col+';color:#fff;border-color:'+col+';font-weight:700;"';}
    h+='<div class="'+cls+'"'+style+(clickable?' data-ymd="'+ymd+'"':'')+'>'+d+'</div>';
  }
  h+='</div>';
  wrap.innerHTML=h;
  document.getElementById('calPrev').addEventListener('click',function(){calMonth--;if(calMonth<0){calMonth=11;calYear--;}renderCalendar();});
  document.getElementById('calNext').addEventListener('click',function(){calMonth++;if(calMonth>11){calMonth=0;calYear++;}renderCalendar();});
  document.getElementById('calPY').addEventListener('click',function(){calYear--;renderCalendar();});
  document.getElementById('calNY').addEventListener('click',function(){calYear++;renderCalendar();});
  wrap.querySelectorAll('[data-ymd]').forEach(function(c){c.addEventListener('click',function(){
    var y=this.dataset.ymd,k=holFind(y);
    if(k>=0)holidays.splice(k,1);
    else{var tp=document.getElementById('calType').value;holidays.push({date:y,type:tp});}
    holidays.sort(function(a,b){return holDate(a)<holDate(b)?-1:1;});
    markCalDirty();renderCalendar();renderCalList();
  });});
  renderCalList();
}
function renderCalList(){
  var w=document.getElementById('calList');if(!w)return;
  var today=new Date();today.setHours(0,0,0,0);
  var future=holidays.filter(function(hh){return new Date(holDate(hh)+'T00:00:00')>=today;})
    .sort(function(a,b){return holDate(a)<holDate(b)?-1:1;});
  if(!future.length){w.innerHTML='<p class="hint">Нерабочие дни не отмечены (кроме воскресений).</p>';return;}
  var h='<div class="cat-title" style="margin-top:0;">Отмеченные нерабочие дни</div>';
  future.forEach(function(hh){var y=holDate(hh),tp=holType(hh),dt=new Date(y+'T00:00:00');
    var s=(''+dt.getDate()).padStart(2,'0')+'.'+(''+(dt.getMonth()+1)).padStart(2,'0')+'.'+dt.getFullYear();
    h+='<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);">'+
       '<span style="width:11px;height:11px;border-radius:50%;background:'+(HOL_COLORS[tp]||'#47A2DA')+';flex:none;"></span>'+
       '<span style="flex:1;">'+s+' <span class="hint">\u00b7 '+(HOL_TYPES[tp]||tp)+'</span></span>'+
       '<button class="btn btn-line btn-sm cal-rm" data-y="'+y+'">Убрать</button></div>';});
  w.innerHTML=h;
  w.querySelectorAll('.cal-rm').forEach(function(b){b.addEventListener('click',function(){
    var k=holFind(this.dataset.y);if(k>=0){holidays.splice(k,1);markCalDirty();renderCalendar();}});});
}
function initCalSave(){var b=document.getElementById('calSave');if(b&&!b._b){b._b=1;b.addEventListener('click',function(){
  saveHolidays();var st=document.getElementById('calStatus');if(st){st.textContent='\u2713 сохранено, партнёры увидят баннер';st.style.color='#2c7a4b';}
  toast('Календарь сохранён');});}}
function initCalProdSummary(){
  var pd=document.getElementById('prodDateCal');if(!pd)return;
  if(!pd.value){var t=new Date();t.setDate(t.getDate()+1);pd.value=t.toISOString().slice(0,10);} // по умолчанию завтра
  if(!pd._b){pd._b=1;pd.addEventListener('change',function(){renderProdSummary(pd.value,'prodSummaryCal');});}
  var go=function(){renderProdSummary(pd.value,'prodSummaryCal');};
  if(!adminOrders.length)loadAdminOrders().then(go).catch(go);else go();
}
/* ---- админ: регулярные поставки ---- */
var SUBS_ADMIN=[];
var SUB_DOW=['','Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
function loadAdminSubs(){
  var w=document.getElementById('subsView');if(w)w.innerHTML='<p class="hint">Загрузка…</p>';
  fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({master:MASTER,subsAll:true})})
    .then(function(r){return r.json();}).then(function(j){SUBS_ADMIN=(j&&j.ok&&Array.isArray(j.subscriptions))?j.subscriptions:[];renderAdminSubs();})
    .catch(function(){var w=document.getElementById('subsView');if(w)w.innerHTML='<p class="hint">Не удалось загрузить. Проверьте облако.</p>';});
}
function renderAdminSubs(){
  var w=document.getElementById('subsView');if(!w)return;
  if(!SUBS_ADMIN.length){w.innerHTML='<p class="hint">Регулярных поставок пока нет.</p>';return;}
  var byP={};SUBS_ADMIN.forEach(function(s){var k=s.partner||s.partner_id||'—';(byP[k]=byP[k]||[]).push(s);});
  var h='';
  Object.keys(byP).forEach(function(pn){
    h+='<div class="cat-title">'+esc(pn)+'</div>';
    byP[pn].forEach(function(s){
      var days=(s.days||[]).slice().sort(function(a,b){return a-b;}).map(function(n){return SUB_DOW[n]||n;}).join(', ');
      var conf=s.confirmed||{},ordered=0,skipped=0;Object.keys(conf).forEach(function(k){if(conf[k]==='ordered')ordered++;else if(conf[k]==='skipped')skipped++;});
      h+='<div style="border:1px solid var(--line);border-radius:12px;padding:13px 15px;margin-bottom:10px;'+(s.active?'':'opacity:.6;')+'">'+
         '<div style="display:flex;align-items:center;gap:8px;"><b>'+(s.active?'🔁':'⏸')+' '+esc(days||'—')+'</b>'+(s.time?' <span class="hint">· '+esc(s.time)+'</span>':'')+
         '<span class="hint" style="margin-left:auto;">'+(s.active?'активна':'на паузе')+'</span></div>';
      (s.items||[]).forEach(function(it){h+='<div style="font-size:13px;color:#55544c;padding:2px 0;">• '+esc(it.name)+(it.weight?' ('+esc(it.weight)+')':'')+' — '+esc(it.qty)+' шт</div>';});
      if(s.address)h+='<div class="hint" style="margin-top:5px;">Адрес: '+esc(s.address)+'</div>';
      if(s.contact||s.phone)h+='<div class="hint">Контакт: '+esc(s.contact||'—')+(s.phone?' · '+esc(s.phone):'')+'</div>';
      h+='<div class="hint" style="margin-top:5px;">Заказано поставок: '+ordered+' · пропущено: '+skipped+'</div>';
      h+='</div>';
    });
  });
  w.innerHTML=h;
}
/* ---- персональная настройка кабинета партнёра ---- */
var pcfgPid='', pcfgCatSeq=[], pcfgGroups={}, pcfgHidden=[];
function partnerVisibleItems(pid){return catalog.filter(function(it){
  if(it.b2bHide)return false;
  if(Array.isArray(it.b2bOnly)&&it.b2bOnly.length)return it.b2bOnly.indexOf(pid)>=0;
  return true;});}
function openPcfg(pid,name){
  pcfgPid=pid;
  document.getElementById('pcfgTitle').textContent='Кабинет: '+name;
  var base=partnerVisibleItems(pid);
  var prefs=partnerPrefs[pid]||{};
  var ord=Array.isArray(prefs.order)?prefs.order:[];
  var idx={};ord.forEach(function(id,i){idx[id]=i;});
  base.sort(function(a,b){var ia=(idx[a.id]!=null?idx[a.id]:9999),ib=(idx[b.id]!=null?idx[b.id]:9999);return ia-ib;});
  pcfgCatSeq=[];pcfgGroups={};
  base.forEach(function(it){var c=it.cat||'Без категории';if(!pcfgGroups[c]){pcfgGroups[c]=[];pcfgCatSeq.push(c);}pcfgGroups[c].push(it.id);});
  var hid=Array.isArray(prefs.hidden)?prefs.hidden:[];
  pcfgHidden=hid.filter(function(id){return base.some(function(it){return it.id===id;});});
  renderPcfg();document.getElementById('pcfgModal').style.display='flex';
}
function savePcfg(){
  var order=[];pcfgCatSeq.forEach(function(c){(pcfgGroups[c]||[]).forEach(function(id){order.push(id);});});
  partnerPrefs[pcfgPid]={order:order,hidden:pcfgHidden.slice()};savePartnerPrefs();
}
function renderPcfg(){
  var w=document.getElementById('pcfgList');if(!w)return;
  if(!pcfgCatSeq.length){w.innerHTML='<div class="empty">Этому партнёру пока нечего показывать (все позиции скрыты глобально).</div>';return;}
  var h='';
  pcfgCatSeq.forEach(function(c,ci){
    h+='<div class="vis-cat" style="display:flex;align-items:center;gap:8px;">'+
       '<span style="flex:1;">'+esc(c)+'</span>'+
       '<button class="btn btn-line btn-sm pc-cup" data-c="'+esc(c)+'" '+(ci===0?'disabled':'')+' style="padding:2px 8px;">↑</button>'+
       '<button class="btn btn-line btn-sm pc-cdn" data-c="'+esc(c)+'" '+(ci===pcfgCatSeq.length-1?'disabled':'')+' style="padding:2px 8px;">↓</button></div>';
    (pcfgGroups[c]||[]).forEach(function(id,ii){
      var it=itemById(id);if(!it)return;
      var vis=pcfgHidden.indexOf(id)<0;
      h+='<div class="vis-row">'+
         '<button class="btn btn-line btn-sm pc-iup" data-c="'+esc(c)+'" data-i="'+ii+'" '+(ii===0?'disabled':'')+' style="padding:2px 7px;">↑</button>'+
         '<button class="btn btn-line btn-sm pc-idn" data-c="'+esc(c)+'" data-i="'+ii+'" '+(ii===pcfgGroups[c].length-1?'disabled':'')+' style="padding:2px 7px;">↓</button>'+
         '<div class="vn" style="flex:1;">'+esc(it.name)+(it.weight?'<span class="vtag">'+esc(it.weight)+'</span>':'')+
         '<div class="vsub">'+(vis?'видна':'скрыта для этого партнёра')+'</div></div>'+
         '<div class="tgl'+(vis?' on':'')+'" data-id="'+esc(id)+'"></div></div>';
    });
  });
  w.innerHTML=h;
  w.querySelectorAll('.pc-cup').forEach(function(b){b.addEventListener('click',function(){var c=this.dataset.c,i=pcfgCatSeq.indexOf(c);if(i>0){pcfgCatSeq.splice(i,1);pcfgCatSeq.splice(i-1,0,c);savePcfg();renderPcfg();}});});
  w.querySelectorAll('.pc-cdn').forEach(function(b){b.addEventListener('click',function(){var c=this.dataset.c,i=pcfgCatSeq.indexOf(c);if(i<pcfgCatSeq.length-1){pcfgCatSeq.splice(i,1);pcfgCatSeq.splice(i+1,0,c);savePcfg();renderPcfg();}});});
  w.querySelectorAll('.pc-iup').forEach(function(b){b.addEventListener('click',function(){var c=this.dataset.c,i=+this.dataset.i,g=pcfgGroups[c];if(i>0){var t=g[i];g[i]=g[i-1];g[i-1]=t;savePcfg();renderPcfg();}});});
  w.querySelectorAll('.pc-idn').forEach(function(b){b.addEventListener('click',function(){var c=this.dataset.c,i=+this.dataset.i,g=pcfgGroups[c];if(i<g.length-1){var t=g[i];g[i]=g[i+1];g[i+1]=t;savePcfg();renderPcfg();}});});
  w.querySelectorAll('.tgl').forEach(function(t){t.addEventListener('click',function(){var id=this.dataset.id,k=pcfgHidden.indexOf(id);if(k<0)pcfgHidden.push(id);else pcfgHidden.splice(k,1);savePcfg();renderPcfg();});});
}
function closePcfg(){document.getElementById('pcfgModal').style.display='none';}
document.getElementById('pcfgClose').addEventListener('click',closePcfg);
document.getElementById('pcfgModal').addEventListener('click',function(e){if(e.target===this)closePcfg();});
document.getElementById('pcfgReset').addEventListener('click',function(){
  if(!confirm('Сбросить персональные настройки кабинета для этого партнёра? Он снова увидит позиции в общем порядке.'))return;
  delete partnerPrefs[pcfgPid];savePartnerPrefs();
  var nm=document.getElementById('pcfgTitle').textContent.replace('Кабинет: ','');openPcfg(pcfgPid,nm);
});
function closeVisModal(){document.getElementById('visModal').style.display='none';}
document.getElementById('visBulk').addEventListener('click',openVisModal);
document.getElementById('visClose').addEventListener('click',closeVisModal);
(function(){var dm=document.getElementById('docGenModal'),dc=document.getElementById('docGenClose');
  if(dc)dc.addEventListener('click',function(){dm.style.display='none';});
  if(dm)dm.addEventListener('click',function(e){if(e.target===dm)dm.style.display='none';});
})();
document.getElementById('visModal').addEventListener('click',function(e){if(e.target===this)closeVisModal();});
document.getElementById('addItem').addEventListener('click',function(){
  var it={id:uid(),cat:'Новая категория',name:'Новая позиция',weight:'',retail:0,pdv:10,desc:'',sostav:'',descSr:'',sostavSr:'',photo:'',
    tiers:[{min:1,disc:0},{min:5,disc:15},{min:10,disc:20},{min:15,disc:25}],_open:true};
  catalog.push(it);saveCat();renderCatalog();
  document.getElementById('catalogView').lastChild.scrollIntoView({behavior:'smooth',block:'center'});});
document.getElementById('addCat').addEventListener('click',function(){
  var nn=prompt('Название нового раздела:','');if(nn==null)return;nn=nn.trim();if(!nn)return;
  var it={id:uid(),cat:nn,name:'Новая позиция',weight:'',retail:0,pdv:10,desc:'',sostav:'',descSr:'',sostavSr:'',photo:'',
    tiers:[{min:1,disc:0},{min:5,disc:15},{min:10,disc:20},{min:15,disc:25}],_open:true};
  catalog.push(it);saveCat();renderCatalog();toast('Раздел создан — заполните позицию');
  document.getElementById('catalogView').lastChild.scrollIntoView({behavior:'smooth',block:'center'});});
document.getElementById('saveVerPrice').addEventListener('click',function(){saveVersion('Прайс');toast('Версия сохранена в Архив');});
document.getElementById('pricePdf').addEventListener('click',function(){
  var kp={id:uid(),ts:kpDateMs('priceDate'),when:nowStr(),type:'primary',lang:kpLang,partner:'',
    pickup:false,incTerms:document.getElementById('incTerms').checked,
    items:catalogByCats().map(function(it){return {name:it.name,weight:it.weight,desc:locDesc(it,kpLang),sostav:locSostav(it,kpLang),
      retail:it.retail,pdv:itemPdv(it),uom:itemUnit(it),tiers:JSON.parse(JSON.stringify(it.tiers||[]))};}),
    totals:null,termsSnap:document.getElementById('incTerms').checked?snapTerms(kpLang):[]};
  document.querySelector('.tab[data-tab="offer"]').click();
  showKP(kp);
  setTimeout(function(){genPDF('BreadVenture-price.pdf');},300);
});
document.getElementById('exportBtn').addEventListener('click',function(){
  var blob=new Blob([JSON.stringify({catalog:catalog,terms:terms,priceHistory:priceHistory,kpArchive:kpArchive,foot:footData,partners:partners,catNamesSr:catNamesSr},null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='breadventure-b2b-data.json';a.click();
  setTimeout(function(){URL.revokeObjectURL(url);},1000);});
document.getElementById('importBtn').addEventListener('click',function(){document.getElementById('importFile').click();});
document.getElementById('importFile').addEventListener('change',function(e){
  var f=e.target.files[0];if(!f)return;var rd=new FileReader();
  rd.onload=function(){try{var d=JSON.parse(rd.result);
    if(Array.isArray(d)){catalog=d;}else{
      if(d.catalog)catalog=d.catalog;
      if(d.terms&&d.terms[0]&&d.terms[0].titleSr)terms=d.terms;
      if(Array.isArray(d.priceHistory))priceHistory=d.priceHistory;
      if(Array.isArray(d.kpArchive))kpArchive=d.kpArchive;
      if(d.foot){for(var fk in DEFAULT_FOOT)if(d.foot[fk]!=null)footData[fk]=d.foot[fk];}
      if(Array.isArray(d.partners))partners=d.partners;
      if(d.catNamesSr&&typeof d.catNamesSr==='object')catNamesSr=d.catNamesSr;}
    catalog.forEach(function(it){if(!it.id)it.id=uid();if(!it.tiers)it.tiers=[];if(it.desc==null)it.desc='';if(it.sostav==null)it.sostav='';if(it.descSr==null)it.descSr='';if(it.sostavSr==null)it.sostavSr='';if(it.photo==null)it.photo='';if(it.pdv==null)it.pdv=10;if(it.uom==null)it.uom='шт';});
    terms.forEach(function(tm){if(!tm.id)tm.id=uid();});
    saveCat();saveTerms();savePHist();saveKPArch();saveFoot();savePartners();saveCatSr();
    renderCatalog();renderTerms();renderVersions();renderKPArchive();renderFoot();renderPartners();refreshOfferRefs();toast('Данные импортированы');
  }catch(err){toast('Не удалось прочитать файл');}e.target.value='';};rd.readAsText(f);});


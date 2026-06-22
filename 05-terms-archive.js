/* ============================================================
 * BreadVenture B2B — Условия и архив
 * Двуязычный редактор условий сотрудничества; просмотр архива КП и версий прайса.
 * Файл #5 из 11. Весь код в общем (глобальном) scope —
 * порядок подключения в index.html важен: 01 первым, далее по номерам.
 * ============================================================ */

/* ===================== TERMS EDITOR (bilingual, editable titles) ===================== */
function renderTerms(){
  var box=document.getElementById('termsEditor');box.innerHTML='';
  terms.forEach(function(tm,i){
    var d=document.createElement('div');d.className='term-block';
    d.innerHTML='<div class="ttl-row"><input class="tt" value="'+esc(tm.titleRu)+'" placeholder="Заголовок (рус)">'+
      '<button class="btn btn-line btn-sm danger t-del">Удалить</button></div>'+
      '<div class="term-cols">'+
      '<div><label class="lbl">Русский — заголовок и текст</label><input class="inp t-tru" value="'+esc(tm.titleRu)+'" placeholder="Заголовок (рус)" style="margin-bottom:8px;"><textarea class="inp t-ru" style="min-height:120px;"></textarea></div>'+
      '<div><label class="lbl">Srpski — naslov i tekst</label><input class="inp t-tsr" value="'+esc(tm.titleSr)+'" placeholder="Naslov (срб)" style="margin-bottom:8px;"><textarea class="inp t-sr" style="min-height:120px;"></textarea></div>'+
      '</div>';
    d.querySelector('.t-ru').value=tm.bodyRu;
    d.querySelector('.t-sr').value=tm.bodySr;
    var titleTop=d.querySelector('.tt'), tru=d.querySelector('.t-tru'), tsr=d.querySelector('.t-tsr');
    titleTop.addEventListener('input',function(){terms[i].titleRu=this.value;tru.value=this.value;saveTerms();});
    tru.addEventListener('input',function(){terms[i].titleRu=this.value;titleTop.value=this.value;saveTerms();});
    tsr.addEventListener('input',function(){terms[i].titleSr=this.value;saveTerms();});
    d.querySelector('.t-ru').addEventListener('input',function(){terms[i].bodyRu=this.value;saveTerms();});
    d.querySelector('.t-sr').addEventListener('input',function(){terms[i].bodySr=this.value;saveTerms();});
    d.querySelector('.t-del').addEventListener('click',function(){
      if(confirm('Удалить раздел «'+terms[i].titleRu+'»?')){terms.splice(i,1);saveTerms();renderTerms();}});
    box.appendChild(d);
  });
}
document.getElementById('addTerm').addEventListener('click',function(){
  terms.push({id:uid(),titleRu:'Новый раздел',bodyRu:'',titleSr:'Novi odeljak',bodySr:''});saveTerms();renderTerms();
  document.getElementById('termsEditor').lastChild.scrollIntoView({behavior:'smooth',block:'center'});});
document.getElementById('saveVerTerms').addEventListener('click',function(){saveVersion('Условия');toast('Версия сохранена в Архив');});
document.querySelectorAll('#termsLangSeg .seg-b').forEach(function(b){
  b.addEventListener('click',function(){
    document.querySelectorAll('#termsLangSeg .seg-b').forEach(function(x){x.classList.remove('active');});
    b.classList.add('active');termsLang=b.dataset.lang;});
});
function buildTermsDoc(lang){
  var l=LB(lang);
  var ms=kpDateMs('termsDate');
  var ds=new Date(ms).toLocaleDateString(lang==='sr'?'sr-RS':'ru-RU',{day:'2-digit',month:'long',year:'numeric'});
  var h='<div class="kp">';
  h+='<div class="kp-head">'+logoHTML()+'<div><h2>'+esc(l.terms)+'</h2><div class="sub">BreadVenture · '+l.sub+'</div></div></div>';
  h+='<div class="kp-meta"><div class="kp-for"></div><div class="kp-date">'+l.date+' '+esc(ds)+'</div></div>';
  var any=false;
  terms.forEach(function(tm){var title=lang==='sr'?tm.titleSr:tm.titleRu,body=lang==='sr'?tm.bodySr:tm.bodyRu;
    if(!body||!body.trim())return;any=true;
    h+='<div class="kp-term" style="margin-top:14px;"><h4>'+esc(title)+'</h4><p>'+esc(body)+'</p></div>';});
  if(!any)h+='<p class="hint">Текст условий пуст.</p>';
  h+='<div class="kp-foot">'+esc(footNote(lang))+'<br>'+footLine(lang)+'</div>';
  h+='</div>';return h;
}
document.getElementById('termsPdf').addEventListener('click',function(){
  lastKP=null;
  document.getElementById('kpWrap').innerHTML=buildTermsDoc(termsLang);
  document.getElementById('kpWrap').style.display='block';
  document.getElementById('txtWrap').style.display='none';
  document.querySelector('.tab[data-tab="offer"]').click();
  document.getElementById('kpActions').style.display='flex';
  setTimeout(function(){genPDF('BreadVenture-uslovi.pdf');},300);
});
document.getElementById('resetTerms').addEventListener('click',function(){
  if(confirm('Вернуть базовый текст условий (рус + срб)? Текущая версия сначала сохранится в историю.')){
    saveVersion('Авто: перед сбросом условий');terms=JSON.parse(JSON.stringify(DEFAULT_TERMS));terms.forEach(function(t){t.id=uid();});
    saveTerms();renderTerms();toast('Условия сброшены');}});

/* ===================== ARCHIVE VIEWS ===================== */
function renderKPArchive(){
  var box=document.getElementById('kpArchView');box.innerHTML='';
  if(!kpArchive.length){box.innerHTML='<div class="empty">Пока нет сохранённых КП. Сформируйте КП и нажмите «Сохранить в архив».</div>';return;}
  kpArchive.forEach(function(kp){
    var c=document.createElement('div');c.className='arch-card';
    var typ=(kp.type==='primary')?'Первичное (прайс)':'Под объём';
    var sum=(kp.totals)?fmt(kp.totals.grand)+' дин.':'—';
    c.innerHTML='<div class="ai"><b>'+esc(kp.partner||'Без партнёра')+'</b>'+
      '<small>'+esc(kp.when)+' · '+typ+' · '+(kp.lang==='sr'?'срб':'рус')+'</small></div>'+
      '<div class="av">'+sum+'</div>'+
      '<div class="aa"><button class="btn btn-primary btn-sm a-open">Открыть</button>'+
      '<button class="btn btn-line btn-sm danger a-del">Удалить</button></div>';
    c.querySelector('.a-open').addEventListener('click',function(){
      document.querySelector('.tab[data-tab="offer"]').click();
      showKP(JSON.parse(JSON.stringify(kp)));});
    c.querySelector('.a-del').addEventListener('click',function(){deleteKP(kp.id);});
    box.appendChild(c);
  });
}
function renderVersions(){
  var box=document.getElementById('verView');box.innerHTML='';
  if(!priceHistory.length){box.innerHTML='<div class="empty">Пока нет сохранённых версий. Нажмите «Сохранить версию» во вкладке «Прайс-лист» или «Условия».</div>';return;}
  priceHistory.forEach(function(v){
    var c=document.createElement('div');c.className='arch-card';
    c.innerHTML='<div class="ai"><b>'+esc(v.kind||'Версия')+'</b><small>'+esc(v.when)+' · позиций: '+v.catalog.length+'</small></div>'+
      '<div class="aa"><button class="btn btn-line btn-sm v-show">Посмотреть</button>'+
      '<button class="btn btn-primary btn-sm v-restore">Восстановить</button>'+
      '<button class="btn btn-line btn-sm danger v-del">Удалить</button></div>';
    var det=document.createElement('div');det.style.width='100%';det.style.display='none';
    c.appendChild(det);
    c.querySelector('.v-show').addEventListener('click',function(){
      if(det.style.display==='none'){det.innerHTML=versionDetail(v);det.style.display='block';this.textContent='Скрыть';}
      else{det.style.display='none';this.textContent='Посмотреть';}});
    c.querySelector('.v-restore').addEventListener('click',function(){restoreVersion(v.id);});
    c.querySelector('.v-del').addEventListener('click',function(){deleteVersion(v.id);});
    box.appendChild(c);
  });
}
function versionDetail(v){
  var h='<div class="ver-view"><h4>Позиции и цены</h4><table class="ver-tbl"><tr><th>Позиция</th><th>Гр.</th><th class="n">Розница</th><th>Скидки</th></tr>';
  v.catalog.forEach(function(it){
    var ts=(it.tiers||[]).slice().sort(function(a,b){return a.min-b.min;}).map(function(t){return t.min+'+ −'+(Number(t.disc)||0)+'%';}).join(', ');
    h+='<tr><td>'+esc(it.name)+'</td><td>'+esc(it.weight||'')+'</td><td class="n">'+fmt(it.retail)+'</td><td>'+esc(ts)+'</td></tr>';
  });
  h+='</table>';
  if(v.terms&&v.terms.length){
    h+='<div class="ver-terms"><h4 style="margin-top:18px;">Условия (рус)</h4>';
    v.terms.forEach(function(tm){if(!tm.bodyRu||!tm.bodyRu.trim())return;
      h+='<div class="vt"><b>'+esc(tm.titleRu)+'</b><p>'+esc(tm.bodyRu)+'</p></div>';});
    h+='</div>';
  }
  h+='</div>';return h;
}

function renderFoot(){
  var map={footNoteRu:'noteRu',footNoteSr:'noteSr',footOwnerRu:'ownerRu',footOwnerSr:'ownerSr',footBrand:'brand',footEmail:'email',footPhone:'phone'};
  Object.keys(map).forEach(function(id){var el=document.getElementById(id);if(!el)return;
    el.value=footData[map[id]]||'';
    el.oninput=function(){footData[map[id]]=this.value;saveFoot();};});
}
document.getElementById('footReset').addEventListener('click',function(){
  if(confirm('Вернуть базовые реквизиты подвала?')){footData=JSON.parse(JSON.stringify(DEFAULT_FOOT));saveFoot();renderFoot();toast('Реквизиты сброшены');}});


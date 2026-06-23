/* ============================================================
 * BreadVenture — кабинет партнёра — Хранение, вход и запуск
 * Просмотр рекомендаций по хранению, вход по коду, инициализация.
 * Файл #5 из 5. Общий scope, порядок подключения важен (01 первым).
 * ============================================================ */

/* ---------- хранение и рекомендации (только просмотр) ---------- */
var CARE_COLORS={
  yellow:{bg:'#FFF7DA',bd:'#ecdb94',fg:'#6b5b16'},
  red:{bg:'#FCEBEA',bd:'#f0b3ad',fg:'#962f26'},
  blue:{bg:'#E8F4FC',bd:'#9fcdeb',fg:'#175680'},
  green:{bg:'#EAF6EE',bd:'#a6d8bb',fg:'#1d6840'},
  grey:{bg:'#F0F0EA',bd:'#dcdad0',fg:'#45443e'}
};
function driveThumb(id){return 'https://drive.google.com/thumbnail?id='+id+'&sz=w1000';}
function driveDl(id){return 'https://drive.google.com/uc?export=download&id='+id;}
function careBlocksHtml(blocks,lang){
  if(!blocks||!blocks.length)return '';
  function tx(b){return (b.t&&b.t[lang])||'';}
  function nl(s){return s.replace(/\n/g,'<br>');}
  function cell(b){
    if(b.type==='h')return '<h3 class="cg-h">'+esc(tx(b))+'</h3>';
    if(b.type==='note'){var c=CARE_COLORS[b.color||'yellow']||CARE_COLORS.yellow;return '<div class="cg-note" style="background:'+c.bg+';border-color:'+c.bd+';color:'+c.fg+';">'+nl(esc(tx(b)))+'</div>';}
    if(b.type==='table'){var t=(b.t&&b.t[lang])||[];if(!t.length)return '';var s='<div class="cg-tablewrap"><table class="cg-table">';t.forEach(function(row,ri){s+='<tr>';row.forEach(function(cl){var tag=ri===0?'th':'td';s+='<'+tag+'>'+nl(esc(cl||''))+'</'+tag+'>';});s+='</tr>';});return s+'</table></div>';}
    if(b.type==='img'){var src=b.fileId?driveThumb(b.fileId):(b.thumb||'');var dl=b.fileId?driveDl(b.fileId):(b.download||'');var cap=(b.cap&&b.cap[lang])||'';
      return '<figure class="cg-fig">'+(src?'<img class="cg-img" src="'+esc(src)+'" alt="" loading="lazy">':'')+
        (cap?'<figcaption class="cg-cap">'+nl(esc(cap))+'</figcaption>':'')+
        (dl?'<a class="cg-dl" href="'+esc(dl)+'" rel="noopener">⬇ '+(lang==='sr'?'Preuzmi sliku':'Скачать фото')+'</a>':'')+'</figure>';}
    if(b.type==='file'){var fdl=b.fileId?driveDl(b.fileId):(b.download||'');var ttl=(b.ttl&&b.ttl[lang])||b.name||(lang==='sr'?'Dokument':'Документ');
      return '<div class="cg-file"><span class="cg-fic">📄</span><span class="cg-fname">'+esc(ttl)+'</span>'+(fdl?'<a class="cg-dl" href="'+esc(fdl)+'" rel="noopener">⬇ '+(lang==='sr'?'Preuzmi':'Скачать')+'</a>':'')+'</div>';}
    return '<p class="cg-p">'+nl(esc(tx(b)))+'</p>';
  }
  var secs=[],cur=null;
  blocks.forEach(function(b){if(b.type==='h'){cur={blocks:[b]};secs.push(cur);}else{if(!cur){cur={blocks:[]};secs.push(cur);}cur.blocks.push(b);}});
  if(secs.length){var L=secs[secs.length-1];if(L.blocks.length>1){var lastb=L.blocks[L.blocks.length-1];if(lastb.type==='p'){L.blocks.pop();secs.push({blocks:[lastb],footer:true});}}}
  var h='';
  secs.forEach(function(s){var inner='';s.blocks.forEach(function(b){inner+=cell(b);});h+='<div class="cg-card'+(s.footer?' cg-foot':'')+'">'+inner+'</div>';});
  return h;
}
function renderStorage(){
  var sr=(LANG==='sr');
  document.getElementById('hTitle').textContent=(sr?'Čuvanje i preporuke':'Хранение и рекомендации');
  document.getElementById('bar').style.display='none';
  var c=document.getElementById('content');var h=navHtml('care');
  h+='<div class="sec-title" style="font-size:23px;">'+(sr?'Čuvanje i preporuke za upotrebu':'Хранение и рекомендации по использованию')+'</div>';
  var blocks=(STORAGE&&STORAGE.blocks)||[];
  if(blocks.length)h+=careBlocksHtml(blocks,LANG);
  else h+='<p class="hint" style="margin-top:10px;">'+(sr?'Sekcija će uskoro biti popunjena.':'Раздел скоро будет заполнен.')+'</p>';
  c.innerHTML=h;bindNav();
}

/* ---------- вход по коду ---------- */
function showLogin(err){
  document.getElementById('hTitle').textContent=(LANG==='sr'?'Kabinet partnera':'Кабинет партнёра');
  document.getElementById('content').innerHTML=
    '<div class="form-card" style="max-width:420px;margin:28px auto;">'+
    '<div class="sec-title" style="margin-top:0;">Вход для партнёров</div>'+
    '<p class="hint" style="margin-bottom:14px;">Введите код доступа, который вам выдали в пекарне.</p>'+
    '<div class="field"><input class="inp" id="codeInp" placeholder="Код доступа" style="text-transform:uppercase;letter-spacing:.1em;font-size:18px;text-align:center;" value="'+esc(CODE)+'"></div>'+
    (err?'<div class="deliv warn" style="margin-bottom:12px;"><span>⚠</span><div>'+esc(err)+'</div></div>':'')+
    '<button class="btn" id="loginBtn" style="width:100%;">Войти</button>'+
    '<p class="hint" style="text-align:center;margin-top:16px;">Нет кода? <a href="#" id="reqLink" style="color:var(--blue-d);">Запросить доступ</a></p></div>';
  document.getElementById('loginBtn').addEventListener('click',doAuth);
  document.getElementById('codeInp').addEventListener('keydown',function(e){if(e.key==='Enter')doAuth();});
  document.getElementById('reqLink').addEventListener('click',function(e){e.preventDefault();showRequest();});
}
function applyAuth(j,code){
  CODE=code;PARTNER=(j.partner&&j.partner.name)||'';
  try{localStorage.setItem('bv_partner_code',code);}catch(e){}
  var data=j.data||{};catalog=(data.catalog||[]).filter(function(it){return it&&it.name&&it.retail!=null;});
  ORDERS=j.orders||[];DOCS=j.documents||[];POINTS=j.points||[];PROFILE=j.profile||{};ANNOUNCE=(data.announce)||{};STORAGE=(data.storage)||null;deliveries=[];
  TERMS=Array.isArray(data.terms)?data.terms:[];FOOT=data.foot||{};CATSR=data.catNamesSr||{};
  if(data.settings){var s=data.settings;if(s.free!=null)FREE_FROM=Number(s.free)||FREE_FROM;if(s.minDeliv!=null)MIN_DELIVERY=Number(s.minDeliv)||MIN_DELIVERY;if(s.deliv!=null)DELIVERY=Number(s.deliv)||DELIVERY;if(Array.isArray(s.holidays)){HOLIDAY_RAW=s.holidays;HOLIDAYS=s.holidays.map(function(h){return typeof h==='string'?h:(h&&h.date)||'';}).filter(Boolean);}if(s.leadDays!=null)LEAD_DAYS=Number(s.leadDays)||LEAD_DAYS;}
  setView('new');
  cloudSubList();
  cloudPointList();
}
function doAuth(){
  var code=document.getElementById('codeInp').value.trim().toUpperCase();if(!code){showLogin('Введите код.');return;}
  var btn=document.getElementById('loginBtn');btn.disabled=true;btn.textContent='Проверяем…';
  fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({auth:code})})
    .then(function(r){return r.json();})
    .then(function(j){if(j&&j.ok)applyAuth(j,code);else showLogin('Неверный или отключённый код. Проверьте или запросите доступ.');})
    .catch(function(){showLogin('Нет связи. Попробуйте позже.');});
}
function showRequest(){
  document.getElementById('bar').style.display='none';
  document.getElementById('content').innerHTML=
    '<div class="form-card" style="max-width:440px;margin:28px auto;">'+
    '<div class="sec-title" style="margin-top:0;">Запрос доступа</div>'+
    '<p class="hint" style="margin-bottom:14px;">Оставьте контакты — пекарня свяжется и выдаст код доступа к прайсу.</p>'+
    '<div class="field"><label class="lbl">Компания <span class="req">*</span></label><input class="inp" id="rName" placeholder="Название заведения"></div>'+
    '<div class="field"><label class="lbl">Контактное лицо <span class="req">*</span></label><input class="inp" id="rContact" placeholder="Имя"></div>'+
    '<div class="field"><label class="lbl">Телефон <span class="req">*</span></label><input class="inp" id="rPhone" placeholder="+381 …" inputmode="tel"></div>'+
    '<div class="field"><label class="lbl">Комментарий</label><textarea class="inp" id="rComment" placeholder="Что планируете заказывать"></textarea></div>'+
    '<button class="btn" id="reqBtn" style="width:100%;">Отправить запрос</button>'+
    '<p class="hint" style="text-align:center;margin-top:14px;"><a href="#" id="backLink" style="color:var(--blue-d);">← у меня уже есть код</a></p></div>';
  document.getElementById('backLink').addEventListener('click',function(e){e.preventDefault();showLogin();});
  document.getElementById('reqBtn').addEventListener('click',function(){
    var name=document.getElementById('rName').value.trim(),contact=document.getElementById('rContact').value.trim(),phone=document.getElementById('rPhone').value.trim();
    if(!name||!contact||!phone){alert('Заполните компанию, контактное лицо и телефон.');return;}
    var comment=document.getElementById('rComment').value.trim();var btn=this;btn.disabled=true;btn.textContent='Отправляем…';
    fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({request:{name:name,contact:contact,phone:phone,comment:comment}})})
      .then(function(r){return r.json();}).then(function(j){
        if(j&&j.ok)document.getElementById('content').innerHTML='<div class="ok-screen"><div class="ic">🔑</div><div class="big">Запрос отправлен</div><p style="color:#55544c;max-width:420px;margin:0 auto;">Спасибо! Пекарня свяжется с вами и выдаст код доступа.</p><button class="btn" style="margin-top:22px;" onclick="location.reload()">На главную</button></div>';
        else throw 'err';
      }).catch(function(){alert('Не удалось отправить. Попробуйте позже.');btn.disabled=false;btn.textContent='Отправить запрос';});
  });
}

/* ---------- старт ---------- */
(function(){
  if(!GAS_URL){document.getElementById('content').innerHTML='<div class="empty">Страница ещё не подключена к пекарне.<br>Вставьте URL в переменную GAS_URL.</div>';return;}
  if(CODE){
    fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({auth:CODE})})
      .then(function(r){return r.json();})
      .then(function(j){if(j&&j.ok)applyAuth(j,CODE);else{try{localStorage.removeItem('bv_partner_code');}catch(e){}CODE='';showLogin();}})
      .catch(function(){showLogin('Нет связи. Попробуйте позже.');});
  }else showLogin();
})();

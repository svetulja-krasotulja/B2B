/* ============================================================
 * BreadVenture — кабинет партнёра — Адреса и профиль
 * Адреса доставки (точки) партнёра, реквизиты профиля, объявление.
 * Файл #4 из 5. Общий scope, порядок подключения важен (01 первым).
 * ============================================================ */

/* ---------- адреса (точки) партнёра ---------- */
var ptEditId='';
function cloudPointList(cb){
  if(!CODE){if(cb)cb();return;}
  fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({pointList:CODE})})
    .then(function(r){return r.json();}).then(function(j){if(j&&j.ok&&Array.isArray(j.points))POINTS=j.points;if(cb)cb();else if(VIEW==='points'||VIEW==='me')renderMe();})
    .catch(function(){if(cb)cb();});
}
function renderPoints(){
  document.getElementById('hTitle').textContent=(LANG==='sr'?'Moje adrese':'Мои адреса');
  document.getElementById('bar').style.display='none';
  var c=document.getElementById('content');var h=navHtml('points');
  h+='<div class="cat">'+(LANG==='sr'?'Adrese isporuke (tačke)':'Адреса доставки (точки)')+'</div>';
  h+='<p class="hint" style="margin-bottom:12px;">'+(LANG==='sr'?'Sačuvajte adrese vaših objekata. Pri poručivanju biraćete tačku — dostava i prag se računaju po toj tački.':'Сохраните адреса ваших точек. При заказе вы выберете точку — доставка и порог считаются по этой точке.')+'</p>';
  if(!POINTS.length)h+='<div class="empty" style="margin-bottom:14px;">'+(LANG==='sr'?'Još nema sačuvanih adresa.':'Сохранённых адресов пока нет.')+'</div>';
  POINTS.forEach(function(pt){
    h+='<div class="ocard" style="margin-bottom:9px;"><div class="top"><span style="font-weight:600;">📍 '+esc(pt.name||(LANG==='sr'?'Tačka':'Точка'))+'</span></div>'+
       '<div style="font-size:13.5px;color:#55544c;margin-top:3px;">'+esc(pt.address||'')+'</div>'+
       '<div style="display:flex;gap:7px;margin-top:10px;">'+
       '<button class="btn btn-line pt-ed" data-id="'+esc(pt.id)+'" style="padding:8px 14px;font-size:13px;">'+(LANG==='sr'?'Izmeni':'Изменить')+'</button>'+
       '<button class="btn btn-line pt-del" data-id="'+esc(pt.id)+'" style="padding:8px 14px;font-size:13px;color:#b3261e;">'+(LANG==='sr'?'Obriši':'Удалить')+'</button>'+
       '</div></div>';
  });
  h+='<button class="btn" id="ptNew" style="margin-top:6px;">+ '+(LANG==='sr'?'Nova adresa':'Новый адрес')+'</button>';
  c.innerHTML=h;bindNav();
  c.querySelectorAll('.pt-ed').forEach(function(b){b.addEventListener('click',function(){openPointForm(this.dataset.id);});});
  c.querySelectorAll('.pt-del').forEach(function(b){b.addEventListener('click',function(){var id=this.dataset.id;if(confirm(LANG==='sr'?'Obrisati ovu adresu?':'Удалить этот адрес?'))cloudPointDelete(id);});});
  var nb=document.getElementById('ptNew');if(nb)nb.addEventListener('click',function(){openPointForm('');});
}
function openPointForm(editId){
  ptEditId=editId||'';var pt=null;if(editId)POINTS.forEach(function(x){if(x.id===editId)pt=x;});
  document.getElementById('hTitle').textContent=(LANG==='sr'?'Adresa':'Адрес');
  var c=document.getElementById('content');var h='';
  h+='<div style="margin:4px 0 12px;"><a id="ptBack" style="color:var(--blue-d);cursor:pointer;">‹ '+(LANG==='sr'?'Nazad':'Назад')+'</a></div>';
  h+='<div class="form-card">'+
     '<div class="field"><label class="flab">'+(LANG==='sr'?'Naziv tačke':'Название точки')+'</label><input class="inp" id="ptName" placeholder="'+(LANG==='sr'?'npr. Centar':'напр. Центр')+'" value="'+esc(pt&&pt.name||'')+'"></div>'+
     '<div class="field"><label class="flab">'+(LANG==='sr'?'Adresa':'Адрес')+' <span class="req">*</span></label><input class="inp" id="ptAddr" placeholder="'+(LANG==='sr'?'Ulica, broj, grad':'Улица, дом, город')+'" value="'+esc(pt&&pt.address||'')+'"></div>'+
     '<button class="btn" id="ptSave" style="margin-top:6px;">'+(LANG==='sr'?'Sačuvaj':'Сохранить')+'</button></div>';
  c.innerHTML=h;
  document.getElementById('ptBack').addEventListener('click',function(){renderMe();});
  document.getElementById('ptSave').addEventListener('click',savePoint);
}
function savePoint(){
  var name=document.getElementById('ptName').value.trim(),addr=document.getElementById('ptAddr').value.trim();
  if(!addr){alert(LANG==='sr'?'Unesite adresu.':'Укажите адрес.');return;}
  var point={name:name,address:addr};if(ptEditId)point.id=ptEditId;
  var btn=document.getElementById('ptSave');btn.disabled=true;btn.textContent='…';
  cloudPointSave(point,function(ok){if(ok)renderMe();else{alert(LANG==='sr'?'Nije uspelo':'Не удалось');btn.disabled=false;btn.textContent=(LANG==='sr'?'Sačuvaj':'Сохранить');}});
}
function cloudPointSave(point,cb){
  fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({pointSave:point,code:CODE})})
    .then(function(r){return r.json();}).then(function(j){if(j&&j.ok&&Array.isArray(j.points))POINTS=j.points;if(cb)cb(j&&j.ok);}).catch(function(){if(cb)cb(false);});
}
function cloudPointDelete(id){
  fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({pointDelete:true,pointId:id,code:CODE})})
    .then(function(r){return r.json();}).then(function(j){if(j&&j.ok){if(Array.isArray(j.points))POINTS=j.points;renderMe();}else alert(LANG==='sr'?'Nije uspelo':'Не удалось');}).catch(function(){alert(LANG==='sr'?'Greška':'Ошибка');});
}

/* ---------- мои данные (профиль) + объявление ---------- */
function announceBannerHtml(){
  var list=[];
  if(Array.isArray(ANNOUNCE))list=ANNOUNCE;
  else if(ANNOUNCE&&(ANNOUNCE.ru||ANNOUNCE.sr))list=[ANNOUNCE];
  list=list.filter(function(a){return a&&a.active!==false&&(LANG==='sr'?(a.sr||a.ru):(a.ru||a.sr));});
  if(!list.length)return '';
  list=list.slice().sort(function(a,b){return (b.ts||b.updated||0)-(a.ts||a.updated||0);});
  var h='';
  list.forEach(function(a){var txt=(LANG==='sr')?(a.sr||a.ru):(a.ru||a.sr);
    h+='<div class="holiday-banner" style="background:#E8F4FC;border-color:#9fcdeb;color:#1a5a85;">📣 '+esc(txt).replace(/\n/g,'<br>')+'</div>';});
  return h;
}
function meField(id,label,val){return '<div class="field"><label class="lbl">'+esc(label)+'</label><input class="inp" id="'+id+'" value="'+esc(val||'')+'"></div>';}
function renderMe(){
  document.getElementById('hTitle').textContent=(LANG==='sr'?'Moji podaci':'Мои данные');
  document.getElementById('bar').style.display='none';
  var sr=(LANG==='sr'),P=PROFILE||{};
  var c=document.getElementById('content');var h=navHtml('me');
  h+='<div class="sec-title">'+(sr?'Podaci kompanije':'Данные компании')+'</div>';
  h+='<p class="hint" style="margin-bottom:12px;">'+(sr?'Ovi podaci se koriste za dokumente i isporuku. Pekara ih vidi u svom kabinetu.':'Эти данные используются для документов и доставки. Пекарня видит их в своём кабинете.')+'</p>';
  h+='<div class="form-card">'+
     meField('meCompany',sr?'Naziv kompanije':'Название компании',P.company)+
     meField('meContact',sr?'Ime za kontakt':'Контактное лицо',P.contact)+
     meField('mePhone',sr?'Telefon':'Телефон',P.phone)+
     meField('mePib','PIB',P.pib)+
     meField('meMaticni',sr?'Matični broj':'Matični broj',P.maticni)+
     meField('meAccount',sr?'Broj računa':'Номер счёта',P.account)+
     '<button class="btn" id="meSave" style="margin-top:6px;">'+(sr?'Sačuvaj':'Сохранить')+'</button>'+
     '</div>';
  h+='<div class="sec-title">'+(sr?'Adrese isporuke (tačke)':'Адреса доставки (точки)')+'</div>';
  h+='<p class="hint" style="margin-bottom:12px;">'+(sr?'Sačuvajte adrese vaših objekata. Pri poručivanju biraćete tačku — dostava i prag se računaju po toj tački.':'Сохраните адреса ваших точек. При заказе вы выберете точку — доставка и порог считаются по этой точке.')+'</p>';
  if(!POINTS.length)h+='<div class="empty" style="margin-bottom:14px;">'+(sr?'Još nema sačuvanih adresa.':'Сохранённых адресов пока нет.')+'</div>';
  POINTS.forEach(function(pt){
    h+='<div class="ocard" style="margin-bottom:9px;"><div class="top"><span style="font-weight:600;">📍 '+esc(pt.name||(sr?'Tačka':'Точка'))+'</span></div>'+
       '<div style="font-size:13.5px;color:#55544c;margin-top:3px;">'+esc(pt.address||'')+'</div>'+
       '<div style="display:flex;gap:7px;margin-top:10px;">'+
       '<button class="btn btn-line pt-ed" data-id="'+esc(pt.id)+'" style="padding:8px 14px;font-size:13px;">'+(sr?'Izmeni':'Изменить')+'</button>'+
       '<button class="btn btn-line pt-del" data-id="'+esc(pt.id)+'" style="padding:8px 14px;font-size:13px;color:#b3261e;">'+(sr?'Obriši':'Удалить')+'</button>'+
       '</div></div>';
  });
  h+='<button class="btn" id="ptNew" style="margin-top:6px;">+ '+(sr?'Nova adresa':'Новый адрес')+'</button>';
  c.innerHTML=h;bindNav();
  document.getElementById('meSave').addEventListener('click',saveMe);
  c.querySelectorAll('.pt-ed').forEach(function(b){b.addEventListener('click',function(){openPointForm(this.dataset.id);});});
  c.querySelectorAll('.pt-del').forEach(function(b){b.addEventListener('click',function(){var id=this.dataset.id;if(confirm(sr?'Obrisati ovu adresu?':'Удалить этот адрес?'))cloudPointDelete(id);});});
  var nb=document.getElementById('ptNew');if(nb)nb.addEventListener('click',function(){openPointForm('');});
}
function saveMe(){
  function gv(id){var el=document.getElementById(id);return el?el.value.trim():'';}
  var prof={company:gv('meCompany'),contact:gv('meContact'),phone:gv('mePhone'),pib:gv('mePib'),maticni:gv('meMaticni'),account:gv('meAccount')};
  var btn=document.getElementById('meSave');btn.disabled=true;btn.textContent='…';
  fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({profileSave:prof,code:CODE})})
    .then(function(r){return r.json();}).then(function(j){
      if(j&&j.ok){PROFILE=j.profile||prof;toast2(LANG==='sr'?'Sačuvano':'Сохранено');btn.disabled=false;btn.textContent=(LANG==='sr'?'Sačuvaj':'Сохранить');}
      else{alert(LANG==='sr'?'Nije uspelo':'Не удалось');btn.disabled=false;btn.textContent=(LANG==='sr'?'Sačuvaj':'Сохранить');}
    }).catch(function(){alert(LANG==='sr'?'Greška':'Ошибка');btn.disabled=false;btn.textContent=(LANG==='sr'?'Sačuvaj':'Сохранить');});
}


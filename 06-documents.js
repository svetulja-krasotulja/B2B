/* ============================================================
 * BreadVenture B2B — Заказы (доска) и генератор документов
 * Админ-доска заказов; генератор предрачуна / фактуры / отпремницы (форма, расчёт, PDF).
 * Файл #6 из 11. Весь код в общем (глобальном) scope —
 * порядок подключения в index.html важен: 01 первым, далее по номерам.
 * ============================================================ */

/* ---------- заказы (админ-доска) ---------- */
var adminOrders=[], ordersFilterSt='all', openAdminOrder='', editingOrder='', editItems=[], pendingStatus={};
var ORD_ST={submitted:'Новый',confirmed:'Подтверждён',in_production:'В производстве',packed:'Собран',out_for_delivery:'В доставке',delivered:'Доставлен',cancelled:'Отменён'};
var ORD_ST_COLOR={submitted:'#2f87bd',confirmed:'#2c7a4b',in_production:'#c98a2b',packed:'#7a5cc0',out_for_delivery:'#c0577e',delivered:'#3a8a3a',cancelled:'#b3261e'};
var ORD_FLOW=['submitted','confirmed','in_production','packed','out_for_delivery','delivered','cancelled'];
function cloudOrders(){
  if(!GAS_URL){toast('Сначала подключите облако');return Promise.reject('no-url');}
  return fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({master:MASTER,orders:true})}).then(function(r){return r.json();})
    .then(function(j){if(j&&j.ok)return j.orders||[];throw (j&&j.error)||'bad';});
}
function cloudSetStatus(orderId,status){
  return fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({master:MASTER,setStatus:status,order_id:orderId})}).then(function(r){return r.json();});
}
function cloudComment(orderId,text,internal){
  return fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({master:MASTER,comment:text,internal:!!internal,order_id:orderId})}).then(function(r){return r.json();});
}
function cloudSetPayment(orderId,paid,dueDate){
  return fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({master:MASTER,setPayment:true,order_id:orderId,paid:!!paid,dueDate:dueDate||''})}).then(function(r){return r.json();});
}
var ORD_DOC={predracun:'Предсчёт (predračun)',faktura:'Фактура (faktura)',otpremnica:'Отпремница',deklaracija:'Декларация',invoice:'Счёт',other:'Документ'};
function cloudOrderDoc(orderId,type,title,url){
  return fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({master:MASTER,orderDoc:true,order_id:orderId,docType:type,docTitle:title,docUrl:url})}).then(function(r){return r.json();});
}
function cloudOrderDocUpload(orderId,type,title,fileName,mime,dataB64){
  return fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({master:MASTER,orderDocUpload:true,order_id:orderId,docType:type,docTitle:title,fileName:fileName,mime:mime,dataB64:dataB64})}).then(function(r){return r.json();});
}
function cloudOrderDocDel(orderId,ts){
  return fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({master:MASTER,orderDocDel:true,order_id:orderId,docTs:ts})}).then(function(r){return r.json();});
}
function cloudEditOrder(orderId,items,total){
  return fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({master:MASTER,editOrder:true,order_id:orderId,items:items,total:total})}).then(function(r){return r.json();});
}
function ordFindCat(name,weight){var r=null;catalog.forEach(function(it){if(it.name===name&&(it.weight||'')===(weight||''))r=it;});return r;}
function ordRecalc(o){
  var gross=0;
  editItems.forEach(function(ei){var q=Math.max(0,Number(ei.qty)||0);var it=ordFindCat(ei.name,ei.weight);
    if(it){var disc=discountFor(it,q);var unit=it.retail*(1-disc/100);ei.uom=itemUnit(it);ei.sum=Math.round(unit*q*100)/100;}
    else{var u=(ei._unit!=null?ei._unit:0);ei.sum=Math.round(u*q*100)/100;}
    gross+=ei.sum;});
  var oldGross=(o.items||[]).reduce(function(s,x){return s+(Number(x.sum)||0);},0);
  var oldDelivery=Math.max(0,(Number(o.total)||0)-oldGross);
  return {gross:gross,delivery:oldDelivery,total:Math.round((gross+oldDelivery)*100)/100};
}
function renderOrdersFilter(){
  var f=document.getElementById('ordersFilter');if(!f)return;
  var counts={all:adminOrders.length};ORD_FLOW.forEach(function(s){counts[s]=0;});
  adminOrders.forEach(function(o){var s=o.status||'submitted';counts[s]=(counts[s]||0)+1;});
  var chips=[['all','Все']].concat(ORD_FLOW.map(function(s){return [s,ORD_ST[s]];}));
  f.innerHTML=chips.map(function(c){var on=ordersFilterSt===c[0];
    return '<button class="chk cat-chip'+(on?' on':'')+'" data-st="'+c[0]+'">'+esc(c[1])+' ('+(counts[c[0]]||0)+')</button>';}).join('');
  f.querySelectorAll('[data-st]').forEach(function(b){b.addEventListener('click',function(){ordersFilterSt=this.dataset.st;renderAdminOrders();});});
}
/* ===== Генератор документов: предрачун / отпремница ===== */
var DOC_KIND={predracun:{ru:'Предрачун',sr:'PREDRAČUN'},faktura:{ru:'Фактура',sr:'FAKTURA'},otpremnica:{ru:'Отпремница',sr:'OTPREMNICA'},deklaracija:{ru:'Декларация',sr:'DEKLARACIJA'}};
var dgState=null;
function fmtRs(n,dec){dec=(dec==null?2:dec);var s=(Number(n)||0).toFixed(dec);var p=s.split('.');p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.');return p[0]+(p[1]?(','+p[1]):'');}
function dgMatchCatalog(name,weight){var f=null;catalog.forEach(function(it){if(it.name===name&&(it.weight||'')===(weight||''))f=it;});if(!f)catalog.forEach(function(it){if(it.name===name)f=it;});return f;}
function dgEsc(s){return esc(s==null?'':String(s));}
function dgToday(){return new Date().toISOString().slice(0,10);}
function dgFmtDate(iso){if(!iso)return '';var p=String(iso).slice(0,10).split('-');return p.length===3?(p[2]+'.'+p[1]+'.'+p[0]):iso;}
function openDocGen(orderId,kind){
  var o=null;adminOrders.forEach(function(x){if(x.order_id===orderId)o=x;});if(!o){toast('Заказ не найден');return;}
  var s=sellerData();
  var prof=(profilesAdmin&&profilesAdmin[o.partner_id])||{};
  var savedParty=(docConfig.parties&&docConfig.parties[o.partner_id])||{};
  var buyer={
    name:savedParty.name||prof.company||o.partner||'',
    address:savedParty.address||o.address||'',
    city:savedParty.city||'',
    pib:savedParty.pib||prof.pib||'',
    mb:savedParty.mb||prof.maticni||''
  };
  var items=(o.items||[]).map(function(it){
    var cat=dgMatchCatalog(it.name,it.weight);
    var price=cat?cat.retail:(it.qty?Math.round((it.sum||0)/it.qty):0);
    var pdv=(cat&&cat.pdv!=null)?cat.pdv:10;
    var popust=0;if(cat&&it.qty){var full=cat.retail*it.qty;var net=(it.sum!=null?it.sum:full);if(full>0)popust=Math.round((1-net/full)*100);}
    return {sifra:(cat&&(cat.sifra||cat.code))||'',naziv:it.name+(it.weight?' '+it.weight:''),qty:Number(it.qty)||0,price:price,pdv:pdv,popust:popust<0?0:popust};
  });
  // доставка из заказа: o.total минус сумма позиций
  var grossItems=(o.items||[]).reduce(function(sm,x){return sm+(Number(x.sum)||0);},0);
  var deliv=Math.max(0,Math.round(((Number(o.total)||0)-grossItems)*100)/100);
  if(deliv>0)items.push({sifra:'',naziv:'Dostava',qty:1,price:deliv,pdv:20,popust:0});
  var cnt=(docConfig.counters&&docConfig.counters[kind])||0;
  var yr=new Date().getFullYear();
  dgState={kind:kind,orderId:orderId,partnerId:o.partner_id,
    seller:{name:s.name,address:s.address,city:s.city,mb:s.mb,pib:s.pib,tr:s.tr},
    buyer:buyer,items:items,
    number:yr+'-'+(cnt+1),
    dateRacuna:dgToday(),datePromet:(normDate(o.date)||dgToday()),
    dospece:(o.dueDate||''),poziv:(yr+''+(cnt+1))};
  document.getElementById('docGenTitle').textContent=(DOC_KIND[kind].ru)+' — '+orderId;
  dgRenderForm();
  document.getElementById('docGenModal').style.display='flex';
}
function dgRenderForm(){
  var d=dgState,b=d.buyer,s=d.seller;
  var isPay=(d.kind==='predracun'||d.kind==='faktura');
  function inp(f,v,w,t){return '<input class="inp" data-dg="'+f+'" value="'+dgEsc(v)+'"'+(t?' type="'+t+'"':'')+' style="width:'+(w||'100%')+';font-size:13px;padding:6px 9px;">';}
  function fld(lbl,f,v,t){return '<div><label class="lbl" style="margin-bottom:3px;display:block;">'+lbl+'</label>'+inp(f,v,'100%',t)+'</div>';}
  var h='';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">';
  h+='<div><div class="lbl" style="margin-bottom:8px;font-weight:700;">Продавец</div>'+
     '<div style="display:flex;flex-direction:column;gap:8px;">'+
     fld('Название компании','s_name',s.name)+
     fld('Адрес','s_address',s.address)+
     fld('Город / индекс','s_city',s.city)+
     '<div style="display:flex;gap:6px;">'+
       '<div style="flex:1;"><label class="lbl" style="margin-bottom:3px;display:block;">Matični broj</label>'+inp('s_mb',s.mb)+'</div>'+
       '<div style="flex:1;"><label class="lbl" style="margin-bottom:3px;display:block;">PIB</label>'+inp('s_pib',s.pib)+'</div>'+
       '<div style="flex:1;"><label class="lbl" style="margin-bottom:3px;display:block;">Текущий счёт</label>'+inp('s_tr',s.tr)+'</div>'+
     '</div></div></div>';
  h+='<div><div class="lbl" style="margin-bottom:8px;font-weight:700;">Покупатель</div>'+
     '<div style="display:flex;flex-direction:column;gap:8px;">'+
     fld('Название компании','b_name',b.name)+
     fld('Адрес','b_address',b.address)+
     fld('Город / индекс','b_city',b.city)+
     '<div style="display:flex;gap:6px;">'+
       '<div style="flex:1;"><label class="lbl" style="margin-bottom:3px;display:block;">PIB</label>'+inp('b_pib',b.pib)+'</div>'+
       '<div style="flex:1;"><label class="lbl" style="margin-bottom:3px;display:block;">Matični broj</label>'+inp('b_mb',b.mb)+'</div>'+
     '</div></div>'+
     '<div class="hint" style="margin-top:5px;">Подтягиваются из данных партнёра, если заполнены.</div></div>';
  h+='</div>';
  h+='<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:14px;align-items:flex-end;">'+
     '<div><div class="lbl" style="margin-bottom:4px;">Номер</div>'+inp('number',d.number,'120px')+'</div>'+
     '<div><div class="lbl" style="margin-bottom:4px;">Дата документа</div>'+inp('dateRacuna',d.dateRacuna,'150px','date')+'</div>'+
     '<div><div class="lbl" style="margin-bottom:4px;">Дата промета</div>'+inp('datePromet',d.datePromet,'150px','date')+'</div>'+
     (isPay?'<div><div class="lbl" style="margin-bottom:4px;">Отсрочка, дней</div>'+inp('dospeceDays',d.dospeceDays||'','110px','number')+'</div>'+
            '<div><div class="lbl" style="margin-bottom:4px;">Срок оплаты</div>'+inp('dospece',d.dospece,'150px','date')+'</div>'+
            '<div><div class="lbl" style="margin-bottom:4px;">Poziv na broj</div>'+inp('poziv',d.poziv,'120px')+'</div>':'')+
     '</div>';
  // позиции
  h+='<div class="lbl" style="margin:16px 0 6px;">Позиции</div>';
  h+='<div style="overflow:auto;"><table style="width:100%;border-collapse:collapse;font-size:12.5px;min-width:640px;">'+
     '<tr style="text-align:left;color:var(--muted);"><th style="padding:4px;">Šifra</th><th style="padding:4px;">Naziv</th><th style="padding:4px;width:62px;">Кол-во</th><th style="padding:4px;width:90px;">Cena sa PDV</th><th style="padding:4px;width:58px;">PDV %</th><th style="padding:4px;width:62px;">Popust %</th><th style="padding:4px;text-align:right;">Vrednost</th><th></th></tr>';
  d.items.forEach(function(r,i){
    h+='<tr data-row="'+i+'">'+
       '<td style="padding:3px;"><input class="inp" data-di="'+i+'" data-f="sifra" value="'+dgEsc(r.sifra)+'" style="width:60px;font-size:12.5px;padding:5px;"></td>'+
       '<td style="padding:3px;"><input class="inp" data-di="'+i+'" data-f="naziv" value="'+dgEsc(r.naziv)+'" style="width:100%;min-width:150px;font-size:12.5px;padding:5px;"></td>'+
       '<td style="padding:3px;"><input class="inp" data-di="'+i+'" data-f="qty" type="number" value="'+dgEsc(r.qty)+'" style="width:58px;font-size:12.5px;padding:5px;"></td>'+
       '<td style="padding:3px;"><input class="inp" data-di="'+i+'" data-f="price" type="number" value="'+dgEsc(r.price)+'" style="width:84px;font-size:12.5px;padding:5px;"></td>'+
       '<td style="padding:3px;"><input class="inp" data-di="'+i+'" data-f="pdv" type="number" value="'+dgEsc(r.pdv)+'" style="width:52px;font-size:12.5px;padding:5px;"></td>'+
       '<td style="padding:3px;"><input class="inp" data-di="'+i+'" data-f="popust" type="number" value="'+dgEsc(r.popust)+'" style="width:56px;font-size:12.5px;padding:5px;"></td>'+
       '<td style="padding:3px;text-align:right;white-space:nowrap;"><b id="dg-vred-'+i+'"></b></td>'+
       '<td style="padding:3px;"><button class="btn btn-line btn-sm danger dg-del" data-i="'+i+'">✕</button></td></tr>';
  });
  h+='</table></div>';
  h+='<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;"><button class="btn btn-line btn-sm dg-add">+ Позиция</button><button class="btn btn-line btn-sm dg-deliv">+ Доставка</button></div>';
  // итоги
  h+='<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:10px;font-size:13.5px;max-width:380px;margin-left:auto;">'+
     '<div style="display:flex;justify-content:space-between;padding:2px 0;"><span>Ukupno bez PDV</span><b id="dg-bez"></b></div>'+
     '<div style="display:flex;justify-content:space-between;padding:2px 0;color:var(--muted);"><span>Popust</span><span id="dg-pop"></span></div>'+
     '<div id="dg-pdvrows"></div>'+
     '<div style="display:flex;justify-content:space-between;padding:6px 0 0;font-weight:800;font-size:15px;border-top:1px solid var(--line);margin-top:5px;"><span>Za plaćanje</span><span id="dg-zap"></span></div></div>';
  document.getElementById('docGenBody').innerHTML=h;
  // футер
  document.getElementById('docGenFoot').innerHTML=
    '<button class="btn btn-primary dg-download">⬇ Скачать PDF</button>'+
    '<button class="btn btn-primary dg-attach">📎 Прикрепить к заказу</button>'+
    '<button class="btn btn-line btn-sm dg-saveparty">Запомнить реквизиты партнёра</button>'+
    '<button class="btn btn-line btn-sm dg-saveseller">Сохранить реквизиты компании</button>';
  dgBind();dgRecalc();
}
function dgBind(){
  var body=document.getElementById('docGenBody'),foot=document.getElementById('docGenFoot');
  if(!body._dgBound){body._dgBound=true;
    body.addEventListener('input',function(e){var t=e.target;
      if(t.dataset.dg){var f=t.dataset.dg;
        if(f.indexOf('s_')===0)dgState.seller[f.slice(2)]=t.value;
        else if(f.indexOf('b_')===0)dgState.buyer[f.slice(2)]=t.value;
        else dgState[f]=t.value;
        if(f==='dospeceDays'||f==='dateRacuna')dgApplyDelay();
        return;}
      if(t.dataset.di!=null){var i=+t.dataset.di,f2=t.dataset.f;dgState.items[i][f2]=t.value;dgRecalc();}
    });
  }
  body.querySelectorAll('.dg-del').forEach(function(b){b.addEventListener('click',function(){dgState.items.splice(+this.dataset.i,1);dgRenderForm();});});
  body.querySelector('.dg-add').addEventListener('click',function(){dgState.items.push({sifra:'',naziv:'',qty:1,price:0,pdv:10,popust:0});dgRenderForm();});
  body.querySelector('.dg-deliv').addEventListener('click',function(){dgState.items.push({sifra:'',naziv:'Dostava',qty:1,price:350,pdv:20,popust:0});dgRenderForm();});
  foot.querySelector('.dg-download').addEventListener('click',dgDownload);
  foot.querySelector('.dg-attach').addEventListener('click',dgAttach);
  foot.querySelector('.dg-saveparty').addEventListener('click',dgSaveParty);
  foot.querySelector('.dg-saveseller').addEventListener('click',dgSaveSeller);
}
function dgApplyDelay(){
  var days=parseInt(dgState.dospeceDays,10);
  if(isNaN(days)||!dgState.dateRacuna)return;
  var dt=new Date(dgState.dateRacuna+'T00:00:00');if(isNaN(dt.getTime()))return;
  dt.setDate(dt.getDate()+days);
  var iso=dt.toISOString().slice(0,10);
  dgState.dospece=iso;
  var el=document.querySelector('[data-dg="dospece"]');if(el)el.value=iso;
}
function dgComputeTotals(){
  var bez=0,pop=0,byRate={};
  dgState.items.forEach(function(r){
    var price=Number(r.price)||0,qty=Number(r.qty)||0,pdv=Number(r.pdv)||0,p=Number(r.popust)||0;
    var bezUnit=price/(1+pdv/100),full=qty*bezUnit,net=full*(1-p/100);
    net=Math.round(net*100)/100;var pdvAmt=Math.round(net*pdv)/100;
    bez+=net;pop+=full*p/100;byRate[pdv]=(byRate[pdv]||0)+pdvAmt;r._vred=net;
  });
  var pdvTotal=0;Object.keys(byRate).forEach(function(k){byRate[k]=Math.round(byRate[k]*100)/100;pdvTotal+=byRate[k];});
  bez=Math.round(bez*100)/100;pop=Math.round(pop*100)/100;
  return {bez:bez,pop:pop,byRate:byRate,pdvTotal:pdvTotal,zap:Math.round((bez+pdvTotal)*100)/100};
}
function dgRecalc(){
  var t=dgComputeTotals();
  dgState.items.forEach(function(r,i){var el=document.getElementById('dg-vred-'+i);if(el)el.textContent=fmtRs(r._vred)+' ';});
  var bz=document.getElementById('dg-bez');if(bz)bz.textContent=fmtRs(t.bez)+' RSD';
  var pp=document.getElementById('dg-pop');if(pp)pp.textContent='−'+fmtRs(t.pop)+' RSD';
  var pr=document.getElementById('dg-pdvrows');if(pr){var hh='';Object.keys(t.byRate).map(Number).sort(function(a,b){return a-b;}).forEach(function(rt){hh+='<div style="display:flex;justify-content:space-between;padding:2px 0;color:var(--muted);"><span>PDV '+rt+'%</span><span>'+fmtRs(t.byRate[rt])+' RSD</span></div>';});pr.innerHTML=hh;}
  var zp=document.getElementById('dg-zap');if(zp)zp.textContent=fmtRs(t.zap)+' RSD';
}
function dgBuildHTML(){
  var d=dgState,s=d.seller,b=d.buyer,t=dgComputeTotals(),isPay=(d.kind==='predracun'||d.kind==='faktura');
  var title=DOC_KIND[d.kind].sr;
  var rows='';
  d.items.forEach(function(r){
    var price=Number(r.price)||0,pdv=Number(r.pdv)||0,bezUnit=price/(1+pdv/100);
    rows+='<tr>'+
      '<td>'+(r.sifra?'('+dgEsc(r.sifra)+') ':'')+dgEsc(r.naziv)+'</td>'+
      '<td class="r">'+fmtRs(r.qty,0)+'</td>'+
      '<td class="r">'+fmtRs(bezUnit)+'</td>'+
      '<td class="r">'+fmtRs(pdv,0)+'%</td>'+
      '<td class="r">'+fmtRs(price)+'</td>'+
      '<td class="r">'+(Number(r.popust)||0)+'%</td>'+
      '<td class="r">'+fmtRs(r._vred)+'</td></tr>';
  });
  var pdvLines='';Object.keys(t.byRate).map(Number).sort(function(a,b){return a-b;}).forEach(function(rt){pdvLines+='<div class="trow"><span>PDV '+rt+'% na osnovicu</span><span>'+fmtRs(t.byRate[rt])+' RSD</span></div>';});
  var pay=isPay
    ?('<div class="note">Plaćanje na tekući račun <b>'+dgEsc(s.tr)+'</b>'+(d.poziv?', poziv na broj <b>'+dgEsc(d.poziv)+'</b>':'')+'.<br>Redovnim plaćanjem održavate dobru reputaciju i pomažete u stvaranju zdravih uslova za razvoj privrede u Srbiji.<br>Zahvaljujemo Vam se na poverenju i radujemo se daljoj saradnji!</div>'+
      '<div class="sign"><div>POTPIS:</div><div class="line"></div></div>')
    :('<div class="sign two"><div><div>Izdao / POTPIS:</div><div class="line"></div></div><div><div>Primio / POTPIS:</div><div class="line"></div></div></div>');
  return '<div class="doc">'+
    '<div class="dhead"><div class="seller"><img class="dlogo" src="'+BV_DOC_LOGO_PNG+'" alt=""><div><b>'+dgEsc(s.name)+'</b><br>'+dgEsc(s.address)+'<br>'+dgEsc(s.city)+
      '<br>MB: '+dgEsc(s.mb)+' · PIB: '+dgEsc(s.pib)+'<br>TR: '+dgEsc(s.tr)+'</div></div>'+
      '<div class="dtitle">'+title+'<div class="dno">Br: '+dgEsc(d.number)+'</div></div></div>'+
    '<div class="buyer"><div class="lbl2">Kupac</div><b>'+dgEsc(b.name)+'</b><br>'+(b.address?dgEsc(b.address)+'<br>':'')+(b.city?dgEsc(b.city)+'<br>':'')+
      'PIB: '+dgEsc(b.pib)+' · MB: '+dgEsc(b.mb)+'</div>'+
    '<div class="meta"><span>Datum: <b>'+dgFmtDate(d.dateRacuna)+'</b></span><span>Datum prometa: <b>'+dgFmtDate(d.datePromet)+'</b></span>'+(isPay?'<span>Rok plaćanja: <b>'+dgFmtDate(d.dospece)+'</b></span>':'')+'</div>'+
    '<table class="items"><tr><th>Vrsta robe / usluga</th><th class="r">Količina</th><th class="r">Cena bez PDV</th><th class="r">PDV</th><th class="r">Cena sa PDV</th><th class="r">Popust</th><th class="r">Vrednost</th></tr>'+rows+'</table>'+
    '<div class="totals"><div class="trow"><span>Ukupno bez PDV (popust uračunat)</span><span>'+fmtRs(t.bez)+' RSD</span></div>'+
      '<div class="trow muted"><span>Popust ukupno</span><span>−'+fmtRs(t.pop)+' RSD</span></div>'+pdvLines+
      '<div class="trow grand"><span>Za plaćanje</span><span>'+fmtRs(t.zap)+' RSD</span></div></div>'+
    pay+
    '</div>';
}
function dgPdfCss(){return '<style>'+
  '*{box-sizing:border-box;} .doc{font-family:"Wix Madefor Text","Helvetica Neue",Arial,sans-serif;color:#1D1D1B;padding:34px 36px;width:760px;background:#fff;font-size:13px;line-height:1.5;}'+
  '.dhead{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #47A2DA;padding-bottom:12px;}'+
  '.seller{font-size:12px;line-height:1.55;max-width:60%;display:flex;gap:12px;align-items:flex-start;} .dlogo{width:96px;height:auto;object-fit:contain;flex-shrink:0;} .dtitle{text-align:right;font-size:24px;font-weight:800;letter-spacing:.04em;color:#1D1D1B;} .dno{font-size:13px;font-weight:600;color:#47A2DA;margin-top:4px;}'+
  '.buyer{margin-top:14px;font-size:12.5px;line-height:1.55;} .lbl2{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#9a9789;margin-bottom:2px;}'+
  '.meta{display:flex;gap:22px;flex-wrap:wrap;margin:12px 0 6px;font-size:12px;color:#444;}'+
  'table.items{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px;} table.items th{background:#47A2DA;color:#fff;font-weight:600;padding:7px 8px;text-align:left;} table.items td{padding:6px 8px;border-bottom:1px solid #e6e3d6;} .items .r{text-align:right;white-space:nowrap;}'+
  '.totals{margin:14px 0 0;margin-left:auto;width:340px;} .trow{display:flex;justify-content:space-between;padding:3px 0;font-size:12.5px;} .trow.muted{color:#888;} .trow.grand{font-weight:800;font-size:15px;border-top:2px solid #1D1D1B;margin-top:5px;padding-top:7px;}'+
  '.note{margin-top:16px;font-size:11.5px;color:#444;line-height:1.5;} .sign{margin-top:24px;} .sign .line{border-bottom:1px solid #1D1D1B;width:200px;margin-top:22px;} .sign.two{display:flex;justify-content:space-between;} .sign.two .line{width:180px;}'+
  '.foot{margin-top:20px;font-size:10px;color:#999;border-top:1px solid #e6e3d6;padding-top:8px;}'+
  '</style>';}
function dgRenderPdf(returnB64,cb){
  if(!window.html2canvas||!(window.jspdf&&window.jspdf.jsPDF)){toast('Не загрузились библиотеки PDF — обновите страницу');return;}
  var holder=document.createElement('div');
  holder.style.cssText='position:fixed;left:-9999px;top:0;width:760px;background:#fff;';
  holder.innerHTML=dgPdfCss()+dgBuildHTML();
  document.body.appendChild(holder);
  var node=holder.querySelector('.doc');
  var fin=function(){try{document.body.removeChild(holder);}catch(e){}};
  (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(function(){
    return window.html2canvas(node,{scale:3,backgroundColor:'#ffffff',useCORS:true,windowWidth:760});
  }).then(function(canvas){
    var jsPDF=window.jspdf.jsPDF,pdf=new jsPDF('p','mm','a4');
    var pw=210,ph=297,iw=pw,ih=canvas.height*iw/canvas.width;
    if(ih<=ph){pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,iw,ih);}
    else{var pxPer=canvas.width/pw,pagePx=ph*pxPer,y=0;
      while(y<canvas.height){var slice=Math.min(pagePx,canvas.height-y);var cv=document.createElement('canvas');cv.width=canvas.width;cv.height=slice;cv.getContext('2d').drawImage(canvas,0,y,canvas.width,slice,0,0,canvas.width,slice);
        if(y>0)pdf.addPage();pdf.addImage(cv.toDataURL('image/png'),'PNG',0,0,iw,slice/pxPer);y+=slice;}}
    fin();
    if(returnB64){var ds=pdf.output('datauristring');var ix=ds.indexOf('base64,');cb(ix>=0?ds.slice(ix+7):'');}
    else{pdf.save((DOC_KIND[dgState.kind].sr)+'_'+String(dgState.number).replace(/[^\w\-]/g,'')+'.pdf');}
  }).catch(function(e){fin();toast('Не удалось сформировать PDF');});
}
function dgDownload(){toast('Готовлю PDF…');dgRenderPdf(false);}
function dgAttach(){
  toast('Готовлю PDF…');
  dgRenderPdf(true,function(b64){
    if(!b64){toast('Не удалось сформировать PDF');return;}
    var fname=(DOC_KIND[dgState.kind].sr)+'_'+String(dgState.number).replace(/[^\w\-]/g,'')+'.pdf';
    cloudOrderDocUpload(dgState.orderId,dgState.kind,dgState.number,fname,'application/pdf',b64).then(function(j){
      if(j&&j.ok&&j.doc){
        var o=null;adminOrders.forEach(function(x){if(x.order_id===dgState.orderId)o=x;});if(o)o.docs=(o.docs||[]).concat([j.doc]);
        docConfig.counters=docConfig.counters||{};docConfig.counters[dgState.kind]=(docConfig.counters[dgState.kind]||0)+1;
        docConfig.parties=docConfig.parties||{};docConfig.parties[dgState.partnerId]=dgState.buyer;
        cloudPut('docConfig',docConfig);
        toast('Документ прикреплён к заказу');document.getElementById('docGenModal').style.display='none';renderAdminOrders();
      } else toast(j&&j.error==='drive'?'Нет доступа к Drive: запустите authorizeDrive и переразверните':'Не удалось прикрепить');
    }).catch(function(){toast('Ошибка соединения');});
  });
}
function dgSaveParty(){docConfig.parties=docConfig.parties||{};docConfig.parties[dgState.partnerId]=dgState.buyer;cloudPut('docConfig',docConfig);toast('Реквизиты партнёра сохранены');}
function dgSaveSeller(){docConfig.seller=dgState.seller;cloudPut('docConfig',docConfig);toast('Реквизиты компании сохранены');}
function normDate(s){
  s=String(s||'').trim();if(!s)return '';
  var m=s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(m)return m[1]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[3]).slice(-2);
  m=s.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
  if(m)return m[3]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2);
  return s;
}

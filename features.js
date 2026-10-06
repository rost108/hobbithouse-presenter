/* Hobbit House Презентер — додаткові можливості:
   меню з групами, мобільна шухляда, «Надіслати» звідусіль (системне «Поділитися» на телефоні),
   активні посилання в презентаціях, фотобанк, екран контактів з QR, база контактів, сканер QR,
   офлайн-режим (встановлення як застосунок). Завантажується після основного скрипту і викликає boot(). */
const SIGN="Hobbit House · hobbithouse.com.ua · +380 67 445 67 94 · sales@hobbithouse.com.ua";
const SITE="https://hobbithouse.com.ua", YT_CH="https://www.youtube.com/@hobbithouse";
const ICON={
 chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
 check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
 mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
 web:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
 play:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/></svg>',
 insta:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
 pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
 send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
 edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>'
};
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}};
let toastT=null;function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove("on"),2600)}
const fileName=src=>decodeURIComponent(String(src).split("/").pop().split("?")[0]);
const MIME={pdf:"application/pdf",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",mp4:"video/mp4",vcf:"text/vcard",csv:"text/csv"};
const mimeOf=src=>MIME[(fileName(src).split(".").pop()||"").toLowerCase()]||"application/octet-stream";
async function fileFrom(src){if(src instanceof File)return src;const r=await fetch(src);if(!r.ok)throw new Error(r.status);const b=await r.blob();return new File([b],fileName(src),{type:b.type||mimeOf(src)})}
function saveBlob(blob,name){const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
function copyText(t,btn){const done=()=>{if(btn){const o=btn.textContent;btn.textContent="Скопійовано";setTimeout(()=>btn.textContent=o,1500)}else toast("Скопійовано")};
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done).catch(()=>{const ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");done()}catch(e){}ta.remove()});
 else{const ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");done()}catch(e){}ta.remove()}}

/* ================= «Надіслати»: один діалог для всього ================= */
function openShare(o){
 /* o: {title, text, files:[шлях або File], subject, email} */
 $("#sdTitle").textContent=o.title||"Hobbit House";$("#sdText").value=o.text||"";$("#sdEmail").value=o.email||"";$("#sdPdf").hidden=true;
 const fl=o.files||[];const can=!!navigator.share;
 $("#sdHint").innerHTML=fl.length?`<b>Файли (${fl.length}):</b> `+fl.map(f=>f instanceof File?esc(f.name):`<a href="${f}" target="_blank" rel="noopener">${esc(fileName(f))}</a>`).join(" · ")+(can?"":"<br>На цьому пристрої системного «Поділитися» немає: відкрийте лист і вкладіть файли або надішліть посилання."):"";
 const sh=$("#sdShare"),ml=$("#sdMail");sh.hidden=!can;sh.textContent=fl.length?"Поділитися з файлами…":"Поділитися…";
 sh.classList.toggle("primary",can);ml.classList.toggle("primary",!can);
 let files=null;if(can&&fl.length)Promise.all(fl.map(fileFrom)).then(f=>files=f).catch(()=>files=[]);
 sh.onclick=async()=>{const text=$("#sdText").value;try{if(files===null)files=await Promise.all(fl.map(fileFrom)).catch(()=>[]);
   if(files.length&&navigator.canShare&&navigator.canShare({files}))await navigator.share({title:o.title,text,files});
   else{if(fl.length&&!files.length)toast("Файли не вдалося підготувати — надсилаю текст");await navigator.share({title:o.title,text})}
   sd.classList.remove("open")}catch(e){if(e&&e.name!=="AbortError")toast("Не вдалося поділитися: "+(e.message||e.name))}};
 ml.onclick=()=>{location.href=`mailto:${encodeURIComponent($("#sdEmail").value.trim())}?subject=${encodeURIComponent(o.subject||"Hobbit House")}&body=${encodeURIComponent($("#sdText").value)}`};
 $("#sdCopy").onclick=()=>copyText($("#sdText").value,$("#sdCopy"));
 sd.classList.add("open");
}
function greet(body,lang){return lang==="EN"?`Hello,\n\n${body}\n\nBest regards,\n${SIGN}`:`Добрий день!\n\n${body}\n\nЗ повагою,\n${SIGN}`}
/* презентації: той самий діалог, текст листа — з основного скрипту */
openSend=function(x){openShare({title:x.title,text:mailText(x),files:[x.pdf],subject:x.lang==="EN"?"Hobbit House — presentation":"Hobbit House — презентація"})};
$("#sd").style.zIndex=78;

/* ================= меню: групи, що розгортаються ================= */
const NAVKEY="hh.nav.open";
buildNav=function(){
 screens=$$(".screen");nav.innerHTML="";const open=new Set(store.get(NAVKEY,["Початок","Інструменти","Про нас"]));
 const groups=[];screens.forEach((s,i)=>{const g=s.dataset.group||"";let G=groups[groups.length-1];if(!G||G.name!==g){G={name:g,items:[]};groups.push(G)}G.items.push(i)});
 groups.forEach(G=>{const el=document.createElement("div");el.className="ng"+(open.has(G.name)?" open":"")+(G.items.length===1?" single":"");el.dataset.g=G.name;
  el.innerHTML=`<button class="gh" aria-expanded="${open.has(G.name)}">${ICON.chev}<span>${esc(G.name)}</span><span class="c">${G.items.length}</span></button><div class="gl"><div></div></div>`;
  const list=el.querySelector(".gl>div");
  G.items.forEach(i=>{const s=screens[i];const b=document.createElement("button");b.dataset.i=i;b.innerHTML=`<span class="n">${String(i+1).padStart(2,"0")}</span>${esc(s.dataset.title)}`;if(s.dataset.internal)b.classList.add("internal");b.onclick=()=>{go(i);document.body.classList.remove("drawer")};list.appendChild(b)});
  el.querySelector(".gh").onclick=()=>{const on=!el.classList.contains("open");el.classList.toggle("open",on);el.querySelector(".gh").setAttribute("aria-expanded",on);const st=new Set(store.get(NAVKEY,[]));on?st.add(G.name):st.delete(G.name);store.set(NAVKEY,[...st])};
  nav.appendChild(el)});
};
function navMark(i){$$("#nav [data-i]").forEach(b=>b.setAttribute("aria-current",+b.dataset.i===i));
 $$("#nav .ng").forEach(g=>{const has=!!g.querySelector(`[data-i="${i}"]`);g.classList.toggle("has-cur",has);if(has&&!g.classList.contains("open")){g.classList.add("open");g.querySelector(".gh").setAttribute("aria-expanded",true)}});
 const b=$(`#nav [data-i="${i}"]`);if(b)setTimeout(()=>b.scrollIntoView({block:"nearest"}),320)}
$("#menuBtn").onclick=()=>document.body.classList.toggle("drawer");$("#scrim").onclick=()=>document.body.classList.remove("drawer");

/* ================= показ презентацій: активні посилання ================= */
const ytId=u=>{const m=String(u).match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([\w-]{11})/);return m?m[1]:null};
const pvDims={};
function pvLinks(){const box=$("#pvlinks");if(!pvS){box.innerHTML="";return}
 const arr=(((window.HH_PRES_LINKS||{})[pvS.slug])||{})[pvI+1]||[];
 box.innerHTML=arr.map(l=>{const id=ytId(l[4]);const loc=id&&D.YT[id];return `<a href="${esc(l[4])}" target="_blank" rel="noopener" ${loc?`data-ytl="${id}"`:""} title="${esc(loc?"Відео (локально): "+vt(id):l[4])}" style="left:${l[0]*100}%;top:${l[1]*100}%;width:${l[2]*100}%;height:${l[3]*100}%"></a>`}).join("");
 box.querySelectorAll("[data-ytl]").forEach(a=>a.onclick=e=>{e.preventDefault();const id=a.dataset.ytl;openVideo(`media/yt/${id}.mp4`,vt(id),`Локальний файл. Посилання для клієнта: <a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">youtube.com/watch?v=${id}</a>`)});
 $("#pvLinkInfo").textContent=arr.length?(arr.length===1?"1 посилання на слайді":arr.length+" посилань на слайді"):"";
 box.classList.remove("hint");if(arr.length){void box.offsetWidth;box.classList.add("hint")}
 pvLayout()}
function pvLayout(){if(!pvS)return;const box=$("#pvlinks"),st=$("#pvstage");const d=pvDims[pvS.slug];
 if(!d){const im=new Image();im.onload=()=>{pvDims[pvS.slug]=[im.naturalWidth,im.naturalHeight];pvLayout()};im.src=pvSrc(0);return}
 const sw=st.clientWidth,sh=st.clientHeight,k=Math.min(sw/d[0],sh/d[1]),w=d[0]*k,h=d[1]*k;
 Object.assign(box.style,{left:(sw-w)/2+"px",top:(sh-h)/2+"px",width:w+"px",height:h+"px"})}
{const _pvShow=pvShow;pvShow=function(d){_pvShow(d);pvLinks()}}
window.addEventListener("resize",()=>{if(pv.classList.contains("open"))pvLayout()});
document.addEventListener("fullscreenchange",()=>setTimeout(pvLayout,60));

/* ================= лайтбокс і відео: «Надіслати» ================= */
bindLb=function(root){root.querySelectorAll("[data-lb]").forEach(b=>b.onclick=e=>{e.preventDefault();openLb(b.dataset.lb,b.dataset.cap||"",b.dataset.np||(b.querySelector(".np")?"1":""))})};
function openLb(src,cap,np){lb.querySelector("img").src=src;lb.querySelector("figcaption").textContent=cap;lb.dataset.src=src;lb.dataset.cap=cap;lb.dataset.np=np||"";
 const b=$("#lbSend");b.disabled=!!np;b.textContent=np?"Не для розсилки":"Надіслати";b.style.opacity=np?.5:1;lb.classList.add("open")}
$("#lbSend").onclick=e=>{e.stopPropagation();if(lb.dataset.np)return;const cap=lb.dataset.cap||"зображення";openShare({title:cap,text:greet(`Надсилаю ${cap.charAt(0).toLowerCase()+cap.slice(1)}.`),files:[lb.dataset.src],subject:"Hobbit House — "+cap})};
let vpCur=null;{const _ov=openVideo;openVideo=function(src,title,sub){const m=String(src).match(/media\/yt\/([\w-]{11})\.mp4/);vpCur={src,title,id:m?m[1]:null};_ov(src,title,sub)}}
$("#vpSend").onclick=e=>{e.stopPropagation();if(!vpCur)return;const link=vpCur.id?`https://www.youtube.com/watch?v=${vpCur.id}`:"";
 openShare({title:vpCur.title,text:greet(`Надсилаю відео «${vpCur.title}».${link?"\n"+link:""}`),files:[vpCur.src],subject:"Hobbit House — відео"})};

/* ================= фотобанк ================= */
const PB={type:"all",obj:"all",sel:new Set(),data:null};
const KP_PHOTOS=[["media/photo-exterior-trees.jpg","Фортеця 2,25 після монтажу"],["media/photo-interior.jpg","Інтер'єр укриття"],["media/photo-field.jpg","Два укриття поруч"],["media/render-fortecya.jpg","Візуалізація «Фортеці»","","render"],["media/drawing-arch-section.jpg","Розріз арки","","draw"],["media/photo-entrance-city.jpg","Вхідний тамбур","упізнаваний будинок"],["media/photo-art-parking.jpg","Арт-оформлення","упізнане місце"]];
function pbBuild(){const objs=[];const add=(key,name,items)=>{const seen=new Set();items=items.filter(x=>x.src&&!seen.has(x.src)&&seen.add(x.src));if(items.length)objs.push({key,name,items})};
 D.MODELS.forEach(m=>add("m-"+m.id,m.name,[...m.photos.map(p=>({src:p[0],t:"photo",np:p[1]||"",cap:m.name})),...m.renders.filter(r=>!/\.gif$/i.test(r)).map(r=>({src:r,t:"render",cap:"Візуалізація "+m.name})),...m.drawings.map(r=>({src:r,t:"draw",cap:"Креслення "+m.name}))]));
 add("projects","Реалізовані проєкти",D.PROJECTS.flatMap(p=>p.imgs.map(s=>({src:s,t:"photo",cap:p.title}))));
 add("kp","Фото й креслення з КП №629",KP_PHOTOS.map(x=>({src:x[0],cap:x[1],np:x[2]||"",t:x[3]||"photo"})));
 PB.data=objs}
const PBT={all:"Усе",photo:"Фото",render:"Візуалізації",draw:"Креслення"};
function pbRender(){if(!PB.data)pbBuild();const objs=PB.data;const fit=x=>PB.type==="all"||x.t===PB.type;
 $("#pbType").innerHTML=Object.entries(PBT).map(([k,v])=>`<button aria-pressed="${PB.type===k}" data-t="${k}">${v}<span class="c">${objs.reduce((a,o)=>a+o.items.filter(x=>k==="all"||x.t===k).length,0)}</span></button>`).join("");
 $("#pbObj").innerHTML=`<button aria-pressed="${PB.obj==="all"}" data-o="all">Усі споруди</button>`+objs.filter(o=>o.items.some(fit)).map(o=>`<button aria-pressed="${PB.obj===o.key}" data-o="${o.key}">${esc(o.name)}<span class="c">${o.items.filter(fit).length}</span></button>`).join("");
 const show=objs.filter(o=>(PB.obj==="all"||o.key===PB.obj)&&o.items.some(fit));
 $("#pbOut").innerHTML=show.map(o=>`<div class="pbgroup"><h3>${esc(o.name)}</h3><span class="c">${o.items.filter(fit).length}</span>${o.key.startsWith("m-")?`<button class="btn sm" data-go="${o.key}" style="margin-left:auto">Картка моделі</button>`:""}</div><div class="pbgrid">${o.items.filter(fit).map(x=>`<figure class="${x.t==="draw"?"draw":""} ${PB.sel.has(x.src)?"sel":""}" data-src="${esc(x.src)}"><img src="${esc(x.src)}" alt="${esc(x.cap)}" loading="lazy" data-cap="${esc(x.cap)}" data-np="${esc(x.np)}"><div class="tg"><span>${x.t==="photo"?"фото":x.t==="render"?"візуалізація":"креслення"}</span>${x.np?`<span class="np">не для розсилки</span>`:""}</div>${x.np?"":`<button class="pick" aria-label="Вибрати">${ICON.check}</button>`}</figure>`).join("")}</div>`).join("")||"<p class='muted'>Немає зображень цього типу.</p>";
 $$("#pbType button").forEach(b=>b.onclick=()=>{PB.type=b.dataset.t;pbRender()});$$("#pbObj button").forEach(b=>b.onclick=()=>{PB.obj=b.dataset.o;pbRender()});
 $$("#pbOut figure img").forEach(im=>im.onclick=()=>openLb(im.getAttribute("src"),im.dataset.cap,im.dataset.np));
 $$("#pbOut .pick").forEach(b=>b.onclick=e=>{e.stopPropagation();const f=b.closest("figure"),s=f.dataset.src;PB.sel.has(s)?PB.sel.delete(s):PB.sel.add(s);f.classList.toggle("sel",PB.sel.has(s));pbSelBar()});
 bindGo($("#pbOut"));pbSelBar()}
function pbSelBar(){const n=PB.sel.size;$("#pbSel").hidden=!n;$("#pbCount").textContent=n+" "+(n===1?"кадр":n<5?"кадри":"кадрів")}
$("#pbClear").onclick=()=>{PB.sel.clear();pbRender()};
$("#pbSend").onclick=()=>{const files=[...PB.sel];openShare({title:`Фото Hobbit House (${files.length})`,text:greet(`Надсилаю фото і візуалізації наших укриттів (${files.length}).\nБільше — на сайті ${SITE}`),files,subject:"Hobbit House — фото укриттів"})};

/* ================= контакти і QR ================= */
qrcode.stringToBytes=qrcode.stringToBytesFuncs["UTF-8"];
function qrSvg(text,dark="#101213",light="#FFFFFF"){const q=qrcode(0,"M");q.addData(text);q.make();const n=q.getModuleCount(),m=2;let d="";
 for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+=`M${c+m} ${r+m}h1v1h-1z`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n+2*m} ${n+2*m}" shape-rendering="crispEdges" role="img" aria-label="QR-код"><rect width="100%" height="100%" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`}
const VCARD=["BEGIN:VCARD","VERSION:3.0","N:;Hobbit House;;;","FN:Hobbit House","ORG:ТОВ «Хоббіт хаус»","TITLE:Відділ продажу","TEL;TYPE=WORK,VOICE:+380674456794","EMAIL;TYPE=WORK:sales@hobbithouse.com.ua","URL:https://hobbithouse.com.ua","NOTE:Залізобетонні укриття «Фортеця» і «Хоббіт». Перевірено війною. Підтверджено інженерами.","END:VCARD"].join("\r\n");
const QRS={site:{t:"Сайт",data:SITE,cap:"hobbithouse.com.ua",sub:"Наведіть камеру телефона"},card:{t:"Візитка",data:VCARD,cap:"Hobbit House",sub:"Контакт компанії збережеться в телефоні"},yt:{t:"YouTube",data:YT_CH,cap:"Відео випробувань",sub:"youtube.com/@hobbithouse"}};
let qrCur="site";
function renderContacts(){
 const L=[["phone","Телефон відділу продажу","+380 67 445 67 94","tel:+380674456794"],["mail","Email","sales@hobbithouse.com.ua","mailto:sales@hobbithouse.com.ua"],["web","Сайт","hobbithouse.com.ua",SITE],["play","YouTube","@hobbithouse",YT_CH],["insta","Instagram","hobbithouse.shelter","https://www.instagram.com/hobbithouse.shelter/"],["pin","Пошта для листів","02072, Київ, а/с 10",""]];
 $("#clist").innerHTML=L.map(x=>`<${x[3]?`a href="${x[3]}" ${x[3].startsWith("http")?'target="_blank" rel="noopener"':""}`:"div"} class="clink"><span class="ic">${ICON[x[0]]}</span><span><span class="k">${x[1]}</span><br><span class="v">${x[2]}</span></span></${x[3]?"a":"div"}>`).join("")+`<div class="card" style="margin-top:6px"><span class="eyebrow">Реквізити</span><p class="mono small" style="margin-top:6px">ТОВ «Хоббіт хаус» · ЄДРПОУ 44894815</p></div>`;
 $("#qrTabs").innerHTML=Object.entries(QRS).map(([k,v])=>`<button aria-pressed="${k===qrCur}" data-q="${k}">${v.t}</button>`).join("");
 $$("#qrTabs button").forEach(b=>b.onclick=()=>{qrCur=b.dataset.q;renderContacts()});
 const q=QRS[qrCur];$("#qrBox").innerHTML=qrSvg(q.data);$("#qrCap").textContent=q.cap;$("#qrSub").textContent=q.sub}
$("#qrFullBtn").onclick=()=>{const q=QRS[qrCur],f=$("#qrfull");f.querySelector(".qr").innerHTML=qrSvg(q.data);f.querySelector(".cap").textContent=q.cap;f.classList.add("open")};
$("#qrfull").onclick=()=>$("#qrfull").classList.remove("open");
$("#vcfBtn").onclick=()=>{const f=new File([VCARD],"Hobbit-House.vcf",{type:"text/vcard"});if(navigator.canShare&&navigator.canShare({files:[f]}))navigator.share({files:[f],title:"Hobbit House"}).catch(()=>{});else saveBlob(f,"Hobbit-House.vcf")};

/* ================= база контактів ================= */
const CRMKEY="hh.crm.v1";let crmEdit=null;
const crmAll=()=>store.get(CRMKEY,[]);
function crmSave(list){if(!store.set(CRMKEY,list))toast("Не вдалося зберегти: пам'ять браузера недоступна");crmBadge()}
function crmBadge(){const n=crmAll().length;$("#crmBadge").textContent=n?String(n):""}
const CF=["name","company","title","seg","phone","email","interest","source","need","next","note"];
function crmOpen(view){const d=$("#crm");d.classList.add("open");$("#crmForm").hidden=view!=="form";$("#crmList").hidden=view==="form";if(view!=="form")crmRows()}
function crmForm(c,prefill){crmEdit=c?c.id:null;$("#crmFormTitle").textContent=c?"Редагувати контакт":"Новий контакт";
 const sel=$("#cf_interest");if(!sel.options.length)sel.innerHTML=`<option value="">—</option><option>Підбір під кількість людей</option>${D.MODELS.map(m=>`<option>${esc(m.name)}</option>`).join("")}<option>Кілька споруд / проєкт</option><option>Інше</option>`;
 const v=Object.assign({},c||{},prefill||{});CF.forEach(k=>{const el=$("#cf_"+k);if(k==="interest"&&v[k]&&![...el.options].some(o=>o.value===v[k]))el.add(new Option(v[k]));el.value=v[k]||(k==="source"?"Зустріч":"")});
 $("#cfDel").hidden=!c;crmOpen("form");setTimeout(()=>$("#cf_name").focus(),50)}
$("#cfSave").onclick=()=>{const v={};CF.forEach(k=>v[k]=$("#cf_"+k).value.trim());if(!v.name&&!v.company&&!v.phone&&!v.email){toast("Вкажіть хоча б ім'я, компанію або телефон");return}
 const list=crmAll();if(crmEdit){const i=list.findIndex(x=>x.id===crmEdit);if(i>=0)list[i]=Object.assign(list[i],v,{updated:new Date().toISOString()})}else list.unshift(Object.assign({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),created:new Date().toISOString()},v));
 crmSave(list);toast(crmEdit?"Контакт оновлено":"Контакт збережено");crmEdit=null;crmOpen("list")};
$("#cfCancel").onclick=()=>{crmEdit=null;crmOpen("list")};
$("#cfDel").onclick=()=>{if(!crmEdit||!confirm("Видалити контакт з бази на цьому пристрої?"))return;crmSave(crmAll().filter(x=>x.id!==crmEdit));crmEdit=null;crmOpen("list")};
$("#cfScan").onclick=()=>openScanner(true);
$("#crmQ").oninput=()=>crmRows();
function crmRows(){const q=$("#crmQ").value.trim().toLowerCase();const all=crmAll();$("#crmCount").textContent=all.length?"· "+all.length:"";
 const list=all.filter(c=>!q||CF.map(k=>c[k]||"").join(" ").toLowerCase().includes(q));
 $("#crmRows").innerHTML=list.map(c=>{const ini=(c.name||c.company||"?").split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase();const d=new Date(c.created);
  return `<div class="crow" data-id="${c.id}"><span class="av">${esc(ini)}</span><span class="m"><b>${esc(c.name||c.company||c.phone)}</b><span>${esc([c.company&&c.name?c.company:"",c.title,c.seg,c.interest].filter(Boolean).join(" · "))}</span><br><span class="mono" style="font-size:11.5px">${d.toLocaleDateString("uk-UA")} · ${esc(c.source||"")}${c.next?" · наступний крок "+new Date(c.next).toLocaleDateString("uk-UA"):""}</span></span><span class="a">${c.phone?`<a class="ibtn" href="tel:${esc(c.phone.replace(/[^\d+]/g,""))}" title="Подзвонити">${ICON.phone}</a>`:""}<button class="ibtn" data-send title="Надіслати матеріали">${ICON.send}</button><button class="ibtn" data-edit title="Редагувати">${ICON.edit}</button></span></div>`}).join("")||`<p class="muted" style="padding:14px 0">${all.length?"Нічого не знайдено.":"Ще немає контактів. Натисніть «+ Новий» або відскануйте QR-візитку."}</p>`;
 $$("#crmRows .crow").forEach(r=>{const c=all.find(x=>x.id===r.dataset.id);r.querySelector("[data-edit]").onclick=()=>crmForm(c);r.querySelector(".m").onclick=()=>crmForm(c);
  r.querySelector("[data-send]").onclick=()=>openShare({title:"Матеріали для "+(c.name||c.company),email:c.email,subject:"Hobbit House — матеріали",text:greet(`Дякую за розмову${c.name?", "+c.name.split(" ")[0]:""}. Як домовлялися, надсилаю матеріали про залізобетонні укриття «Фортеця від Hobbit House».${c.interest?"\nВас цікавило: "+c.interest+".":""}\n\nКаталог моделей: ${SITE}/shelters\nВідео випробувань: ${YT_CH}\n\nРозкажіть про майданчик і кількість людей, і інженер підготує комерційну пропозицію.`)})})}
const csvCell=v=>`"${String(v==null?"":v).replace(/"/g,'""')}"`;
$("#crmExport").onclick=()=>{const all=crmAll();if(!all.length){toast("База порожня");return}
 const head=["Дата","Ім'я","Компанія","Посада","Сегмент","Телефон","Email","Цікавить","Потреба","Джерело","Наступний крок","Нотатка"];
 const rows=all.map(c=>[new Date(c.created).toLocaleString("uk-UA"),c.name,c.company,c.title,c.seg,c.phone,c.email,c.interest,c.need,c.source,c.next,c.note]);
 const csv="﻿"+[head,...rows].map(r=>r.map(csvCell).join(",")).join("\r\n");const name=`hobbit-house-kontakty-${new Date().toISOString().slice(0,10)}.csv`;const f=new File([csv],name,{type:"text/csv"});
 if(navigator.canShare&&navigator.canShare({files:[f]}))navigator.share({files:[f],title:"Контакти Hobbit House"}).catch(e=>{if(e.name!=="AbortError")saveBlob(f,name)});else saveBlob(f,name)};

/* ================= сканер QR ================= */
let scan={stream:null,raf:0,det:null,toForm:false,busy:false};
function loadJsQR(){return window.jsQR?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement("script");s.src="media/lib/jsQR.js";s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
async function decodeFrom(src){/* src: video або bitmap */
 if(scan.det){try{const r=await scan.det.detect(src);if(r&&r.length)return r[0].rawValue}catch(e){}}
 await loadJsQR();const c=document.createElement("canvas");const w=src.videoWidth||src.width,h=src.videoHeight||src.height;if(!w||!h)return null;const k=Math.min(1,1000/Math.max(w,h));c.width=w*k|0;c.height=h*k|0;const x=c.getContext("2d",{willReadFrequently:true});x.drawImage(src,0,0,c.width,c.height);
 const d=x.getImageData(0,0,c.width,c.height);const r=window.jsQR(d.data,c.width,c.height,{inversionAttempts:"attemptBoth"});return r?r.data:null}
async function openScanner(toForm){scan.toForm=!!toForm;$("#qrs").classList.add("open");$("#scanMsg").textContent="Наведіть камеру на QR-код візитки.";
 if(!scan.det&&"BarcodeDetector" in window){try{const f=await BarcodeDetector.getSupportedFormats();if(f.includes("qr_code"))scan.det=new BarcodeDetector({formats:["qr_code"]})}catch(e){}}
 if(!scan.det)loadJsQR().catch(()=>{});
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){$("#scanMsg").textContent="Камера тут недоступна (потрібен https або встановлений застосунок). Натисніть «Із фото» і сфотографуйте QR.";return}
 try{scan.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280}},audio:false});const v=$("#scanVid");v.srcObject=scan.stream;await v.play();scanLoop()}
 catch(e){$("#scanMsg").textContent="Немає доступу до камери ("+(e.name||"помилка")+"). Дозвольте камеру в налаштуваннях браузера або натисніть «Із фото»."}}
function scanLoop(){const v=$("#scanVid");let last=0;const tick=async t=>{if(!scan.stream)return;if(t-last>180&&!scan.busy&&v.readyState>=2){last=t;scan.busy=true;try{const r=await decodeFrom(v);if(r){scanDone(r);return}}catch(e){}scan.busy=false}scan.raf=requestAnimationFrame(tick)};scan.raf=requestAnimationFrame(tick)}
function stopScan(){cancelAnimationFrame(scan.raf);if(scan.stream)scan.stream.getTracks().forEach(t=>t.stop());scan.stream=null;scan.busy=false;const v=$("#scanVid");v.srcObject=null}
function closeScanner(){stopScan();$("#qrs").classList.remove("open")}
$("#scanFile").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;$("#scanMsg").textContent="Читаю фото…";
 try{const bmp=await createImageBitmap(f);const r=await decodeFrom(bmp);if(r)scanDone(r);else $("#scanMsg").textContent="QR-код на фото не знайдено. Спробуйте ближче й рівніше."}catch(err){$("#scanMsg").textContent="Не вдалося прочитати фото."}};
function unesc(v){return String(v||"").replace(/\\n/gi,"\n").replace(/\\([,;\\])/g,"$1").trim()}
function parseQR(t){const o={source:"QR-візитка"};t=String(t).trim();
 if(/^BEGIN:VCARD/i.test(t)){const lines=t.replace(/\r\n[ \t]/g,"").replace(/\n[ \t]/g,"").split(/\r?\n/);const notes=[];
  lines.forEach(l=>{const i=l.indexOf(":");if(i<0)return;const key=l.slice(0,i).split(";")[0].replace(/^item\d+\./i,"").toUpperCase(),val=l.slice(i+1);
   if(key==="FN")o.name=unesc(val);else if(key==="N"&&!o.name){const p=val.split(";").map(unesc);o.name=[p[1],p[2],p[0]].filter(Boolean).join(" ")}
   else if(key==="ORG")o.company=unesc(val.split(";")[0]);else if(key==="TITLE"||key==="ROLE")o.title=o.title||unesc(val);else if(key==="TEL")o.phone=o.phone||unesc(val).replace(/^tel:/i,"");
   else if(key==="EMAIL")o.email=o.email||unesc(val);else if(key==="URL")notes.push(unesc(val));else if(key==="NOTE")notes.push(unesc(val));else if(key==="ADR")notes.push(unesc(val.split(";").filter(Boolean).join(", ")))});
  o.note=notes.join("\n")}
 else if(/^MECARD:/i.test(t)){const body=t.replace(/^MECARD:/i,"");const notes=[];body.split(/;(?=[A-Z]+:)/).forEach(p=>{const i=p.indexOf(":");if(i<0)return;const k=p.slice(0,i).toUpperCase(),v=unesc(p.slice(i+1).replace(/;+$/,""));
   if(k==="N")o.name=v.includes(",")?v.split(",").reverse().join(" ").trim():v;else if(k==="TEL")o.phone=o.phone||v;else if(k==="EMAIL")o.email=o.email||v;else if(k==="ORG")o.company=v;else if(k==="TITLE")o.title=v;else if(v)notes.push(v)});o.note=notes.join("\n")}
 else if(/^mailto:/i.test(t))o.email=decodeURIComponent(t.replace(/^mailto:/i,"").split("?")[0]);
 else if(/^tel:/i.test(t))o.phone=t.replace(/^tel:/i,"");
 else if(/^MATMSG:/i.test(t)){const m=t.match(/TO:([^;]+)/i);if(m)o.email=m[1]}
 else{o.note=t;if(/linkedin\.com/i.test(t))o.source="LinkedIn"}
 return o}
function scanDone(text){stopScan();$("#qrs").classList.remove("open");const o=parseQR(text);
 if(navigator.vibrate)try{navigator.vibrate(60)}catch(e){}
 if(scan.toForm&&!$("#crmForm").hidden){CF.forEach(k=>{if(o[k]&&!$("#cf_"+k).value)$("#cf_"+k).value=o[k]});if(o.note&&!$("#cf_note").value.includes(o.note))$("#cf_note").value=($("#cf_note").value?$("#cf_note").value+"\n":"")+o.note;toast("Дані з QR додано у форму")}
 else{crmForm(null,o);toast(o.name||o.phone||o.email?"Перевірте дані і збережіть контакт":"QR прочитано: текст у нотатці")}}

/* ================= дії з кнопок (меню, нижня панель) ================= */
document.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act;document.body.classList.remove("drawer");
 if(a==="crm-new")crmForm(null);else if(a==="crm")crmOpen("list");else if(a==="scan")openScanner(false);else if(a==="offline")openOffline();else if(a==="client"){toggleClient();$("#mClient").textContent=client?"Режим менеджера":"Показ клієнту"}});
$$(".dlg").forEach(d=>{d.addEventListener("click",e=>{if(e.target===d||e.target.closest("[data-close]")){if(d.id==="qrs")closeScanner();else d.classList.remove("open")}})});
document.addEventListener("keydown",e=>{const openDlg=$(".dlg.open");if($("#qrfull").classList.contains("open")){if(e.key==="Escape")$("#qrfull").classList.remove("open");e.stopImmediatePropagation();return}
 if(document.body.classList.contains("drawer")&&e.key==="Escape"){document.body.classList.remove("drawer");e.stopImmediatePropagation();return}
 if(openDlg&&!$("#sd").classList.contains("open")){if(e.key==="Escape"){if(openDlg.id==="qrs")closeScanner();else openDlg.classList.remove("open")}e.stopImmediatePropagation()}},true);

/* ================= «Надіслати» на картках моделей, документах, файлах ================= */
function modelText(m){return greet(`Надсилаю посилання на укриття «${m.name}» на нашому сайті:\n${m.url}\n\nТам опис, фото, креслення і характеристики. Назвіть кількість людей і майданчик, і інженер підготує комерційну пропозицію.`)}
function addSendButtons(){
 D.MODELS.forEach(m=>{const sec=$("#m-"+m.id);if(!sec)return;const acts=sec.querySelector(".mspec .acts");if(!acts||acts.querySelector("[data-msend]"))return;const b=document.createElement("button");b.className="btn";b.dataset.msend="1";b.textContent="Надіслати";
  b.onclick=()=>openShare({title:m.name,text:modelText(m),files:[],subject:"Hobbit House — "+m.name});acts.appendChild(b)});
 /* сертифікати й документи не надсилаються: лише показ */
 $$("#send .docs a").forEach(a=>{const href=a.getAttribute("href");if(a.querySelector("[data-fsend]"))return;const t=a.querySelector(".t").textContent;const b=document.createElement("button");b.className="btn sm";b.dataset.fsend="1";b.textContent="Надіслати";b.style.marginTop="10px";
  b.onclick=e=>{e.preventDefault();e.stopPropagation();const local=!/^https?:/.test(href);openShare({title:t,text:greet(local?`Надсилаю: ${t}.`:`${t}: ${href}`),files:local?[href]:[],subject:"Hobbit House — "+t})};a.querySelector("div:last-child").appendChild(document.createElement("br"));a.querySelector("div:last-child").appendChild(b)});
}

/* ================= офлайн-режим і встановлення ================= */
const CACHE_MEDIA="hh-media-v1";let installEvt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e});
const isHttp=/^https?:$/.test(location.protocol);
if(isHttp&&"serviceWorker" in navigator){const hadSW=!!navigator.serviceWorker.controller;let reloaded=false;
 navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).then(r=>r.update()).catch(()=>{});
 /* нова версія застосунку встановилась — один раз перезавантажити, щоб показати її */
 navigator.serviceWorker.addEventListener("controllerchange",()=>{if(hadSW&&!reloaded){reloaded=true;location.reload()}})}
const mb=n=>(n/1048576).toLocaleString("uk-UA",{maximumFractionDigits:0})+" МБ";
async function cachedSet(){if(!("caches" in window))return new Set();const out=new Set();for(const n of await caches.keys()){const c=await caches.open(n);(await c.keys()).forEach(r=>out.add(new URL(r.url).pathname))}return out}
async function openOffline(){const d=$("#off"),b=$("#offBody");d.classList.add("open");
 const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone;
 if(!isHttp){b.innerHTML=`<p>Зараз застосунок відкрито як файл з папки: усе вже лежить на цьому комп'ютері й працює без інтернету, включно з відео.</p><p class="small muted" style="margin-top:10px">Щоб поставити його на телефон чи планшет як застосунок (іконка на екрані, повний офлайн, «Поділитися», камера для QR), відкрийте його з https-адреси, де розміщена папка sales-hub, і натисніть тут «Встановити». Інструкція — у README.</p>`;return}
 const A=window.HH_ASSETS||[];const total=A.reduce((a,x)=>a+x[1],0),noVid=A.filter(x=>!/\.mp4$/i.test(x[0]));
 b.innerHTML=`<p>${standalone?"Застосунок встановлено.":"Встановіть застосунок на головний екран: працюватиме як окрема програма."}</p>
  <div class="row" style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">${!standalone?`<button class="btn primary" id="offInstall">Встановити застосунок</button>`:""}<button class="btn ${standalone?"primary":""}" id="offAll">Завантажити все для офлайну · ${mb(total)}</button><button class="btn" id="offLite">Без відео · ${mb(noVid.reduce((a,x)=>a+x[1],0))}</button></div>
  <div class="progress"><i id="offBar"></i></div><p class="small muted" id="offMsg" style="margin-top:8px">Перевіряю, що вже збережено…</p>
  <p class="small muted" style="margin-top:12px">iPhone / iPad: Safari → «Поділитися» → «На екран Додому». Android: меню браузера → «Встановити застосунок».</p>`;
 const ib=$("#offInstall");if(ib)ib.onclick=async()=>{if(installEvt){installEvt.prompt();await installEvt.userChoice.catch(()=>{});installEvt=null}else toast("Скористайтеся меню браузера: «Встановити» або «На екран Додому»")};
 const have=await cachedSet();const base=new URL(".",location.href).pathname;const got=A.filter(x=>have.has(base+x[0]));
 $("#offMsg").textContent=`Збережено ${got.length} з ${A.length} файлів (${mb(got.reduce((a,x)=>a+x[1],0))} з ${mb(total)}).`;$("#offBar").style.width=(A.length?got.length/A.length*100:0)+"%";
 const run=async list=>{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});const c=await caches.open(CACHE_MEDIA);let done=0,bytes=0,fail=0;const todo=list.filter(x=>!have.has(base+x[0]));
  for(const x of todo){try{const r=await fetch(x[0],{cache:"no-store"});if(r.ok&&r.status===200){await c.put(x[0],r);have.add(base+x[0])}else fail++}catch(e){fail++}done++;bytes+=x[1];$("#offBar").style.width=(done/todo.length*100)+"%";$("#offMsg").textContent=`Завантажено ${done} з ${todo.length} · ${mb(bytes)}${fail?` · помилок ${fail}`:""}`}
  $("#offMsg").textContent=fail?`Готово з помилками (${fail}). Повторіть, коли буде стабільний інтернет.`:"Готово: усе збережено на пристрої й відкривається без інтернету."};
 $("#offAll").onclick=()=>run(A);$("#offLite").onclick=()=>run(noVid)}

/* ================= старт ================= */
boot();
/* військові креслення: лише показ */
function renderMilitary(g){const M=window.HH_MILITARY||[];if(!$("#milGrid"))return;const groups=["Усі",...new Set(M.map(x=>x.group))];g=g||"Усі";
 $("#milTabs").innerHTML=groups.length>2?groups.map(x=>`<button aria-pressed="${x===g}" data-g="${esc(x)}">${esc(x)}<span class="c">${x==="Усі"?M.length:M.filter(y=>y.group===x).length}</span></button>`).join(""):"";
 $$("#milTabs button").forEach(b=>b.onclick=()=>renderMilitary(b.dataset.g));
 $("#milGrid").innerHTML=M.filter(x=>g==="Усі"||x.group===g).map(x=>`<button data-lb="${esc(x.file)}" data-cap="${esc(x.title)}" data-np="військове креслення"><img src="${esc(x.file)}" alt="${esc(x.title)}" loading="lazy"><span class="pill np" style="background:var(--card);position:absolute;left:6px;bottom:6px">${esc(x.title)}</span></button>`).join("")||`<p class="note">Креслень ще немає. Додайте файл: python3 tools/add_military.py "файл" "Назва".</p>`;
 bindLb($("#milGrid"))}
pbRender();renderContacts();crmBadge();addSendButtons();renderMilitary();
/* відкрита версія: PDF сертифікатів не публікуються, лише зображення для показу */
if(window.HH_PUBLIC)$$('a[href*="media/docs/"][href$=".pdf"]').forEach(a=>a.remove());

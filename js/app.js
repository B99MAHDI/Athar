const $=s=>document.querySelector(s);
const ok=!/VOTRE/.test(CFG.url+CFG.key);
let A=[],tok=null,fav=[];
try{fav=JSON.parse(localStorage.getItem("athar-fav")||"[]")}catch(e){}
try{tok=sessionStorage.getItem("athar-tok")}catch(e){}
function saveFav(){try{localStorage.setItem("athar-fav",JSON.stringify(fav))}catch(e){}}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
async function api(p,o={}){
const h={apikey:CFG.key,"Content-Type":"application/json",...(o.h||{})};
if(o.auth&&tok)h.Authorization="Bearer "+tok;
const r=await fetch(CFG.url+p,{method:o.m||"GET",headers:h,body:o.b?JSON.stringify(o.b):undefined});
if(!r.ok){const e=new Error("HTTP "+r.status);e.s=r.status;throw e}
return r.status===204?null:r.json()}
function mapUrl(a){const l=String(a.location||"").trim();if(/^https:\/\//i.test(l))return esc(l);return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent((l?l+", ":"")+a.city)}
function mapLabel(a){const l=String(a.location||"").trim();return !l?a.city:/^https:\/\//i.test(l)?"Voir sur la carte, "+a.city:l}
function box(t){return `<div class="empty" style="grid-column:1/-1">${t}</div>`}
function opts(sel,key,all){const cur=sel.value;sel.innerHTML=`<option value="">${all}</option>`;[...new Set(A.map(a=>a[key]))].sort().forEach(x=>{const o=document.createElement("option");o.value=o.textContent=x;sel.appendChild(o)});sel.value=[...sel.options].some(o=>o.value===cur)?cur:""}
function filters(){opts($("#fm"),"craft","Tous les métiers");opts($("#fv"),"city","Toutes les villes")}
function render(){
const q=$("#q").value.toLowerCase(),m=$("#fm").value,v=$("#fv").value,f=$("#ff").value;
const r=A.filter(a=>(!m||a.craft===m)&&(!v||a.city===v)&&(!f||fav.includes(a.id))&&(!q||(a.name+a.description+a.craft).toLowerCase().includes(q)));
$("#list").innerHTML=r.length?r.map(a=>{const on=fav.includes(a.id);return `<article class="card"><button class="fav" data-id="${a.id}" aria-pressed="${on}" aria-label="${on?"Retirer":"Ajouter"} ${esc(a.name)} des favoris">${on?"♥":"♡"}</button>${a.photo?`<img class="ph" src="${esc(a.photo)}" alt="">`:`<div class="avatar">${esc(a.name[0])}</div>`}<h3>${esc(a.name)}</h3><span class="chip">${esc(a.craft)}</span><span class="chip">${esc(a.city)}</span><p class="note" style="color:var(--ink)">${esc(a.description)}</p>${a.phone?`<p class="ct"><a href="tel:${esc(String(a.phone).replace(/[^\d+]/g,""))}">📞 ${esc(a.phone)}</a></p>`:""}<p class="ct"><a href="${mapUrl(a)}" target="_blank" rel="noopener">📍 ${esc(mapLabel(a))}</a></p>${tok?`<button class="btn-del" data-del="${a.id}" data-n="${esc(a.name)}" type="button">Supprimer ce profil</button>`:""}</article>`}).join(""):box(A.length?"Aucun profil ne correspond. Modifiez vos filtres.":"Aucun artisan pour le moment.")}
async function load(){
if(!ok){$("#list").innerHTML=box("Base de données non configurée : renseignez l’adresse et la clé publique dans index.html.");return}
$("#list").innerHTML=box("Chargement…");
try{A=await api("/rest/v1/artisans?select=*&order=created_at.desc");filters();render()}catch(e){$("#list").innerHTML=box("Impossible de charger les artisans. Vérifiez votre connexion et réessayez.")}}
["#q","#fm","#fv","#ff"].forEach(s=>$(s).addEventListener("input",render));
function adminUI(){$("#login").hidden=!!tok;$("#adm").hidden=!tok}
function logout(){tok=null;try{sessionStorage.removeItem("athar-tok")}catch(e){}adminUI();render()}
function fail(e,el){if(e.s===401||e.s===403){logout();el.textContent="Session expirée ou droits insuffisants : reconnectez-vous."}else el.textContent="Échec de l’opération. Réessayez."}
$("#list").addEventListener("click",async e=>{
const d=e.target.closest(".btn-del");
if(d){if(!confirm("Supprimer "+d.dataset.n+" ?"))return;try{await api("/rest/v1/artisans?id=eq."+encodeURIComponent(d.dataset.del),{m:"DELETE",auth:true});await load()}catch(x){fail(x,{})}return}
const b=e.target.closest(".fav");if(!b)return;const id=Number(b.dataset.id);
fav=fav.includes(id)?fav.filter(x=>x!==id):[...fav,id];saveFav();render()});
$("#lgo").addEventListener("click",async()=>{
const el=$("#lerr");
if(!ok){el.textContent="Base de données non configurée.";return}
try{const r=await fetch(CFG.url+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:CFG.key,"Content-Type":"application/json"},body:JSON.stringify({email:$("#le").value.trim(),password:$("#lp").value})});
const j=await r.json();if(!r.ok||!j.access_token)throw 0;
tok=j.access_token;try{sessionStorage.setItem("athar-tok",tok)}catch(x){}
$("#lp").value="";el.textContent="";adminUI();render()}catch(x){el.textContent="Connexion impossible : vérifiez l’email et le mot de passe."}});
$("#lout").addEventListener("click",logout);
function shrink(f){return new Promise(res=>{if(!f)return res("");const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,240/Math.max(i.width,i.height)),c=document.createElement("canvas");c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);c.getContext("2d").drawImage(i,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",.8))};i.onerror=()=>res("");i.src=r.result};r.onerror=()=>res("");r.readAsDataURL(f)})}
$("#aadd").addEventListener("click",async()=>{
const name=$("#an").value.trim(),craft=$("#am").value.trim(),city=$("#av").value.trim(),description=$("#ad").value.trim(),phone=$("#at").value.trim(),location=$("#al").value.trim(),el=$("#aerr");
if(!name||!craft||!city){el.textContent="Renseignez le nom, le métier et la ville.";return}
if(phone&&!/^\+?[\d\s().-]{6,20}$/.test(phone)){el.textContent="Numéro de téléphone invalide (chiffres, espaces, + ou -).";return}
if(location.length>300){el.textContent="La localisation est trop longue.";return}
el.textContent="Enregistrement…";
try{const photo=await shrink($("#ap").files[0]);
await api("/rest/v1/artisans",{m:"POST",auth:true,h:{Prefer:"return=minimal"},b:{name,craft,city,description,photo,phone,location}});
["#an","#am","#av","#ad","#ap","#at","#al"].forEach(s=>$(s).value="");el.textContent="";await load();location.hash="#artisans"}catch(x){fail(x,el)}});
const views=["accueil","artisans","actions","equipe","contact","admin"];
function route(){
const h=(location.hash||"#accueil").slice(1);const id=views.includes(h)?h:"accueil";
views.forEach(x=>{$("#"+x).hidden=x!==id});
document.querySelectorAll("nav a").forEach(a=>a.getAttribute("href")==="#"+id?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current"));
window.scrollTo(0,0)}
window.addEventListener("hashchange",route);
$("#send").addEventListener("click",()=>{
if(!$("#n").value.trim()||!$("#m").value.trim()){$("#err").textContent="Renseignez votre nom et votre message.";return}
$("#err").textContent="";$("#formbox").hidden=true;$("#done").hidden=false});
adminUI();route();load();

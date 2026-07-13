const POINTS=[
 {code:"",name:"Schleuse Holtenau",km:97.5},
 {code:"SB",name:"Schwartenbek",km:92.2},
 {code:"GN",name:"Groß Nordsee",km:85.0,gn:true},
 {code:"KO",name:"Königsförde",km:79.8},
 {code:"RA",name:"Rade",km:70.6},
 {code:"AU",name:"Audorf",km:66.3},
 {code:"SCH",name:"Schülp",km:57.3},
 {code:"RÜ",name:"Rüsterbergen – Lotsen- und Kanalsteuererwechsel",km:55.0,rue:true},
 {code:"BR",name:"Breiholz",km:48.5},
 {code:"OL",name:"Oldenbüttel",km:40.6},
 {code:"FI",name:"Fischerhütte",km:34.8},
 {code:"DÜ",name:"Dückerswisch",km:21.5,du:true},
 {code:"KU",name:"Kudensee",km:9.2},
 {code:"",name:"Schleuse Brunsbüttel",km:0.0}
];
let east=POINTS.map(()=>({min:null,fixed:false}));
let west=POINTS.map(()=>({min:null,fixed:false}));
const rueIndex=POINTS.findIndex(p=>p.rue),duIndex=POINTS.findIndex(p=>p.du),gnIndex=POINTS.findIndex(p=>p.gn);
const $=id=>document.getElementById(id);
function parseHHMM(v){const s=String(v||"").replace(/\D/g,"").slice(0,4);if(s.length!==4)return null;const h=+s.slice(0,2),m=+s.slice(2);return h<24&&m<60?h*60+m:null}
function fmtColon(m){if(m==null)return"";m=((Math.round(m)%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0")}
function fmtRaw(m){return fmtColon(m).replace(":","")}
function fmtDiff(m){m=Math.abs(Math.round(m));return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0")}
function state(dir){return dir==="E"?east:west}
function speed(dir){return Math.max(.1,+$(dir==="E"?"speedEast":"speedWest").value||6.5)}
function route(dir){const a=POINTS.map((_,i)=>i);return dir==="E"?a.reverse():a}
function leg(a,b,k){return Math.abs(POINTS[a].km-POINTS[b].km)/1.852/k*60}
function unwrap(t,r){while(t<r)t+=1440;return t}
function shortest(a,b){let d=a-b;while(d>720)d-=1440;while(d<=-720)d+=1440;return d}
function recalc(dir){const s=state(dir),r=route(dir),k=speed(dir),anchors=r.filter(i=>s[i].fixed&&s[i].min!=null);if(!anchors.length){render();save();return}
 for(let a=0;a<anchors.length-1;a++){const ia=anchors[a],ib=anchors[a+1],pa=r.indexOf(ia),pb=r.indexOf(ib),ta=s[ia].min,tb=unwrap(s[ib].min,ta);let total=0,acc=0;for(let p=pa;p<pb;p++)total+=leg(r[p],r[p+1],k);for(let p=pa+1;p<pb;p++){acc+=leg(r[p-1],r[p],k);if(!s[r[p]].fixed)s[r[p]].min=ta+(tb-ta)*acc/total}}
 const first=anchors[0],fp=r.indexOf(first);for(let p=fp-1;p>=0;p--){const i=r[p],n=r[p+1];if(!s[i].fixed)s[i].min=s[n].min-leg(i,n,k)}
 const last=anchors[anchors.length-1],lp=r.indexOf(last);for(let p=lp+1;p<r.length;p++){const i=r[p],pr=r[p-1];if(!s[i].fixed)s[i].min=s[pr].min+leg(pr,i,k)}
 render();save()}
function names(){return{e:($("shipEast").value||"OSTSCHIFF").trim().toUpperCase(),w:($("shipWest").value||"WESTSCHIFF").trim().toUpperCase()}}
function setCard(prefix,status){const card=$(prefix+"Card");card.className="status-card "+status.cls;$(prefix+"Main").textContent=status.main;$(prefix+"Detail").textContent=status.detail;$(prefix+"Extra").textContent=status.extra}
function statusRue(){const e=east[rueIndex].min,w=west[rueIndex].min,n=names();if(e==null||w==null)return{cls:"neutral",main:"NOCH KEINE BEWERTUNG",detail:"Beide Rüsterbergen-Zeiten eingeben.",extra:""};const limit=Math.max(0,+$("rueLimit").value||15),d=shortest(e,w);if(d>=limit)return{cls:"green",main:"🟢 WECHSEL MÖGLICH",detail:`${n.w} +${fmtDiff(d)} vor ${n.e}`,extra:`Reserve: ${Math.round(d)} Minuten`};if(d>0)return{cls:"yellow",main:"🟡 WECHSEL KNAPP",detail:`${n.w} +${fmtDiff(d)} vor ${n.e}`,extra:`Reserve: ${Math.round(d)} Minuten`};if(d===0)return{cls:"red",main:"🔴 WECHSEL NICHT MÖGLICH",detail:"Beide Schiffe gleichzeitig in Rüsterbergen",extra:"Reserve: 0 Minuten"};return{cls:"red",main:"🔴 WECHSEL NICHT MÖGLICH",detail:`${n.e} +${fmtDiff(d)} vor ${n.w}`,extra:`${n.w} kommt ${Math.abs(Math.round(d))} Minuten zu spät`}}
function statusDu(){const e=east[duIndex].min,w=west[duIndex].min,n=names();if(e==null||w==null)return{cls:"neutral",main:"NOCH KEINE BEWERTUNG",detail:"Beide Dückerswisch-Zeiten eingeben.",extra:""};const d=shortest(w,e);return d>0?{cls:"yellow",main:"🟡 OSTSCHIFF WARTET",detail:`${n.e} wartet ${fmtDiff(d)} h:min auf ${n.w}`,extra:`Freigabe: ${fmtColon(w)}`}:{cls:"green",main:"🟢 OST FREI",detail:`${n.w} ist ${fmtDiff(d)} h:min vorher durch`,extra:`${n.e} darf um ${fmtColon(e)} laufen`}}
function statusGn(){const e=east[gnIndex].min,w=west[gnIndex].min,n=names();if(e==null||w==null)return{cls:"neutral",main:"NOCH KEINE BEWERTUNG",detail:"Beide Groß-Nordsee-Zeiten eingeben.",extra:""};const d=shortest(e,w);return d>0?{cls:"yellow",main:"🟡 WESTSCHIFF WARTET",detail:`${n.w} wartet ${fmtDiff(d)} h:min auf ${n.e}`,extra:`Freigabe: ${fmtColon(e)}`}:{cls:"green",main:"🟢 WEST FREI",detail:`${n.e} ist ${fmtDiff(d)} h:min vorher durch`,extra:`${n.w} darf um ${fmtColon(w)} laufen`}}
function bindTime(el){el.addEventListener("focus",e=>{const d=e.target.dataset.dir,i=+e.target.dataset.index;e.target.value=fmtRaw(state(d)[i].min);e.target.select()});el.addEventListener("input",e=>e.target.value=e.target.value.replace(/\D/g,"").slice(0,4));el.addEventListener("blur",e=>{const d=e.target.dataset.dir,i=+e.target.dataset.index,s=state(d),v=parseHHMM(e.target.value);s[i]=v==null?{min:null,fixed:false}:{min:v,fixed:true};recalc(d)});el.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();e.target.blur()}})}
function render(){setCard("rue",statusRue());setCard("du",statusDu());setCard("gn",statusGn());$("rueCard").classList.toggle("hidden",!$("showRue").checked);$("duCard").classList.toggle("hidden",!$("showDu").checked);$("gnCard").classList.toggle("hidden",!$("showGn").checked);
 const body=$("scheduleBody"),mobile=$("mobileSchedule");body.innerHTML="";mobile.innerHTML="";POINTS.forEach((p,i)=>{const label=p.code?`<b>${p.code}</b> – ${p.name}`:`<b>${p.name}</b>`;const tr=document.createElement("tr");if(p.rue)tr.classList.add("rue-row");tr.innerHTML=`<td class="km">${p.km.toFixed(1).replace(".",",")}</td><td class="place">${label}</td><td class="${east[i].fixed?"fixed-cell":"calc-cell"}"><input class="time-input" data-dir="E" data-index="${i}" value="${fmtColon(east[i].min)}"></td><td class="status-cell">${east[i].fixed?"Fixpunkt":east[i].min!=null?"berechnet":""}</td><td class="${west[i].fixed?"fixed-cell":"calc-cell"}"><input class="time-input" data-dir="W" data-index="${i}" value="${fmtColon(west[i].min)}"></td><td class="status-cell">${west[i].fixed?"Fixpunkt":west[i].min!=null?"berechnet":""}</td>`;body.appendChild(tr);
 const mr=document.createElement("div");mr.className="mobile-row"+(p.rue?" rue":"");mr.innerHTML=`<div>${label}</div><input class="time-input" data-dir="E" data-index="${i}" value="${fmtColon(east[i].min)}"><input class="time-input" data-dir="W" data-index="${i}" value="${fmtColon(west[i].min)}">`;mobile.appendChild(mr)});document.querySelectorAll(".time-input").forEach(bindTime)}
function clearDir(dir){const s=state(dir);s.forEach((_,i)=>s[i]={min:null,fixed:false});render();save()}
function save(){localStorage.setItem("nokNavigatorV1",JSON.stringify({east,west,shipEast:$("shipEast").value,shipWest:$("shipWest").value,speedEast:$("speedEast").value,speedWest:$("speedWest").value,rueLimit:$("rueLimit").value,showRue:$("showRue").checked,showDu:$("showDu").checked,showGn:$("showGn").checked}))}
function load(){try{const x=JSON.parse(localStorage.getItem("nokNavigatorV1")||"null");if(x){east=x.east||east;west=x.west||west;$("shipEast").value=x.shipEast||"";$("shipWest").value=x.shipWest||"";$("speedEast").value=x.speedEast||"6.5";$("speedWest").value=x.speedWest||"6.5";$("rueLimit").value=x.rueLimit||"15";$("showRue").checked=x.showRue!==false;$("showDu").checked=x.showDu!==false;$("showGn").checked=x.showGn!==false}}catch(e){console.warn(e)}}
$("speedEast").addEventListener("change",()=>recalc("E"));$("speedWest").addEventListener("change",()=>recalc("W"));$("rueLimit").addEventListener("input",()=>{render();save()});["showRue","showDu","showGn"].forEach(id=>$(id).addEventListener("change",()=>{render();save()}));["shipEast","shipWest"].forEach(id=>$(id).addEventListener("input",()=>{$(id).value=$(id).value.toUpperCase();render();save()}));$("clearEast").addEventListener("click",()=>clearDir("E"));$("clearWest").addEventListener("click",()=>clearDir("W"));$("unlockAll").addEventListener("click",()=>{east.forEach(x=>x.fixed=false);west.forEach(x=>x.fixed=false);render();save()});$("resetAll").addEventListener("click",()=>{localStorage.removeItem("nokNavigatorV1");location.reload()});load();render();

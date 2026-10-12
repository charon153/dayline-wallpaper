/* Dayline browser editor + Wallpaper Engine property adapter. */
"use strict";
const M=window.Dayline, $=id=>document.getElementById(id), STORE="dayline.state.v1", PREFS="dayline.prefs.v1";
let data=M.demo(), isDemo=true, viewMonday=M.monday(M.now().date), paused=false, lastMinute="", lastProperty="", wallpaperHost=false;
let prefs={theme:"light",opacity:.88,room:true,clock:true}, storageError="";
function inputCapableUrlMode(){
  // Wallpaper Engine only exposes keyboard focus for wallpapers opened from a URL.
  // Keep imported/file projects in the defensive no-focus mode that avoids the CEF crash.
  const protocol=window.location && window.location.protocol ? String(window.location.protocol).toLowerCase() : "file:";
  return protocol==="http:" || protocol==="https:";
}
try {
  const stored=JSON.parse(localStorage.getItem(STORE) || "null");
  if(stored){data=M.normalize(stored.data);isDemo=stored.demo===true;lastProperty=stored.property || "";}
  const saved=JSON.parse(localStorage.getItem(PREFS) || "{}");
  if(["light","dark"].includes(saved.theme))prefs.theme=saved.theme;
  if(Number.isFinite(saved.opacity))prefs.opacity=Math.max(.3,Math.min(1,saved.opacity));
  if(typeof saved.room==="boolean")prefs.room=saved.room;
  if(typeof saved.clock==="boolean")prefs.clock=saved.clock;
}catch(e){storageError="本机保存的数据无法读取，当前显示演示。可重新导入日程。";}
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const weekNames=["周一","周二","周三","周四","周五","周六","周日"];
function error(id,message){$(id).textContent=message;$(id).hidden=!message;}
function persist(next=data,demo=isDemo,property=lastProperty){
  // Persist first, then commit. A quota failure must not replace the visible data.
  localStorage.setItem(STORE,JSON.stringify({data:next,demo,property}));
  data=next;isDemo=demo;lastProperty=property;
}
function preferences(){
  document.documentElement.dataset.theme=prefs.theme;
  document.documentElement.style.setProperty("--panel-opacity",prefs.opacity);
  $("clock").hidden=!prefs.clock;
  $("theme-select").value=prefs.theme;$("panel-opacity").value=prefs.opacity;
  $("show-room").checked=prefs.room;$("show-clock").checked=prefs.clock;
  try{localStorage.setItem(PREFS,JSON.stringify(prefs));}catch(e){error("import-error","显示设置无法保存，请导出日程备份。");}
}
function renderNext(){
  const next=M.nextItems(data)[0];
  $("next-item").innerHTML=next?`<span class="time">${next.active?"进行中":next.date===M.now().date?"今天":next.date} · ${esc(next.label)}</span><h3>${esc(next.name)}</h3><p>${esc(next.kind==="course"?[prefs.room?next.room:"",next.units].filter(Boolean).join(" · "):next.note || "自定义事项")}</p><span class="status">${next.active?"正在进行":next.kind==="course"?"课程":"事项"}</span>`:`<h3>留一点空白</h3><p>未来七天没有后续安排。</p>`;
}
function render(){
  const current=M.now(), dates=Array.from({length:7},(_,i)=>M.addDays(viewMonday,i));
  const week=M.weekOf(data,viewMonday);
  $("week-label").textContent=`${week>0?`第 ${week} 周`:"学期前"} · ${viewMonday.slice(5).replace("-",".")} — ${dates[6].slice(5).replace("-",".")}`;
  $("source-label").textContent=isDemo?"演示数据":"个人日程 · 本机";
  $("source-label").title=data.semesterName;
  $("semester-start").value=data.semesterStart;
  $("day-heads").innerHTML=dates.map((date,i)=>`<div class="day-head${date===current.date?" today":""}"><strong>${weekNames[i]}</strong><span>${Number(date.slice(5,7))}.${Number(date.slice(8))}</span></div>`).join("");
  const items=dates.map(date=>M.itemsOn(data,date)), all=items.flat();
  const periodStart=data.periods.length?M.clock(data.periods[0].start):480, periodEnd=data.periods.length?M.clock(data.periods[data.periods.length-1].end):1260;
  const start=Math.max(0,Math.floor(Math.min(periodStart,...all.map(i=>i.start))/60)*60);
  const end=Math.min(1440,Math.ceil(Math.max(periodEnd,...all.map(i=>i.point?i.start+15:i.end))/60)*60);
  const duration=Math.max(60,end-start);
  // Fit a full desktop week into the viewport; compact screens retain a scrollable axis.
  const available=Math.max(280,window.innerHeight-$("schedule-grid").getBoundingClientRect().top-205), height=window.innerWidth>1150?available:Math.max(620,available);
  const scale=height/duration;
  $("axis").style.height=height+"px";$("days").style.height=height+"px";
  $("days").style.setProperty("--hour-px",60*scale+"px");
  const labels=[];for(let t=start;t<=end;t+=60)labels.push(`<span class="axis-label" style="top:${(t-start)*scale}px">${t===1440?"24:00":M.clockText(t)}</span>`);
  $("axis").innerHTML=labels.join("");
  $("days").innerHTML=items.map((dayItems,i)=>{
    const nowLine=dates[i]===current.date && current.minute>=start && current.minute<end?`<div class="now-line" style="top:${(current.minute-start)*scale}px" aria-label="当前时间"></div>`:"";
    const cards=M.lanes(dayItems).map(item=>{
      const ongoing=dates[i]===current.date && !item.point && item.start<=current.minute && current.minute<item.end;
      const cardHeight=Math.max(25,(item.displayEnd-item.start)*scale-3);
      const detail=item.kind==="course"?prefs.room?item.room:item.units:item.point?"时间点":item.note;
      return `<button type="button" class="schedule-item ${item.kind}${item.point?" point":""}${cardHeight<50?" compact":""}${ongoing?" ongoing":""}" data-item="${esc(item.id)}" data-kind="${item.kind}" data-date="${dates[i]}" data-time-start="${M.clockText(item.start)}" data-time-end="${item.end==null?"":M.clockText(item.end)}" style="top:${(item.start-start)*scale}px;height:${cardHeight}px;left:calc(${item.lane/item.lanes*100}% + 3px);width:calc(${100/item.lanes}% - 6px)" title="${esc([item.name,item.label,detail].filter(Boolean).join(" · "))}"><strong>${esc(item.name)}</strong><small>${esc(item.label)}</small>${detail?`<small>${esc(detail)}</small>`:""}</button>`;
    }).join("");
    return `<div class="day-column${dates[i]===current.date?" today":""}" data-date="${dates[i]}">${cards}${nowLine}${!dayItems.length?'<p class="empty-day">自由安排</p>':""}</div>`;
  }).join("");
  renderNext();
}
function tick(force=false){
  if(paused)return;
  const current=M.now(), key=current.date+current.clock;
  $("clock").textContent=current.clock;
  $("date-label").textContent=`${Number(current.date.slice(5,7))}月${Number(current.date.slice(8))}日 · ${weekNames[M.weekday(current.date)-1]} · 北京时间`;
  if(force || key!==lastMinute){
    if(lastMinute && lastMinute.slice(0,10)!==current.date && viewMonday===M.monday(lastMinute.slice(0,10)))viewMonday=M.monday(current.date);
    lastMinute=key;render();
  }
}
function open(id){
  const panel=$(id); panel.hidden=false; panel.open=true;
  if(document.body && document.body.classList)document.body.classList.add("modal-open");
}
function close(id){
  const panel=$(id); panel.hidden=true; panel.open=false;
  const anyOpen=["settings-dialog","event-dialog","detail-dialog"].some(name=>!$(name).hidden);
  if(!anyOpen && document.body && document.body.classList)document.body.classList.remove("modal-open");
}
function importText(value,property){
  if(typeof value!=="string" || value.length>2000000)throw new Error("JSON 太大，最多支持 2 MB 文本");
  const next=M.normalize(JSON.parse(value));
  persist(next,false,property==null?lastProperty:property);
  viewMonday=M.monday(M.now().date);render();
}
function propertyToken(value){
  // A cache fingerprint, not the original JSON, so extra private fields are never persisted.
  let a=2166136261,b=3335557771;
  for(let i=0;i<value.length;i++){a=Math.imul(a^value.charCodeAt(i),16777619);b=Math.imul(b^value.charCodeAt(i),16777619);}
  return value.length+":"+(a>>>0).toString(16)+":"+(b>>>0).toString(16);
}
function openEvent(id){
  if(wallpaperHost){
    $("detail-title").textContent=id?"编辑事项":"添加事项";
    $("detail-content").innerHTML="<h3>请在日程表应用中编辑</h3><p>Wallpaper Engine 的网页宿主不稳定支持键盘输入。请在原日程表应用中添加或修改事项，导出全部数据后，再通过 Wallpaper Engine 右侧的「日程 JSON」属性更新。</p><p>事项的日期、开始时间和结束时间会继续显示在本壁纸中。</p>";
    open("detail-dialog");
    return;
  }
  const event=id?data.events.find(e=>e.id===id):null, range=event?M.eventRange(event,data.periods):null;
  $("event-id").value=id || "";$("event-name").value=event?event.name:"";
  $("event-date").value=event && event.date?event.date:M.now().date;
  $("event-start").value=range?M.clockText(range.start):M.now().clock;
  $("event-end").value=range && !range.point?M.clockText(range.end):"";
  $("event-repeat").value=event?event.repeat:"none";
  $("event-weekdays").hidden=$("event-repeat").value!=="custom";
  document.querySelectorAll('[name="weekdays"]').forEach(el=>{el.checked=!!(event && event.weekdays.includes(Number(el.value)));});
  $("event-delete").hidden=!event;error("event-error","");open("event-dialog");
}
function showDetails(item){
  $("detail-content").innerHTML=`<h3>${esc(item.name)}</h3><p>${esc(item.label)}</p><p>${esc(item.units)}</p>${item.room?`<p>地点 · ${esc(item.room)}</p>`:""}${item.teacher?`<p>教师 · ${esc(item.teacher)}</p>`:""}`;
  open("detail-dialog");
}
$("week-prev").onclick=()=>{viewMonday=M.addDays(viewMonday,-7);render();};
$("week-next").onclick=()=>{viewMonday=M.addDays(viewMonday,7);render();};
$("week-today").onclick=()=>{viewMonday=M.monday(M.now().date);render();};
$("settings-open").onclick=()=>{
  if(!wallpaperHost){open("settings-dialog");return;}
  $("detail-title").textContent="壁纸设置";
  $("detail-content").innerHTML="<h3>请使用 Wallpaper Engine 右侧属性</h3><p>配色、透明度、地点、时钟和「日程 JSON」均可在 Wallpaper Engine 的壁纸属性中调整。</p><p>需要键盘编辑日程时，请在原日程表应用中完成，然后重新导出并粘贴 JSON。</p>";
  open("detail-dialog");
};
$("add-open").onclick=()=>openEvent();
["settings","event","detail"].forEach(name=>{$(name+"-close").onclick=()=>close(name+"-dialog");});
$("days").onclick=e=>{
  const card=e.target.closest("[data-item]");if(!card)return;
  if(card.dataset.kind==="event")openEvent(card.dataset.item);
  else showDetails(M.itemsOn(data,card.dataset.date).find(i=>i.id===card.dataset.item));
};
$("import-apply").onclick=()=>{try{importText($("import-json").value);error("import-error","");close("settings-dialog");}catch(e){error("import-error","导入失败："+e.message);}};
$("export-data").onclick=()=>{
  $("import-json").value=JSON.stringify(data);$("import-json").focus();$("import-json").select();
  error("import-error","");$("export-hint").textContent="已生成单行 JSON。复制后可粘贴到 Wallpaper Engine 的「日程 JSON」属性，或保存为本机备份。";
};
$("semester-start").onchange=()=>{try{persist(M.normalize({...data,semesterStart:$("semester-start").value}));render();error("import-error","");}catch(e){error("import-error",e.message);}};
$("theme-select").onchange=()=>{prefs.theme=$("theme-select").value;preferences();};
$("panel-opacity").oninput=()=>{prefs.opacity=Number($("panel-opacity").value);preferences();};
$("show-room").onchange=()=>{prefs.room=$("show-room").checked;preferences();render();};
$("show-clock").onchange=()=>{prefs.clock=$("show-clock").checked;preferences();};
$("restore-demo").onclick=()=>{try{localStorage.setItem("dayline.previous.v1",JSON.stringify(data));persist(M.demo(),true);viewMonday=M.monday(M.now().date);render();error("import-error","");}catch(e){error("import-error",e.message);}};
$("event-repeat").onchange=()=>{$("event-weekdays").hidden=$("event-repeat").value!=="custom";};
$("event-form").onsubmit=e=>{
  e.preventDefault();
  try{
    const id=$("event-id").value || "e"+Date.now().toString(36)+Math.random().toString(36).slice(2,7), old=data.events.find(e=>e.id===id);
    const event={...old,id,name:$("event-name").value.trim(),date:$("event-date").value,time:$("event-start").value,endTime:$("event-end").value,
      unit:null,endUnit:null,unitAnchor:"start",repeat:$("event-repeat").value,enabled:old?old.enabled:true,
      weekdays:Array.from(document.querySelectorAll('[name="weekdays"]:checked')).map(el=>Number(el.value))};
    if(!event.name)throw new Error("请填写事项名称");
    if(!/^\d{4}-\d{2}-\d{2}$/.test(event.date))throw new Error("日期格式应为 YYYY-MM-DD");
    if(!/^\d{2}:\d{2}$/.test(event.time))throw new Error("开始时间格式应为 HH:MM");
    if(!old && !event.endTime)throw new Error("请填写结束时间");
    if(event.endTime && !/^\d{2}:\d{2}$/.test(event.endTime))throw new Error("结束时间格式应为 HH:MM");
    if(event.repeat==="custom" && !event.weekdays.length)throw new Error("请至少选择一个星期");
    const next=M.normalize({...data,events:data.events.filter(e=>e.id!==id).concat(event)});
    persist(next,isDemo);render();close("event-dialog");
  }catch(err){error("event-error",err.message);}
};
$("event-delete").onclick=()=>{try{persist({...data,events:data.events.filter(e=>e.id!==$("event-id").value)});render();close("event-dialog");}catch(e){error("event-error",e.message);}};
window.addEventListener("keydown",event=>{
  if(event.key!=="Escape")return;
  for(const id of ["detail-dialog","event-dialog","settings-dialog"]){if(!$(id).hidden){close(id);break;}}
});
// Register at global scope as required by Wallpaper Engine; updates are partial.
window.wallpaperPropertyListener={
  applyUserProperties(properties){
    wallpaperHost=!inputCapableUrlMode();
    $("add-open").textContent=wallpaperHost?"添加事项说明":"＋ 添加事项";
    $("add-open").title=wallpaperHost?"在日程表应用中添加事项后重新导入":"添加有开始和结束时间的事项";
    if(properties.theme)prefs.theme=properties.theme.value==="dark"?"dark":"light";
    if(properties.panelopacity)prefs.opacity=Math.max(.3,Math.min(1,Number(properties.panelopacity.value)/100 || .88));
    if(properties.showroom)prefs.room=Boolean(properties.showroom.value);
    if(properties.showclock)prefs.clock=Boolean(properties.showclock.value);
    if(properties.schedulejson && properties.schedulejson.value && propertyToken(String(properties.schedulejson.value))!==lastProperty){
      try{importText(properties.schedulejson.value,propertyToken(properties.schedulejson.value));error("import-error","");$("property-status").textContent="";}
      catch(e){$("property-status").textContent="日程 JSON 未导入："+e.message+"。原日程已保留。";}
    }
    preferences();tick(true);
  },
  setPaused(value){paused=Boolean(value);if(!paused)tick(true);}
};
preferences();tick(true);if(storageError)$("property-status").textContent=storageError;
setInterval(()=>tick(),10000);
let resizeTimer;window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(render,120);});

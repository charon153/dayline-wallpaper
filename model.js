/* Dayline portable data model. No network or personal defaults. */
(function (root) {
  "use strict";
  const DAY = 86400000, pad = n => String(n).padStart(2, "0");
  function dateValue(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) throw new Error("日期须为 YYYY-MM-DD");
    const [y,m,d] = s.split("-").map(Number), value = Date.UTC(y,m-1,d);
    if (new Date(value).toISOString().slice(0,10) !== s) throw new Error("日期不存在");
    return value;
  }
  function dateText(value) { return new Date(value).toISOString().slice(0,10); }
  function addDays(s,n) { return dateText(dateValue(s) + n * DAY); }
  function weekday(s) { return new Date(dateValue(s)).getUTCDay() || 7; }
  function monday(s) { return addDays(s, 1 - weekday(s)); }
  function semesterMonday(s) { return weekday(s) === 7 ? addDays(s,1) : monday(s); }
  function weekOf(data,s) { return Math.floor((dateValue(s)-dateValue(semesterMonday(data.semesterStart)))/DAY/7)+1; }
  function now(instant = new Date()) {
    const d = new Date(instant.getTime()+8*3600000);
    return { date:dateText(d.getTime()), minute:d.getUTCHours()*60+d.getUTCMinutes(), clock:`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` };
  }
  function clock(s) {
    if (!/^\d{2}:\d{2}$/.test(String(s))) return null;
    const [h,m] = s.split(":").map(Number);
    return h < 24 && m < 60 ? h*60+m : null;
  }
  function clockText(n) { return `${pad(Math.floor(n/60))}:${pad(n%60)}`; }
  function text(value, max=240) { return String(value == null ? "" : value).slice(0,max); }
  function integer(n,min,max,label) {
    if (typeof n === "boolean" || n === null || n === "" || !Number.isInteger(Number(n)) || Number(n)<min || Number(n)>max) throw new Error(label+"无效");
    return Number(n);
  }
  function list(value,label,max=1000) {
    if (!Array.isArray(value) || value.length>max) throw new Error(label+"须为数组，最多 "+max+" 项");
    return value;
  }
  function object(value,label) { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(label+"无效"); return value; }
  function eventRange(event,periods) {
    let start=event.time || "", end=event.endTime || "";
    if (!start && event.unit) {
      const first=periods[event.unit-1] || {};
      start=event.endUnit ? first.start : event.unitAnchor === "end" ? first.end : first.start;
      end=event.endUnit ? (periods[event.endUnit-1] || {}).end : "";
    }
    const a=clock(start), b=clock(end);
    if (a == null || (end && (b == null || b<=a))) return null;
    return {start:a,end:b,point:b==null,label:b==null?`${start} · 时间点`:`${start}–${end}`};
  }
  function normalize(input) {
    const raw=object(input,"日程"), today=now().date;
    if (!Array.isArray(raw.sessions) || !Array.isArray(raw.events ?? [])) throw new Error("请导入日程表导出的 JSON，须包含 sessions 数组");
    if(raw.periods != null)list(raw.periods,"节次",30);
    const sourcePeriods=raw.periods && raw.periods.length ? raw.periods : raw.schoolPeriods ?? [];
    let lastEnd=-1;
    const periods=list(sourcePeriods,"节次",30).map((p,i)=>{
      object(p,"节次"); const a=clock(p.start), b=clock(p.end);
      if (a==null || b==null || b<=a || a<lastEnd) throw new Error(`第 ${i+1} 节时间无效或与前一节重叠`);
      lastEnd=b; return {name:text(p.name)||`第${i+1}节`,start:p.start,end:p.end};
    });
    if(sessionsMissingDate(raw))throw new Error("课表缺少学期开始日，请先在原应用中补填后导出");
    const semesterStart=raw.semesterStart || monday(today);
    dateValue(semesterStart);
    const sessions=list(raw.sessions,"课程时段").map(s=>{
      object(s,"课程时段");
      const start=integer(s.start,1,periods.length,"课程开始节次"), end=integer(s.end == null ? start : s.end,start,periods.length,"课程结束节次");
      return {name:text(s.name)||"未命名课程",room:text(s.room),teacher:text(s.teacher),day:integer(s.day,1,7,"课程星期"),start,end,
        weeks:list(s.weeks ?? [],"课程周次",104).map(w=>integer(w,1,104,"课程周次"))};
    });
    const ids=new Set();
    const events=list(raw.events ?? [],"事项").map((e,i)=>{
      object(e,"事项"); const id=text(e.id || `import-${i}`,120);
      if (ids.has(id)) throw new Error("事项 ID 重复"); ids.add(id);
      const repeat=e.repeat || "none";
      if (!["none","daily","weekly","weekdays","custom","holiday"].includes(repeat)) throw new Error("不支持的事项重复方式");
      const date=e.date ?? ""; if(date!=="")dateValue(date);
      if ((repeat==="none" || repeat==="weekly") && !date) throw new Error("单次或每周事项缺少日期");
      if(e.unitAnchor != null && !["start","end"].includes(e.unitAnchor))throw new Error("事项节次锚点无效");
      if(e.time != null && (typeof e.time!=="string" || (e.time!=="" && clock(e.time)==null)))throw new Error("事项开始时间无效");
      if(e.endTime != null && (typeof e.endTime!=="string" || (e.endTime!=="" && clock(e.endTime)==null)))throw new Error("事项结束时间无效");
      const event={id,name:text(e.name,120)||"未命名事项",repeat,date,time:e.time ?? "",endTime:e.endTime ?? "",unit:null,endUnit:null,
        unitAnchor:e.unitAnchor==="end"?"end":"start",enabled:e.enabled!==false,note:text(e.note,1000),
        weekdays:list(e.weekdays ?? [],"事项星期",7).map(d=>integer(d,1,7,"事项星期")),
        skipDates:list(e.skipDates ?? [],"排除日期",1000).map(d=>{dateValue(d); return d;})};
      if(!event.time && e.unit) {
        event.unit=integer(e.unit,1,periods.length,"事项节次");
        if(e.endUnit != null && e.endUnit !== "")event.endUnit=integer(e.endUnit,event.unit,periods.length,"事项结束节次");
      }
      if(!eventRange(event,periods))throw new Error(`事项「${event.name}」的起止时间无效`);
      return event;
    });
    // Explicit allowlist drops account metadata, notification history and credentials.
    return {version:1,semesterStart,semesterName:text(raw.semesterName)||"我的日程",periods,sessions,events};
  }
  function sessionsMissingDate(raw) { return raw.sessions.length && !raw.semesterStart; }
  function occurs(e,date) {
    if(!e.enabled)return false;
    const dow=weekday(date);
    if(e.repeat==="none")return e.date===date;
    if(e.repeat==="weekly")return date>=e.date && dow===weekday(e.date);
    if(e.repeat==="weekdays")return dow<=5;
    if(e.repeat==="custom")return e.weekdays.includes(dow);
    if(e.repeat==="holiday")return !e.skipDates.includes(date);
    return e.repeat==="daily";
  }
  function itemsOn(data,date) {
    const week=weekOf(data,date), dow=weekday(date), items=[];
    if(week>=1) data.sessions.forEach((s,i)=>{
      if(s.day!==dow || (s.weeks.length && !s.weeks.includes(week)))return;
      const a=data.periods[s.start-1],b=data.periods[s.end-1];
      items.push({kind:"course",id:`course-${i}`,name:s.name,start:clock(a.start),end:clock(b.end),point:false,label:`${a.start}–${b.end}`,room:s.room,teacher:s.teacher,units:`第 ${s.start}–${s.end} 节`});
    });
    data.events.forEach(e=>{if(occurs(e,date))items.push({kind:"event",id:e.id,name:e.name,...eventRange(e,data.periods),note:e.note});});
    return items.sort((a,b)=>a.start-b.start || (a.end || a.start)-(b.end || b.start));
  }
  function lanes(items) {
    const sorted=items.map(item=>({...item,displayEnd:item.point?Math.min(1440,item.start+15):item.end})).sort((a,b)=>a.start-b.start);
    let cluster=[],end=-1; const result=[];
    function flush(){const tails=[]; cluster.forEach(item=>{let lane=tails.findIndex(t=>t<=item.start); if(lane<0)lane=tails.length; tails[lane]=item.displayEnd; item.lane=lane;});cluster.forEach(item=>result.push({...item,lanes:tails.length}));cluster=[];}
    sorted.forEach(item=>{if(cluster.length && item.start>=end)flush(); if(!cluster.length)end=-1; cluster.push(item); end=Math.max(end,item.displayEnd);});
    if(cluster.length)flush(); return result;
  }
  function nextItems(data,instant=new Date()) {
    const current=now(instant), result=[];
    for(let n=0;n<8;n++){
      const date=addDays(current.date,n);
      itemsOn(data,date).forEach(item=>{
        const active=n===0 && !item.point && item.start<=current.minute && current.minute<item.end;
        if(active || n>0 || item.start>=current.minute)result.push({...item,date,active});
      });
    }
    return result.sort((a,b)=>Number(b.active)-Number(a.active) || a.date.localeCompare(b.date) || a.start-b.start);
  }
  function demo(instant=new Date()) {
    const start=monday(now(instant).date), weeks=Array.from({length:20},(_,i)=>i+1);
    const clocks=[["08:30","09:15"],["09:20","10:05"],["10:25","11:10"],["11:15","12:00"],["12:10","12:55"],["13:00","13:45"],["14:00","14:45"],["14:50","15:35"],["15:45","16:30"],["16:35","17:20"],["19:30","20:15"],["20:20","21:05"]];
    return normalize({semesterStart:start,semesterName:"演示学期 · 示例安排",periods:clocks.map((p,i)=>({name:`第${i+1}节`,start:p[0],end:p[1]})),sessions:[
      {name:"视觉设计",room:"设计教室",day:1,start:3,end:4,weeks}, {name:"程序设计",room:"计算机教室",day:2,start:1,end:2,weeks},
      {name:"设计方法",room:"讨论教室",day:3,start:7,end:8,weeks}, {name:"外语练习",room:"语言教室",day:4,start:3,end:4,weeks},
      {name:"项目实践",room:"工作室",day:5,start:9,end:10,weeks}],events:[
      {id:"demo-reading",name:"阅读与笔记",repeat:"daily",time:"19:30",endTime:"20:30"},
      {id:"demo-walk",name:"午后散步",repeat:"weekdays",time:"13:30",endTime:"14:00"},
      {id:"demo-review",name:"每周回顾",repeat:"weekly",date:addDays(start,6),time:"16:00",endTime:"17:00"}]});
  }
  const api={dateValue,dateText,addDays,weekday,monday,semesterMonday,weekOf,now,clock,clockText,normalize,eventRange,occurs,itemsOn,lanes,nextItems,demo};
  if(typeof module!=="undefined" && module.exports)module.exports=api; else root.Dayline=api;
})(typeof window!=="undefined"?window:globalThis);

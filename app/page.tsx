"use client";
import {useEffect,useState} from "react";
type S="Planlagt"|"SMS sendt"|"Bekreftet"|"Trenger bytte";
type D={id:string,name:string,phone:string,date:string,start:string,end:string,place:string,status:S};
const seed:D[]=[
{id:"1",name:"Thomas",phone:"•• •• •• ••",date:"2026-09-21",start:"07:45",end:"08:15",place:"Vinderenkrysset",status:"Planlagt"},
{id:"2",name:"Magnus",phone:"•• •• •• ••",date:"2026-09-22",start:"07:45",end:"08:15",place:"Vinderenkrysset",status:"Bekreftet"}];
const cls:Record<S,string>={"Planlagt":"planned","SMS sendt":"sent","Bekreftet":"confirmed","Trenger bytte":"swap"};
const fmt=(d:string)=>new Intl.DateTimeFormat("nb-NO",{weekday:"short",day:"numeric",month:"short"}).format(new Date(d+"T12:00"));
export default function Home(){
 const [ds,setDs]=useState<D[]>(seed),[parent,setParent]=useState<D|null>(null),[form,setForm]=useState(false);
 useEffect(()=>{try{const x=localStorage.getItem("vv-live");if(x)setDs(JSON.parse(x))}catch{}},[]);
 useEffect(()=>{localStorage.setItem("vv-live",JSON.stringify(ds))},[ds]);
 const upd=(id:string,status:S)=>setDs(x=>x.map(d=>d.id===id?{...d,status}:d));
 if(parent){const d=ds.find(x=>x.id===parent.id)||parent;return <main className="parentShell"><section className="parentCard">
  <div className="brand"><b>V</b> VaktVarsel</div><p className="eyebrow">TRAFIKKVAKT</p><h1>Kan du bekrefte vakten?</h1><p>Hei {d.name}. Her er vakten din.</p>
  <div className="duty"><div><span>Dato</span><strong>{fmt(d.date)}</strong></div><div><span>Tid</span><strong>{d.start}–{d.end}</strong></div><div><span>Sted</span><strong>{d.place}</strong></div></div>
  {d.status==="Bekreftet"?<div className="ok">✓ Takk! Vakten er bekreftet.</div>:d.status==="Trenger bytte"?<div className="warn">Registrert: trenger bytte.</div>:<div className="stack"><button className="primary" onClick={()=>upd(d.id,"Bekreftet")}>✓ Ja, jeg kommer</button><button onClick={()=>upd(d.id,"Trenger bytte")}>Jeg kan ikke / må bytte</button></div>}
  <button className="back" onClick={()=>setParent(null)}>← Tilbake til pilotoversikten</button><small>Ingen app. Ingen innlogging. Bare én enkel bekreftelse.</small>
 </section></main>}
 const counts=[["Vakter",ds.length],["Bekreftet",ds.filter(d=>d.status==="Bekreftet").length],["Venter",ds.filter(d=>d.status==="SMS sendt").length],["Trenger bytte",ds.filter(d=>d.status==="Trenger bytte").length]];
 return <main className="shell"><aside><div className="brand"><b>V</b> VaktVarsel</div><nav><strong>Oversikt</strong><span>Vaktliste</span><span>Innstillinger</span></nav><footer>● Pilotmodus<br/><small>Lokale testdata</small></footer></aside>
 <section className="content"><header><div><p className="eyebrow">VAKTVARSEL</p><h1>God ettermiddag</h1><p>Dugnaden husker seg selv.</p></div><button className="primary" onClick={()=>setForm(true)}>+ Ny vakt</button></header>
 <div className="notice"><strong>Pilot er live</strong><span>Denne versjonen tester brukerflyten. Ekte SMS kobles på i neste steg.</span><b>● LIVE</b></div>
 <div className="stats">{counts.map(([a,b])=><div key={String(a)}><span>{a}</span><strong>{b}</strong></div>)}</div>
 <section className="panel"><div className="panelHead"><h2>Kommende vakter</h2><p>Send varsel og følg bekreftelser uten regneark-kaos.</p></div>
 {ds.map(d=><div className="row" key={d.id}><div><strong>{d.name}</strong><small>{d.phone}</small></div><div><strong>{fmt(d.date)}</strong><small>{d.start}–{d.end}</small></div><div>{d.place}</div><i className={cls[d.status]}>{d.status}</i><div className="actions">{d.status==="Planlagt"&&<button onClick={()=>upd(d.id,"SMS sendt")}>Send varsel</button>}<button onClick={()=>setParent(d)}>Foreldervisning</button></div></div>)}
 </section></section>
 {form&&<div className="modalBg" onClick={()=>setForm(false)}><form className="modal" onClick={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);setDs(x=>[{id:crypto.randomUUID(),name:String(f.get("name")),phone:String(f.get("phone")),date:String(f.get("date")),start:String(f.get("start")),end:String(f.get("end")),place:String(f.get("place")),status:"Planlagt"},...x]);setForm(false)}}><h2>Ny vakt</h2><label>Navn<input name="name" required/></label><label>Mobil<input name="phone" required/></label><label>Dato<input name="date" type="date" required/></label><label>Sted<input name="place" defaultValue="Vinderenkrysset" required/></label><div className="two"><label>Fra<input name="start" type="time" defaultValue="07:45" required/></label><label>Til<input name="end" type="time" defaultValue="08:15" required/></label></div><button className="primary">Opprett vakt</button></form></div>}
 </main>}

"use client";
import {useEffect,useState} from "react";

const SUPA="https://wijxigtwsneltlitolem.supabase.co";
const KEY="sb_publishable_k8yJ5yfzpcLoe-kV9pnenw_SbXa6a-q";
type S="Planlagt"|"SMS sendt"|"Bekreftet"|"Trenger bytte"|"Avlyst";
type D={id:string,person_name:string,phone:string,duty_date:string,start_time:string,end_time:string,place:string,status:S,public_token:string};
type Session={access_token:string,refresh_token:string,user:{id:string,email?:string}};

const H={"apikey":KEY,"Content-Type":"application/json"};
const fmt=(d:string)=>new Intl.DateTimeFormat("nb-NO",{weekday:"short",day:"numeric",month:"short"}).format(new Date(d+"T12:00"));
const t=(x:string)=>String(x||"").slice(0,5);

export default function Home(){
 const [session,setSession]=useState<Session|null>(null),[duties,setDuties]=useState<D[]>([]),[school,setSchool]=useState<any>(null);
 const [loading,setLoading]=useState(true),[form,setForm]=useState(false),[msg,setMsg]=useState(""),[publicDuty,setPublicDuty]=useState<any>(null);

 useEffect(()=>{const token=new URLSearchParams(location.search).get("v"); if(token) loadPublic(token); else restore();},[]);

 async function api(path:string,opts:any={}){
  const h={...H,...(opts.headers||{})};
  if(session?.access_token) h["Authorization"]="Bearer "+session.access_token;
  const r=await fetch(SUPA+path,{...opts,headers:h});
  const text=await r.text(); let data:any=null; try{data=text?JSON.parse(text):null}catch{data=text}
  if(!r.ok) throw new Error(data?.msg||data?.message||data?.error_description||data?.error||"Noe gikk galt");
  return data;
 }

 async function restore(){
  const raw=localStorage.getItem("vv-session");
  if(raw){try{const s=JSON.parse(raw);setSession(s);await boot(s);return}catch{}}
  setLoading(false);
 }
 async function boot(s:Session){
  setLoading(true);
  try{
   const r=await fetch(SUPA+"/rest/v1/schools?select=id,name&limit=1",{headers:{...H,Authorization:"Bearer "+s.access_token}});
   if(r.status===401){localStorage.removeItem("vv-session");setSession(null);setLoading(false);return}
   let schools=await r.json(); let sc=schools[0];
   if(!sc){
    const cr=await fetch(SUPA+"/rest/v1/schools",{method:"POST",headers:{...H,Authorization:"Bearer "+s.access_token,Prefer:"return=representation"},body:JSON.stringify({name:"Min skole",owner_user_id:s.user.id})});
    const x=await cr.json(); if(!cr.ok) throw new Error(x.message||"Kunne ikke opprette skole"); sc=x[0];
   }
   setSchool(sc);
   const dr=await fetch(SUPA+"/rest/v1/duties?select=*&school_id=eq."+sc.id+"&order=duty_date.asc,start_time.asc",{headers:{...H,Authorization:"Bearer "+s.access_token}});
   const dd=await dr.json(); if(!dr.ok) throw new Error(dd.message); setDuties(dd);
  }catch(e:any){setMsg(e.message)} finally{setLoading(false)}
 }

 async function login(e:any){
  e.preventDefault();setMsg("");const f=new FormData(e.currentTarget);
  const email=String(f.get("email")),password=String(f.get("password"));
  try{
   const r=await fetch(SUPA+"/auth/v1/token?grant_type=password",{method:"POST",headers:H,body:JSON.stringify({email,password})}); const x=await r.json();
   if(!r.ok) throw new Error(x.error_description||x.msg||"Innlogging feilet");
   localStorage.setItem("vv-session",JSON.stringify(x));setSession(x);await boot(x);
  }catch(e:any){setMsg(e.message)}
 }
 async function signup(e:any){
  e.preventDefault();setMsg("");const f=new FormData(e.currentTarget);
  try{
   const r=await fetch(SUPA+"/auth/v1/signup",{method:"POST",headers:H,body:JSON.stringify({email:String(f.get("email")),password:String(f.get("password"))})});const x=await r.json();
   if(!r.ok)throw new Error(x.msg||x.error_description||"Kunne ikke opprette bruker");
   setMsg(x.access_token?"Bruker opprettet. Logg inn.":"Bruker opprettet. Sjekk e-posten din for bekreftelse, og logg deretter inn.");
  }catch(e:any){setMsg(e.message)}
 }
 async function addDuty(e:any){
  e.preventDefault();const f=new FormData(e.currentTarget);
  try{
   const body={school_id:school.id,person_name:String(f.get("name")),phone:String(f.get("phone")),duty_date:String(f.get("date")),start_time:String(f.get("start")),end_time:String(f.get("end")),place:String(f.get("place"))};
   const r=await fetch(SUPA+"/rest/v1/duties",{method:"POST",headers:{...H,Authorization:"Bearer "+session!.access_token,Prefer:"return=representation"},body:JSON.stringify(body)});
   const x=await r.json();if(!r.ok)throw new Error(x.message);setDuties(d=>[...d,x[0]].sort((a,b)=>(a.duty_date+a.start_time).localeCompare(b.duty_date+b.start_time)));setForm(false);
  }catch(e:any){setMsg(e.message)}
 }
 async function setStatus(d:D,status:S){
  const r=await fetch(SUPA+"/rest/v1/duties?id=eq."+d.id,{method:"PATCH",headers:{...H,Authorization:"Bearer "+session!.access_token,Prefer:"return=representation"},body:JSON.stringify({status,sms_sent_at:status==="SMS sendt"?new Date().toISOString():undefined})});
  const x=await r.json();if(r.ok)setDuties(ds=>ds.map(q=>q.id===d.id?x[0]:q));
 }
 async function loadPublic(token:string){
  setLoading(true);
  try{const x=await api("/rest/v1/rpc/get_public_duty",{method:"POST",body:JSON.stringify({p_token:token})});setPublicDuty({...x[0],token})}catch(e:any){setMsg(e.message)}finally{setLoading(false)}
 }
 async function respond(action:"confirm"|"swap"){
  const x=await api("/rest/v1/rpc/respond_public_duty",{method:"POST",body:JSON.stringify({p_token:publicDuty.token,p_action:action})});
  setPublicDuty((d:any)=>({...d,status:x}));
 }
 function logout(){localStorage.removeItem("vv-session");setSession(null);setSchool(null);setDuties([])}

 if(loading)return <main className="center"><div className="loginCard"><div className="brand"><b>V</b> VaktVarsel</div><p>Laster…</p></div></main>;

 if(new URLSearchParams(typeof location!=="undefined"?location.search:"").get("v")) return <main className="parentShell"><section className="parentCard">
  <div className="brand"><b>V</b> VaktVarsel</div>{publicDuty?<><p className="eyebrow">TRAFIKKVAKT</p><h1>Kan du bekrefte vakten?</h1><p>Hei {publicDuty.person_name}. Her er vakten din.</p>
  <div className="duty"><div><span>Dato</span><strong>{fmt(publicDuty.duty_date)}</strong></div><div><span>Tid</span><strong>{t(publicDuty.start_time)}–{t(publicDuty.end_time)}</strong></div><div><span>Sted</span><strong>{publicDuty.place}</strong></div></div>
  {publicDuty.status==="Bekreftet"?<div className="ok">✓ Takk! Vakten er bekreftet.</div>:publicDuty.status==="Trenger bytte"?<div className="warn">Registrert: Du trenger å bytte vakt.</div>:<div className="stack"><button className="primary" onClick={()=>respond("confirm")}>✓ Ja, jeg kommer</button><button onClick={()=>respond("swap")}>Jeg kan ikke / må bytte</button></div>}
  </>:<p>{msg||"Vakten finnes ikke."}</p>}<small>Ingen app. Ingen innlogging. Bare én enkel bekreftelse.</small>
 </section></main>;

 if(!session)return <main className="center"><section className="loginCard"><div className="brand"><b>V</b> VaktVarsel</div><p className="eyebrow">ADMIN PILOT</p><h1>Logg inn</h1><p>Første gang? Opprett pilotbrukeren din her.</p>
  <form onSubmit={login}>
<label>E-post<input name="email" type="email" required/></label>
<label>Passord<input name="password" type="password" minLength={8} required/></label>
<button className="primary" type="submit">Logg inn</button>
<button type="button" onClick={(e)=>{
  const form=e.currentTarget.closest("form") as HTMLFormElement;
  signup({preventDefault:()=>{},currentTarget:form} as any);
}}>Opprett bruker</button>
</form>{msg&&<div className="message">{msg}</div>}
 </section></main>;

 const counts=[["Vakter",duties.length],["Bekreftet",duties.filter(d=>d.status==="Bekreftet").length],["Venter",duties.filter(d=>d.status==="SMS sendt").length],["Trenger bytte",duties.filter(d=>d.status==="Trenger bytte").length]];
 return <main className="shell"><aside><div className="brand"><b>V</b> VaktVarsel</div><nav><strong>Oversikt</strong><span>Vaktliste</span><span>Innstillinger</span></nav><footer>● Supabase tilkoblet<br/><small>{session.user.email}</small><button onClick={logout}>Logg ut</button></footer></aside>
 <section className="content"><header><div><p className="eyebrow">VAKTVARSEL</p><h1>{school?.name||"Min skole"}</h1><p>Dugnaden husker seg selv.</p></div><button className="primary" onClick={()=>setForm(true)}>+ Ny vakt</button></header>
 <div className="notice"><strong>Database er live</strong><span>Vakter og svar lagres nå i Supabase og virker på tvers av PC og mobil.</span><b>● LIVE</b></div>{msg&&<div className="message">{msg}</div>}
 <div className="stats">{counts.map(([a,b])=><div key={String(a)}><span>{a}</span><strong>{b}</strong></div>)}</div>
 <section className="panel"><div className="panelHead"><h2>Kommende vakter</h2><p>Foreldrelenken er unik for hver vakt.</p></div>
 {duties.length===0&&<div className="empty">Ingen vakter ennå. Trykk «Ny vakt».</div>}
 {duties.map(d=><div className="row" key={d.id}><div><strong>{d.person_name}</strong><small>{d.phone}</small></div><div><strong>{fmt(d.duty_date)}</strong><small>{t(d.start_time)}–{t(d.end_time)}</small></div><div>{d.place}</div><i className={d.status==="Bekreftet"?"confirmed":d.status==="Trenger bytte"?"swap":d.status==="SMS sendt"?"sent":"planned"}>{d.status}</i><div className="actions">{d.status==="Planlagt"&&<button onClick={()=>setStatus(d,"SMS sendt")}>Merk SMS sendt</button>}<button onClick={()=>navigator.clipboard.writeText(location.origin+"/?v="+d.public_token)}>Kopier foreldrelenke</button><button onClick={()=>window.open("/?v="+d.public_token,"_blank")}>Åpne</button></div></div>)}
 </section></section>
 {form&&<div className="modalBg" onClick={()=>setForm(false)}><form className="modal" onClick={e=>e.stopPropagation()} onSubmit={addDuty}><h2>Ny vakt</h2><label>Navn<input name="name" required/></label><label>Mobil<input name="phone" required/></label><label>Dato<input name="date" type="date" required/></label><label>Sted<input name="place" defaultValue="Vinderenkrysset" required/></label><div className="two"><label>Fra<input name="start" type="time" defaultValue="07:45" required/></label><label>Til<input name="end" type="time" defaultValue="08:15" required/></label></div><button className="primary">Opprett vakt</button></form></div>}
 </main>
}

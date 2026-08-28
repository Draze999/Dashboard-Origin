"use client";
import {useMemo,useState} from "react";
import type {Donjon,Personnage} from "@/lib/types";
import {ELEMENTS,ARMES,TYPES_PERSONNAGE,HISTOIRES,ETATS_DONJON,TYPES_DONJON,RARETES} from "@/lib/types";
import {logout, savePersonnage, saveDonjon} from "@/app/actions";

type Tab="overview"|"personnages"|"donjons";
export function Dashboard({personnages,donjons,isAdmin}:{personnages:Personnage[];donjons:Donjon[];isAdmin:boolean}){
 const [tab,setTab]=useState<Tab>("overview");
 return <main className="app-shell">
  <aside className="sidebar">
   <div className="brand"><img src="/logo.png" alt="The Seven Deadly Sins Origin"/><span>ORIGIN DB</span></div>
   <div className="side-label">BASES</div>
   <button className={tab==="overview"?"nav active":"nav"} onClick={()=>setTab("overview")}><span>◈</span> Vue d’ensemble</button>
   <button className={tab==="personnages"?"nav active":"nav"} onClick={()=>setTab("personnages")}><span>♢</span> Personnages <b>{personnages.length}</b></button>
   <button className={tab==="donjons"?"nav active":"nav"} onClick={()=>setTab("donjons")}><span>◇</span> Donjons <b>{donjons.length}</b></button>
   <div className="side-footer">{isAdmin?<><span className="admin-dot"/> Admin connecté <form action={logout}><button className="logout">Déconnexion</button></form></>:<a href="/login">Connexion administrateur →</a>}</div>
  </aside>
  <section className="main-area">
   <header className="main-header"><div><div className="eyebrow">THE SEVEN DEADLY SINS: ORIGIN</div><h1>{tab==="overview"?"Centre de données":tab==="personnages"?"Personnages":"Donjons"}</h1><p>{tab==="overview"?"Vue analytique des deux bases indépendantes.":tab==="personnages"?"Exploration, filtres et statistiques de la base Personnages.":"Exploration, faiblesses et statistiques de la base Donjons."}</p></div>
    {isAdmin&&<span className="admin-pill">● ADMIN</span>}</header>
   {tab==="overview"?<Overview personnages={personnages} donjons={donjons} onNavigate={setTab}/>:tab==="personnages"?<Personnages rows={personnages} isAdmin={isAdmin}/>:<Donjons rows={donjons} isAdmin={isAdmin}/>}
  </section>
 </main>
}
function Overview({personnages,donjons,onNavigate}:{personnages:Personnage[];donjons:Donjon[];onNavigate:(t:Tab)=>void}){
 const pElement=counts(personnages.map(x=>x.element)); const dWeak=ELEMENTS.map(e=>({label:e,count:donjons.filter(d=>d.faiblesses.includes(e)).length}));
 return <div className="page-stack">
  <div className="hero-card"><div><span className="eyebrow">DATABASE INTELLIGENCE</span><h2>Tout ce qu’il faut savoir,<br/>en un seul endroit.</h2><p>Analyse comparative, classements et données brutes sans quitter le dashboard.</p></div><div className="hero-orbit">✦</div></div>
  <div className="metric-grid"><Metric label="Personnages" value={personnages.length} sub="entrées" onClick={()=>onNavigate("personnages")}/><Metric label="Donjons" value={donjons.length} sub="entrées" onClick={()=>onNavigate("donjons")}/><Metric label="Éléments utilisés" value={pElement.length} sub={`sur ${ELEMENTS.length}`} /><Metric label="Donjons disponibles" value={donjons.filter(x=>x.etat==="Disponible").length} sub={pct(donjons.filter(x=>x.etat==="Disponible").length,donjons.length)}/></div>
  <div className="chart-grid"><Donut title="Personnages par élément" data={pElement}/><Bars title="Faiblesses des donjons" data={dWeak}/></div>
  <div className="insight-grid"><Insight title="Élément le plus représenté" value={top(pElement)?.label||"—"} detail={`${top(pElement)?.count||0} personnages`}/><Insight title="Faiblesse dominante" value={top(dWeak)?.label||"—"} detail={`${top(dWeak)?.count||0} donjons`}/><Insight title="Moyenne de faiblesses" value={donjons.length?(donjons.reduce((s,d)=>s+d.faiblesses.length,0)/donjons.length).toFixed(2):"0"} detail="par donjon"/></div>
 </div>
}
function Personnages({rows,isAdmin}:{rows:Personnage[];isAdmin:boolean}){
 const [q,setQ]=useState(""); const [filters,setFilters]=useState({rarete:"Toutes",arme:"Toutes",element:"Tous",type:"Tous",histoire:"Toutes"});
 const filtered=useMemo(()=>rows.filter(r=>(!q||r.personnage.toLowerCase().includes(q.toLowerCase()))&&(filters.rarete==="Toutes"||r.rarete===filters.rarete)&&(filters.arme==="Toutes"||r.arme===filters.arme)&&(filters.element==="Tous"||r.element===filters.element)&&(filters.type==="Tous"||r.type_personnage===filters.type)&&(filters.histoire==="Toutes"||r.histoire===filters.histoire)),[rows,q,filters]);
 return <div className="page-stack"><Toolbar q={q} setQ={setQ} filters={filters} setFilters={setFilters} options={[["rarete","Rareté",["Toutes",...RARETES]],["arme","Arme",["Toutes",...ARMES]],["element","Élément",["Tous",...ELEMENTS]],["type","Type",["Tous",...TYPES_PERSONNAGE]],["histoire","Histoire",["Toutes",...HISTOIRES]]]} />
  <section className="metric-grid compact"><Metric label="Résultats" value={filtered.length} sub={`sur ${rows.length}`}/><Metric label="SSR" value={rows.filter(r=>r.rarete==="SSR").length} sub={pct(rows.filter(r=>r.rarete==="SSR").length,rows.length)}/><Metric label="DPS" value={rows.filter(r=>r.type_personnage==="DPS").length} sub={pct(rows.filter(r=>r.type_personnage==="DPS").length,rows.length)}/><Metric label="OC" value={rows.filter(r=>r.histoire==="OC").length} sub={pct(rows.filter(r=>r.histoire==="OC").length,rows.length)}/></section>
  <div className="chart-grid"><Bars title="Répartition par élément" data={counts(rows.map(x=>x.element))}/><Bars title="Répartition par arme" data={counts(rows.map(x=>x.arme))}/></div>
  <AdminPanel kind="personnages" rows={filtered} allRows={rows} enabled={isAdmin}/><CharacterTable rows={filtered} isAdmin={isAdmin}/>
 </div>
}
function Donjons({rows,isAdmin}:{rows:Donjon[];isAdmin:boolean}){
 const [q,setQ]=useState(""); const [filters,setFilters]=useState({etat:"Tous",type:"Tous",faiblesse:"Toutes"});
 const filtered=useMemo(()=>rows.filter(r=>(!q||r.nom_donjon.toLowerCase().includes(q.toLowerCase()))&&(filters.etat==="Tous"||r.etat===filters.etat)&&(filters.type==="Tous"||r.type===filters.type)&&(filters.faiblesse==="Toutes"||r.faiblesses.includes(filters.faiblesse))),[rows,q,filters]);
 const weakness=ELEMENTS.map(e=>({label:e,count:rows.filter(r=>r.faiblesses.includes(e)).length}));
 return <div className="page-stack"><Toolbar q={q} setQ={setQ} filters={filters} setFilters={setFilters} options={[["etat","État",["Tous",...ETATS_DONJON]],["type","Type",["Tous",...TYPES_DONJON]],["faiblesse","Faiblesse",["Toutes",...ELEMENTS]]]} />
  <section className="metric-grid compact"><Metric label="Résultats" value={filtered.length} sub={`sur ${rows.length}`}/><Metric label="Disponibles" value={rows.filter(r=>r.etat==="Disponible").length} sub={pct(rows.filter(r=>r.etat==="Disponible").length,rows.length)}/><Metric label="Sans faiblesse" value={rows.filter(r=>!r.faiblesses.length).length} sub={pct(rows.filter(r=>!r.faiblesses.length).length,rows.length)}/><Metric label="Faiblesses moy." value={rows.length?(rows.reduce((s,r)=>s+r.faiblesses.length,0)/rows.length).toFixed(2):"0"} sub="par donjon"/></section>
  <div className="chart-grid"><Bars title="Faiblesses — classement" data={weakness}/><Bars title="Types de donjon" data={counts(rows.map(x=>x.type))}/></div>
  <AdminPanel kind="donjons" rows={filtered} allRows={rows} enabled={isAdmin}/><DungeonTable rows={filtered} isAdmin={isAdmin}/>
 </div>
}
function Toolbar({q,setQ,filters,setFilters,options}:{q:string;setQ:(x:string)=>void;filters:any;setFilters:(x:any)=>void;options:[string,string,string[]][]}){
 return <div className="toolbar"><div className="search">⌕<input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher…"/></div>{options.map(([key,label,opts])=><select key={key} value={filters[key]} onChange={e=>setFilters({...filters,[key]:e.target.value})}>{opts.map(o=><option key={o}>{o}</option>)}</select>)}<button className="ghost" onClick={()=>{setQ("");setFilters(Object.fromEntries(options.map(([k,,o])=>[k,o[0]])))}}>Réinitialiser</button></div>
}
function CharacterTable({rows,isAdmin}:{rows:Personnage[];isAdmin:boolean}){
 const [editing,setEditing]=useState<string|null>(null);
 return <section className="table-card"><div className="table-head"><div><h2>Classement / données</h2><span>{rows.length} lignes · {isAdmin?"édition directe activée":"lecture seule"}</span></div></div><div className="table-scroll"><table><thead><tr><th>#</th><th>Personnage</th><th>Rareté</th><th>Arme</th><th>Élément</th><th>Type</th><th>Histoire</th>{isAdmin&&<th>Action</th>}</tr></thead><tbody>{rows.map((r,i)=>editing===r.id?<tr key={r.id}><td className="rank">#{i+1}</td><td colSpan={6}><form id={`p-${r.id}`} action={savePersonnage} className="table-edit-form"><input type="hidden" name="id" value={r.id}/><input name="personnage" defaultValue={r.personnage}/><select name="rarete" defaultValue={r.rarete}>{RARETES.map(x=><option key={x}>{x}</option>)}</select><select name="arme" defaultValue={r.arme}>{ARMES.map(x=><option key={x}>{x}</option>)}</select><select name="element" defaultValue={r.element}>{ELEMENTS.map(x=><option key={x}>{x}</option>)}</select><select name="type_personnage" defaultValue={r.type_personnage}>{TYPES_PERSONNAGE.map(x=><option key={x}>{x}</option>)}</select><select name="histoire" defaultValue={r.histoire}>{HISTOIRES.map(x=><option key={x}>{x}</option>)}</select><input name="image_url" defaultValue={r.image_url??""} placeholder="URL image"/></form></td><td><div className="row-actions"><button form={`p-${r.id}`} className="primary">Enregistrer</button><button type="button" className="ghost" onClick={()=>setEditing(null)}>Annuler</button></div></td></tr>:<tr key={r.id}><td className="rank">#{i+1}</td><td><div className="entity">{r.image_url?<img src={r.image_url} alt=""/>:<div className="avatar">✦</div>}<b>{r.personnage}</b></div></td><td><Badge text={r.rarete}/></td><td>{r.arme}</td><td><Badge text={r.element}/></td><td>{r.type_personnage}</td><td>{r.histoire}</td>{isAdmin&&<td><button className="link-button" onClick={()=>setEditing(r.id)}>Modifier</button></td>}</tr>)}</tbody></table></div></section>
}
function DungeonTable({rows,isAdmin}:{rows:Donjon[];isAdmin:boolean}){
 const [editing,setEditing]=useState<string|null>(null);
 return <section className="table-card"><div className="table-head"><div><h2>Classement / données</h2><span>{rows.length} lignes · {isAdmin?"édition directe activée":"lecture seule"}</span></div></div><div className="table-scroll"><table><thead><tr><th>#</th><th>Donjon</th><th>Faiblesses</th><th>État</th><th>Type</th>{isAdmin&&<th>Action</th>}</tr></thead><tbody>{rows.map((r,i)=>editing===r.id?<tr key={r.id}><td className="rank">#{i+1}</td><td colSpan={4}><form id={`d-${r.id}`} action={saveDonjon} className="table-edit-form"><input type="hidden" name="id" value={r.id}/><input name="nom_donjon" defaultValue={r.nom_donjon}/><select name="faiblesses" multiple defaultValue={r.faiblesses}>{ELEMENTS.map(x=><option key={x}>{x}</option>)}</select><select name="etat" defaultValue={r.etat}>{ETATS_DONJON.map(x=><option key={x}>{x}</option>)}</select><select name="type" defaultValue={r.type}>{TYPES_DONJON.map(x=><option key={x}>{x}</option>)}</select></form></td><td><div className="row-actions"><button form={`d-${r.id}`} className="primary">Enregistrer</button><button type="button" className="ghost" onClick={()=>setEditing(null)}>Annuler</button></div></td></tr>:<tr key={r.id}><td className="rank">#{i+1}</td><td><b>{r.nom_donjon}</b></td><td>{r.faiblesses.length?r.faiblesses.map(x=><Badge key={x} text={x}/>):<span className="muted">Aucune</span>}</td><td>{r.etat}</td><td>{r.type}</td>{isAdmin&&<td><button className="link-button" onClick={()=>setEditing(r.id)}>Modifier</button></td>}</tr>)}</tbody></table></div></section>
}
function AdminPanel({kind,rows,allRows,enabled}:{kind:"personnages"|"donjons";rows:any[];allRows:any[];enabled:boolean}){return enabled?<AdminEditor kind={kind} rows={rows} allRows={allRows}/>:null}
function AdminEditor({kind,rows,allRows}:{kind:"personnages"|"donjons";rows:any[];allRows:any[]}){
 const [open,setOpen]=useState(true); return <section className="admin-console"><div className="admin-console-head"><div><span className="eyebrow">ADMINISTRATION</span><h2>Édition de la base</h2><p>Modification directe, ajout rapide et import/export CSV.</p></div><button className="ghost" onClick={()=>setOpen(!open)}>{open?"Réduire":"Ouvrir"}</button></div>{open&&<AdminTools kind={kind} rows={rows} allRows={allRows}/>}</section>
}
function AdminTools({kind,rows,allRows}:{kind:"personnages"|"donjons";rows:any[];allRows:any[]}){
 return <><div className="admin-actions"><QuickAdd kind={kind}/><CsvTools kind={kind} rows={allRows}/></div><div className="inline-editor-title"><b>Édition directe</b><span>Utilise le bouton « Modifier » directement dans le tableau ci-dessus.</span></div></>
}
function QuickAdd({kind}:{kind:"personnages"|"donjons"}){
 const [open,setOpen]=useState(false);
 return <div className="quick-wrap"><button className="primary" onClick={()=>setOpen(!open)}>＋ Ajout rapide</button>{open&&<div className="quick-pop">{kind==="personnages"?<form action={savePersonnage}><input name="personnage" placeholder="Personnage" required/><select name="rarete" defaultValue={RARETES[1]}>{RARETES.map(x=><option key={x}>{x}</option>)}</select><select name="arme">{ARMES.map(x=><option key={x}>{x}</option>)}</select><select name="element">{ELEMENTS.map(x=><option key={x}>{x}</option>)}</select><select name="type_personnage">{TYPES_PERSONNAGE.map(x=><option key={x}>{x}</option>)}</select><select name="histoire">{HISTOIRES.map(x=><option key={x}>{x}</option>)}</select><button className="primary">Ajouter</button></form>:<form action={saveDonjon}><input name="nom_donjon" placeholder="Nom du donjon" required/><select name="faiblesses" multiple defaultValue={[]} title="Ctrl/Cmd pour sélectionner jusqu’à 2 faiblesses">{ELEMENTS.map(x=><option key={x}>{x}</option>)}</select><select name="etat">{ETATS_DONJON.map(x=><option key={x}>{x}</option>)}</select><select name="type">{TYPES_DONJON.map(x=><option key={x}>{x}</option>)}</select><button className="primary">Ajouter</button></form>}</div>}</div>
}
function CsvTools({kind,rows}:{kind:"personnages"|"donjons";rows:any[]}){
 const headers=kind==="personnages"?["personnage","rarete","arme","element","type_personnage","histoire","image_url"]:["nom_donjon","faiblesses","etat","type"];
 const exportCsv=()=>{const esc=(v:any)=>`"${String(v??"").replaceAll('"','""')}"`;const body=[headers,...rows.map(r=>headers.map(h=>h==="faiblesses"?r[h].join("|"):r[h]))].map(x=>x.map(esc).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\uFEFF"+body],{type:"text/csv;charset=utf-8"}));a.download=`origin-${kind}.csv`;a.click();URL.revokeObjectURL(a.href)};
 return <div className="csv-tools"><button className="ghost" onClick={exportCsv}>↓ Exporter CSV</button><label className="ghost file-button">↑ Importer CSV<input type="file" accept=".csv,text/csv" onChange={async e=>{if(!e.target.files?.[0])return;const fd=new FormData();fd.set("kind",kind);fd.set("file",e.target.files[0]);await fetch("/api/import",{method:"POST",body:fd});location.reload()}}/></label></div>
}
function Metric({label,value,sub,onClick}:{label:string;value:string|number;sub:string;onClick?:()=>void}){return <button className="metric" onClick={onClick}><span>{label}</span><strong>{value}</strong><small>{sub}</small></button>}
function Insight({title,value,detail}:{title:string;value:string;detail:string}){return <div className="insight"><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>}
function Badge({text}:{text:string}){return <span className={`badge ${text==="SSR"?"gold":""}`}>{text}</span>}
function counts(values:string[]){const m=new Map<string,number>();values.forEach(v=>m.set(v,(m.get(v)||0)+1));return [...m.entries()].map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count)}
function top(a:{label:string;count:number}[]){return a[0]}
function pct(n:number,t:number){return t?`${(n/t*100).toFixed(1)} %`:"0 %"}
function Bars({title,data}:{title:string;data:{label:string;count:number}[]}){const max=Math.max(...data.map(x=>x.count),1);return <div className="chart-card"><div className="chart-title"><h3>{title}</h3><span>Classement</span></div>{data.map((x,i)=><div className="bar-row" key={x.label}><span>{i+1}</span><b>{x.label}</b><div><i style={{width:`${x.count/max*100}%`}}/></div><strong>{pct(x.count,data.reduce((s,y)=>s+y.count,0))}</strong></div>)}</div>}
function Donut({title,data}:{title:string;data:{label:string;count:number}[]}){const total=data.reduce((s,x)=>s+x.count,0);let offset=0;const colors=["#ff6d2e","#ff9a43","#f4c95d","#88c0d0","#6f8cff","#b18cff","#d968a0","#6dd1b5"];const circles=data.map((x,i)=>{const p=total?x.count/total:0;const dash=p*100;const el=<circle key={x.label} cx="50" cy="50" r="38" fill="none" stroke={colors[i%colors.length]} strokeWidth="10" pathLength="100" strokeDasharray={`${dash} ${100-dash}`} strokeDashoffset={-offset}/>;offset+=dash;return el});return <div className="chart-card donut-card"><div className="chart-title"><h3>{title}</h3><span>{total} total</span></div><div className="donut-wrap"><svg viewBox="0 0 100 100">{circles}</svg><div className="donut-center"><b>{total}</b><span>total</span></div></div><div className="legend">{data.slice(0,8).map((x,i)=><span key={x.label}><i style={{background:colors[i%colors.length]}}/>{x.label}<b>{pct(x.count,total)}</b></span>)}</div></div>}

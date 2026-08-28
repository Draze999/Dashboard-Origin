"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { Donjon, Personnage } from "@/lib/types";
import {
  ELEMENTS, ARMES, TYPES_PERSONNAGE, HISTOIRES, ETATS_DONJON, TYPES_DONJON, RARETES
} from "@/lib/types";
import { logout, savePersonnage, saveDonjon } from "@/app/actions";

type Tab = "overview" | "personnages" | "donjons";
type AddKind = "personnages" | "donjons";

const TONES: Record<string, string> = {
  SR: "sr", SSR: "ssr", Physique: "physique", Feu: "feu", Glace: "glace",
  Vent: "vent", Terre: "terre", Foudre: "foudre", "Ténèbres": "tenebres", Sacré: "sacre"
};

const tone = (value: string) => TONES[value] ?? "neutral";
const pct = (n: number, t: number) => t ? `${(n / t * 100).toFixed(1)} %` : "0 %";
function counts(values: string[]) {
  const map = new Map<string, number>();
  values.forEach(v => map.set(v, (map.get(v) || 0) + 1));
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
function top(a: { label: string; count: number }[]) { return a[0]; }

export function Dashboard({ personnages, donjons, isAdmin }: { personnages: Personnage[]; donjons: Donjon[]; isAdmin: boolean }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [addOpen, setAddOpen] = useState(false);
  const addKind: AddKind = tab === "donjons" ? "donjons" : "personnages";

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><img src="/logo.png" alt="The Seven Deadly Sins Origin"/><span>ORIGIN DB</span></div>
      <div className="side-label">BASES</div>
      <button className={tab === "overview" ? "nav active" : "nav"} onClick={() => setTab("overview")}><span>◈</span> Vue d’ensemble</button>
      <button className={tab === "personnages" ? "nav active" : "nav"} onClick={() => setTab("personnages")}><span>♢</span> Personnages <b>{personnages.length}</b></button>
      <button className={tab === "donjons" ? "nav active" : "nav"} onClick={() => setTab("donjons")}><span>◇</span> Donjons <b>{donjons.length}</b></button>
      <div className="side-footer">
        {isAdmin ? <><span className="admin-dot"/> Admin connecté <form action={logout}><button className="logout">Déconnexion</button></form></> : <a href="/login">Connexion administrateur →</a>}
      </div>
    </aside>

    <section className="main-area">
      <header className="main-header">
        <div><div className="eyebrow">THE SEVEN DEADLY SINS: ORIGIN</div><h1>{tab === "overview" ? "Centre de données" : tab === "personnages" ? "Personnages" : "Donjons"}</h1><p>{tab === "overview" ? "Vue analytique des deux bases indépendantes." : tab === "personnages" ? "Recherche, classement et analyse de la base Personnages." : "Recherche, classement et analyse de la base Donjons."}</p></div>
        {isAdmin && <span className="admin-pill">● ADMIN</span>}
      </header>

      {tab === "overview" ? <Overview personnages={personnages} donjons={donjons} onNavigate={setTab}/> : tab === "personnages" ? <Personnages rows={personnages} isAdmin={isAdmin}/> : <Donjons rows={donjons} isAdmin={isAdmin}/>}    
    </section>

    {isAdmin && <>
      <button className="floating-add" onClick={() => setAddOpen(true)} aria-label="Ajouter une entrée"><span>+</span></button>
      {addOpen && <QuickAddModal initialKind={addKind} onClose={() => setAddOpen(false)}/>} 
    </>}
  </main>;
}

function Overview({ personnages, donjons, onNavigate }: { personnages: Personnage[]; donjons: Donjon[]; onNavigate: (t: Tab) => void }) {
  const pElement = counts(personnages.map(x => x.element));
  const pRarity = counts(personnages.map(x => x.rarete));
  const dWeak = ELEMENTS.map(e => ({ label: e, count: donjons.filter(d => d.faiblesses.includes(e)).length }));
  const dTypes = counts(donjons.map(d => d.type));
  return <div className="page-stack">
    <div className="hero-card"><div><span className="eyebrow">DATABASE INTELLIGENCE</span><h2>Tout ce qu’il faut savoir,<br/>en un seul endroit.</h2><p>Classements, répartitions et données brutes avec une lecture immédiate des catégories importantes.</p></div><div className="hero-orbit">✦</div></div>
    <div className="metric-grid">
      <Metric label="Personnages" value={personnages.length} sub="entrées" onClick={() => onNavigate("personnages")}/>
      <Metric label="Donjons" value={donjons.length} sub="entrées" onClick={() => onNavigate("donjons")}/>
      <Metric label="SSR" value={personnages.filter(x => x.rarete === "SSR").length} sub={pct(personnages.filter(x => x.rarete === "SSR").length, personnages.length)} toneClass="ssr"/>
      <Metric label="Donjons disponibles" value={donjons.filter(x => x.etat === "Disponible").length} sub={pct(donjons.filter(x => x.etat === "Disponible").length, donjons.length)} toneClass="feu"/>
    </div>
    <div className="chart-grid">
      <Donut title="Personnages par élément" data={pElement}/>
      <Bars title="Faiblesses des donjons" data={dWeak}/>
      <Bars title="Raretés" data={pRarity}/>
      <Bars title="Types de donjon" data={dTypes}/>
    </div>
    <div className="insight-grid">
      <Insight title="Élément le plus représenté" value={top(pElement)?.label || "—"} detail={`${top(pElement)?.count || 0} personnages`} toneClass={tone(top(pElement)?.label || "")}/>
      <Insight title="Faiblesse dominante" value={top(dWeak)?.label || "—"} detail={`${top(dWeak)?.count || 0} donjons`} toneClass={tone(top(dWeak)?.label || "")}/>
      <Insight title="Moyenne de faiblesses" value={donjons.length ? (donjons.reduce((s, d) => s + d.faiblesses.length, 0) / donjons.length).toFixed(2) : "0"} detail="par donjon"/>
    </div>
  </div>;
}

function Personnages({ rows, isAdmin }: { rows: Personnage[]; isAdmin: boolean }) {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ rarete: "Toutes", arme: "Toutes", element: "Tous", type: "Tous", histoire: "Toutes" });
  const [sort, setSort] = useState("personnage");
  const filtered = useMemo(() => {
    const result = rows.filter(r => (!q || r.personnage.toLowerCase().includes(q.toLowerCase())) &&
      (filters.rarete === "Toutes" || r.rarete === filters.rarete) &&
      (filters.arme === "Toutes" || r.arme === filters.arme) &&
      (filters.element === "Tous" || r.element === filters.element) &&
      (filters.type === "Tous" || r.type_personnage === filters.type) &&
      (filters.histoire === "Toutes" || r.histoire === filters.histoire));
    return [...result].sort((a, b) => String(a[sort as keyof Personnage] ?? "").localeCompare(String(b[sort as keyof Personnage] ?? ""), "fr"));
  }, [rows, q, filters, sort]);
  const base = rows;
  return <div className="page-stack">
    <section className="metric-grid compact">
      <Metric label="Résultats" value={filtered.length} sub={`sur ${rows.length}`}/>
      <Metric label="SSR" value={base.filter(r => r.rarete === "SSR").length} sub={pct(base.filter(r => r.rarete === "SSR").length, base.length)} toneClass="ssr"/>
      <Metric label="DPS" value={base.filter(r => r.type_personnage === "DPS").length} sub={pct(base.filter(r => r.type_personnage === "DPS").length, base.length)}/>
      <Metric label="OC" value={base.filter(r => r.histoire === "OC").length} sub={pct(base.filter(r => r.histoire === "OC").length, base.length)}/>
    </section>
    <Toolbar q={q} setQ={setQ} filters={filters} setFilters={(x) => setFilters(x as typeof filters)} sort={sort} setSort={setSort} options={[
      ["rarete", "Rareté", ["Toutes", ...RARETES]], ["arme", "Arme", ["Toutes", ...ARMES]], ["element", "Élément", ["Tous", ...ELEMENTS]], ["type", "Type", ["Tous", ...TYPES_PERSONNAGE]], ["histoire", "Histoire", ["Toutes", ...HISTOIRES]]
    ]} sortOptions={[["personnage", "Nom"], ["rarete", "Rareté"], ["element", "Élément"], ["arme", "Arme"], ["type_personnage", "Type"], ["histoire", "Histoire"]]}/>
    <CharacterTable rows={filtered} isAdmin={isAdmin}/>
    <section className="analysis-block"><div className="section-title"><div><span className="eyebrow">ANALYSE</span><h2>Statistiques et classements</h2></div><span>{filtered.length} lignes filtrées</span></div>
      <div className="chart-grid"><Bars title="Éléments" data={counts(filtered.map(x => x.element))}/><Donut title="Raretés" data={counts(filtered.map(x => x.rarete))}/><Bars title="Armes" data={counts(filtered.map(x => x.arme))}/><Bars title="Types" data={counts(filtered.map(x => x.type_personnage))}/><Bars title="Histoires" data={counts(filtered.map(x => x.histoire))}/></div>
    </section>
    {isAdmin && <CsvTools kind="personnages" rows={filtered}/>}
  </div>;
}

function Donjons({ rows, isAdmin }: { rows: Donjon[]; isAdmin: boolean }) {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ etat: "Tous", type: "Tous", faiblesse: "Toutes" });
  const [sort, setSort] = useState("nom_donjon");
  const filtered = useMemo(() => {
    const result = rows.filter(r => (!q || r.nom_donjon.toLowerCase().includes(q.toLowerCase())) &&
      (filters.etat === "Tous" || r.etat === filters.etat) &&
      (filters.type === "Tous" || r.type === filters.type) &&
      (filters.faiblesse === "Toutes" || r.faiblesses.includes(filters.faiblesse)));
    return [...result].sort((a, b) => {
      const av = sort === "faiblesse" ? a.faiblesses.length : String(a[sort as keyof Donjon] ?? "");
      const bv = sort === "faiblesse" ? b.faiblesses.length : String(b[sort as keyof Donjon] ?? "");
      return typeof av === "number" && typeof bv === "number" ? bv - av : String(av).localeCompare(String(bv), "fr");
    });
  }, [rows, q, filters, sort]);
  const weakness = ELEMENTS.map(e => ({ label: e, count: rows.filter(r => r.faiblesses.includes(e)).length }));
  return <div className="page-stack">
    <section className="metric-grid compact">
      <Metric label="Résultats" value={filtered.length} sub={`sur ${rows.length}`}/>
      <Metric label="Disponibles" value={rows.filter(r => r.etat === "Disponible").length} sub={pct(rows.filter(r => r.etat === "Disponible").length, rows.length)}/>
      <Metric label="Sans faiblesse" value={rows.filter(r => !r.faiblesses.length).length} sub={pct(rows.filter(r => !r.faiblesses.length).length, rows.length)}/>
      <Metric label="Faiblesses moy." value={rows.length ? (rows.reduce((s, r) => s + r.faiblesses.length, 0) / rows.length).toFixed(2) : "0"} sub="par donjon"/>
    </section>
    <Toolbar q={q} setQ={setQ} filters={filters} setFilters={(x) => setFilters(x as typeof filters)} sort={sort} setSort={setSort} options={[["etat", "État", ["Tous", ...ETATS_DONJON]], ["type", "Type", ["Tous", ...TYPES_DONJON]], ["faiblesse", "Faiblesse", ["Toutes", ...ELEMENTS]]]} sortOptions={[["nom_donjon", "Nom"], ["etat", "État"], ["type", "Type"], ["faiblesse", "Nb. faiblesses"]]}/>
    <DungeonTable rows={filtered} isAdmin={isAdmin}/>
    <section className="analysis-block"><div className="section-title"><div><span className="eyebrow">ANALYSE</span><h2>Statistiques et classements</h2></div><span>{filtered.length} lignes filtrées</span></div>
      <div className="chart-grid"><Bars title="Faiblesses — % des donjons" data={weakness}/><Bars title="États" data={counts(filtered.map(x => x.etat))}/><Bars title="Types de donjon" data={counts(filtered.map(x => x.type))}/><Donut title="Nombre de faiblesses par donjon" data={counts(filtered.map(x => String(x.faiblesses.length)))}/></div>
    </section>
    {isAdmin && <CsvTools kind="donjons" rows={filtered}/>}
  </div>;
}

function CsvTools({ kind, rows }: { kind: AddKind; rows: Personnage[] | Donjon[] }) {
  const headers = kind === "personnages"
    ? ["personnage", "rarete", "arme", "element", "type_personnage", "histoire", "image_url"]
    : ["nom_donjon", "faiblesses", "etat", "type"];
  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const body = [headers, ...rows.map(r => headers.map(h => h === "faiblesses" ? (r as Donjon).faiblesses.join("|") : (r as any)[h]))]
      .map(line => line.map(esc).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" }));
    a.download = `origin-${kind}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importCsv = async (file: File) => {
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("file", file);
    const response = await fetch("/api/import", { method: "POST", body: fd });
    const result = await response.json();
    if (!response.ok || !result.ok) { alert(result.error || "Import impossible."); return; }
    location.reload();
  };
  return <div className="csv-tools-card"><div><span className="eyebrow">ADMIN / DATA</span><strong>Import / export CSV</strong><small>La base actuelle ({rows.length} lignes filtrées) peut être exportée. L’import ajoute les lignes validées à la base.</small></div><div className="csv-tools"><button className="ghost" onClick={exportCsv}>↓ Exporter CSV</button><label className="ghost file-button">↑ Importer CSV<input type="file" accept=".csv,text/csv" onChange={e => { const file = e.target.files?.[0]; if (file) void importCsv(file); e.currentTarget.value = ""; }}/></label></div></div>;
}

function Toolbar({ q, setQ, filters, setFilters, options, sort, setSort, sortOptions }: { q: string; setQ: (x: string) => void; filters: Record<string, string>; setFilters: (x: Record<string, string>) => void; options: [string, string, string[]][]; sort: string; setSort: (x: string) => void; sortOptions: [string, string][] }) {
  return <div className="toolbar">
    <div className="search">⌕<input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher…"/></div>
    {options.map(([key, label, opts]) => <select key={key} value={filters[key]} aria-label={label} onChange={e => setFilters({ ...filters, [key]: e.target.value })}>{opts.map(o => <option key={o}>{o}</option>)}</select>)}
    <select value={sort} aria-label="Classement" onChange={e => setSort(e.target.value)}>{sortOptions.map(([value, label]) => <option key={value} value={value}>Tri : {label}</option>)}</select>
    <button className="ghost" onClick={() => { setQ(""); setFilters(Object.fromEntries(options.map(([k, , o]) => [k, o[0]]))); setSort(sortOptions[0][0]); }}>Réinitialiser</button>
  </div>;
}

function CharacterTable({ rows, isAdmin }: { rows: Personnage[]; isAdmin: boolean }) {
  const [editing, setEditing] = useState<string | null>(null);
  return <section className="table-card"><div className="table-head"><div><h2>Classement / données</h2><span>{rows.length} lignes · {isAdmin ? "édition directe activée" : "lecture seule"}</span></div></div><div className="table-scroll"><table><thead><tr><th>#</th><th>Personnage</th><th>Rareté</th><th>Arme</th><th>Élément</th><th>Type</th><th>Histoire</th>{isAdmin && <th>Action</th>}</tr></thead><tbody>{rows.map((r, i) => editing === r.id ? <tr key={r.id}><td className="rank">#{i + 1}</td><td colSpan={6}><form id={`p-${r.id}`} action={savePersonnage} className="table-edit-form"><input type="hidden" name="id" value={r.id}/><input name="personnage" defaultValue={r.personnage}/><select name="rarete" defaultValue={r.rarete}>{RARETES.map(x => <option key={x}>{x}</option>)}</select><select name="arme" defaultValue={r.arme}>{ARMES.map(x => <option key={x}>{x}</option>)}</select><select name="element" defaultValue={r.element}>{ELEMENTS.map(x => <option key={x}>{x}</option>)}</select><select name="type_personnage" defaultValue={r.type_personnage}>{TYPES_PERSONNAGE.map(x => <option key={x}>{x}</option>)}</select><select name="histoire" defaultValue={r.histoire}>{HISTOIRES.map(x => <option key={x}>{x}</option>)}</select><input name="image_url" defaultValue={r.image_url ?? ""} placeholder="URL image"/></form></td><td><div className="row-actions"><button form={`p-${r.id}`} className="primary">Enregistrer</button><button type="button" className="ghost" onClick={() => setEditing(null)}>Annuler</button></div></td></tr> : <tr key={r.id}><td className="rank">#{i + 1}</td><td><div className="entity">{r.image_url ? <img src={r.image_url} alt=""/> : <div className="avatar">✦</div>}<b>{r.personnage}</b></div></td><td><Badge text={r.rarete}/></td><td>{r.arme}</td><td><Badge text={r.element}/></td><td>{r.type_personnage}</td><td>{r.histoire}</td>{isAdmin && <td><button className="link-button" onClick={() => setEditing(r.id)}>Modifier</button></td>}</tr>)}</tbody></table></div></section>;
}

function DungeonTable({ rows, isAdmin }: { rows: Donjon[]; isAdmin: boolean }) {
  const [editing, setEditing] = useState<string | null>(null);
  return <section className="table-card"><div className="table-head"><div><h2>Classement / données</h2><span>{rows.length} lignes · {isAdmin ? "édition directe activée" : "lecture seule"}</span></div></div><div className="table-scroll"><table><thead><tr><th>#</th><th>Donjon</th><th>Faiblesses</th><th>État</th><th>Type</th>{isAdmin && <th>Action</th>}</tr></thead><tbody>{rows.map((r, i) => editing === r.id ? <tr key={r.id}><td className="rank">#{i + 1}</td><td colSpan={4}><form id={`d-${r.id}`} action={saveDonjon} className="table-edit-form"><input type="hidden" name="id" value={r.id}/><input name="nom_donjon" defaultValue={r.nom_donjon}/><select name="faiblesses" multiple defaultValue={r.faiblesses} title="Sélectionne 0 à 2 éléments">{ELEMENTS.map(x => <option key={x}>{x}</option>)}</select><select name="etat" defaultValue={r.etat}>{ETATS_DONJON.map(x => <option key={x}>{x}</option>)}</select><select name="type" defaultValue={r.type}>{TYPES_DONJON.map(x => <option key={x}>{x}</option>)}</select></form></td><td><div className="row-actions"><button form={`d-${r.id}`} className="primary">Enregistrer</button><button type="button" className="ghost" onClick={() => setEditing(null)}>Annuler</button></div></td></tr> : <tr key={r.id}><td className="rank">#{i + 1}</td><td><b>{r.nom_donjon}</b></td><td>{r.faiblesses.length ? r.faiblesses.map(x => <Badge key={x} text={x}/>) : <span className="muted">Aucune</span>}</td><td>{r.etat}</td><td>{r.type}</td>{isAdmin && <td><button className="link-button" onClick={() => setEditing(r.id)}>Modifier</button></td>}</tr>)}</tbody></table></div></section>;
}

function QuickAddModal({ initialKind, onClose }: { initialKind: AddKind; onClose: () => void }) {
  const [kind, setKind] = useState<AddKind>(initialKind);
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="quick-modal" role="dialog" aria-modal="true" aria-labelledby="quick-add-title">
      <div className="quick-modal-head"><div><span className="eyebrow">ADMINISTRATION</span><h2 id="quick-add-title">Ajouter une entrée</h2><p>Crée une nouvelle ligne sans quitter la page.</p></div><button className="close-button" onClick={onClose} aria-label="Fermer">×</button></div>
      <div className="quick-kind-switch"><button className={kind === "personnages" ? "kind-button active" : "kind-button"} onClick={() => setKind("personnages")}>♢ Personnage</button><button className={kind === "donjons" ? "kind-button active" : "kind-button"} onClick={() => setKind("donjons")}>◇ Donjon</button></div>
      {kind === "personnages" ? <form action={savePersonnage} className="quick-form" onSubmit={onClose}><input name="personnage" placeholder="Nom du personnage" required/><select name="rarete" defaultValue="SSR">{RARETES.map(x => <option key={x}>{x}</option>)}</select><select name="arme">{ARMES.map(x => <option key={x}>{x}</option>)}</select><select name="element">{ELEMENTS.map(x => <option key={x}>{x}</option>)}</select><select name="type_personnage">{TYPES_PERSONNAGE.map(x => <option key={x}>{x}</option>)}</select><select name="histoire">{HISTOIRES.map(x => <option key={x}>{x}</option>)}</select><input name="image_url" placeholder="URL de l'image (facultatif)"/><button className="primary wide" type="submit">Ajouter le personnage</button></form> : <form action={saveDonjon} className="quick-form" onSubmit={onClose}><input name="nom_donjon" placeholder="Nom du donjon" required/><label className="form-label">Faiblesses <span>0 à 2</span><select name="faiblesses" multiple defaultValue={[]} className="multi-select">{ELEMENTS.map(x => <option key={x}>{x}</option>)}</select></label><select name="etat">{ETATS_DONJON.map(x => <option key={x}>{x}</option>)}</select><select name="type">{TYPES_DONJON.map(x => <option key={x}>{x}</option>)}</select><button className="primary wide" type="submit">Ajouter le donjon</button></form>}
    </div>
  </div>;
}

function Metric({ label, value, sub, onClick, toneClass }: { label: string; value: string | number; sub: string; onClick?: () => void; toneClass?: string }) {
  return <button className={`metric ${toneClass ? `metric-${toneClass}` : ""}`} onClick={onClick}><span>{label}</span><strong>{value}</strong><small>{sub}</small></button>;
}
function Insight({ title, value, detail, toneClass }: { title: string; value: string; detail: string; toneClass?: string }) { return <div className={`insight ${toneClass ? `tone-${toneClass}` : ""}`}><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>; }
function Badge({ text }: { text: string }) { return <span className={`badge tone-${tone(text)}`}>{text}</span>; }
function chartTone(value: string) { return tone(value); }
function Bars({ title, data }: { title: string; data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map(x => x.count), 1); const total = data.reduce((s, y) => s + y.count, 0);
  return <div className="chart-card"><div className="chart-title"><h3>{title}</h3><span>{total} occurrences</span></div>{data.map((x, i) => <div className="bar-row" key={x.label}><span>{i + 1}</span><b className={`tone-text-${chartTone(x.label)}`}>{x.label}</b><div><i className={`bar-fill tone-${chartTone(x.label)}`} style={{ width: `${x.count / max * 100}%` } as CSSProperties}/></div><strong>{pct(x.count, total)}</strong></div>)}</div>;
}
function Donut({ title, data }: { title: string; data: { label: string; count: number }[] }) {
  const total = data.reduce((s, x) => s + x.count, 0); let offset = 0;
  const circles = data.map(x => { const p = total ? x.count / total : 0; const dash = p * 100; const color = `var(--${chartTone(x.label)}-color, var(--orange))`; const el = <circle key={x.label} cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="10" pathLength="100" strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={-offset}/>; offset += dash; return el; });
  return <div className="chart-card donut-card"><div className="chart-title"><h3>{title}</h3><span>{total} total</span></div><div className="donut-wrap"><svg viewBox="0 0 100 100">{circles}</svg><div className="donut-center"><b>{total}</b><span>total</span></div></div><div className="legend">{data.slice(0, 8).map(x => <span key={x.label}><i className={`legend-dot tone-${chartTone(x.label)}`}/>{x.label}<b>{pct(x.count, total)}</b></span>)}</div></div>;
}

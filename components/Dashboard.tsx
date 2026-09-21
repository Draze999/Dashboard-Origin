"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties, FormEvent, Dispatch, SetStateAction } from "react";
import type { Donjon, Personnage } from "@/lib/types";
import { ELEMENTS, ARMES, TYPES_PERSONNAGE, HISTOIRES, ETATS_DONJON, TYPES_DONJON, DIFFICULTES_DONJON, RARETES } from "@/lib/types";
import { deleteDonjon, deletePersonnage, importCsv, logout, saveDonjon, savePersonnage } from "@/app/actions";

type Tab = "overview" | "personnages" | "donjons";
type AddKind = "personnages" | "donjons";
type CharacterFilters = {
  rarete: string;
  arme: string;
  element: string;
  type: string;
  histoire: string;
};
type DungeonFilters = {
  etat: string;
  type: string;
  difficulte: string;
  faiblesse: string;
};

const TONES: Record<string, string> = {
  SR: "sr", SSR: "ssr",
  Physique: "physique", Feu: "feu", Glace: "glace", Vent: "vent",
  Terre: "terre", Foudre: "foudre", "Ténèbres": "tenebres", Sacré: "sacre",
  DPS: "dps", Déluge: "deluge", Défense: "defense", Support: "support",
  "7DS": "histoire-7ds", "4KoA": "histoire-4koa", OC: "histoire-oc",
  Disponible: "disponible", "Temporairement désactivé": "desactive",
  Retiré: "retire", Terminé: "termine",
  "Jonctions": "jonction", "Boss d’Elite": "boss-elite", "Boss d'Elite": "boss-elite",
  Donjons: "donjon", Raids: "raid",
  Facile: "facile", Normal: "normal", Difficile: "difficile", Cauchemar: "cauchemar",
  Infernal: "infernal", Abysse: "abysse", Transcendance: "transcendance"
};
const WEAPON_TONES: Record<string, string> = {
  "Espadon": "royal", "Epees Doubles": "royal", "Epee Longue": "royal",
  "Grimoire": "bordeaux", "Baguette": "bordeaux", "Bâton": "bordeaux",
  "Hache": "black", "Nunchaku": "black", "Gantelets": "black",
  "Lance": "green", "Rapière": "green", "Epee & Bouclier": "green"
};
const tone = (value: string) => TONES[value] ?? "neutral";
const weaponTone = (value: string) => WEAPON_TONES[value] ?? "neutral";
const pct = (n: number, t: number) => t ? `${(n / t * 100).toFixed(1)} %` : "0 %";
function counts(values: string[]) {
  const map = new Map<string, number>();
  values.forEach(v => map.set(v, (map.get(v) || 0) + 1));
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
function top(a: { label: string; count: number }[]) { return a[0]; }

export function Dashboard({ personnages: initialPersonnages, donjons: initialDonjons, isAdmin }: { personnages: Personnage[]; donjons: Donjon[]; isAdmin: boolean }) {
  const [personnages, setPersonnages] = useState(initialPersonnages);
  const [donjons, setDonjons] = useState(initialDonjons);
  const [tab, setTab] = useState<Tab>("overview");
  const [addOpen, setAddOpen] = useState(false);
  const addKind: AddKind = tab === "donjons" ? "donjons" : "personnages";

  useEffect(() => setPersonnages(initialPersonnages), [initialPersonnages]);
  useEffect(() => setDonjons(initialDonjons), [initialDonjons]);

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><img src="/logo.png" alt="The Seven Deadly Sins Origin"/><span>ORIGIN DB</span></div>
      <div className="side-label">BASES</div>
      <button className={tab === "overview" ? "nav active" : "nav"} onClick={() => setTab("overview")}><span>◈</span> Vue d’ensemble</button>
      <button className={tab === "personnages" ? "nav active" : "nav"} onClick={() => setTab("personnages")}><span>♢</span> Personnages <b>{personnages.length}</b></button>
      <button className={tab === "donjons" ? "nav active" : "nav"} onClick={() => setTab("donjons")}><span>◇</span> Donjons <b>{donjons.length}</b></button>
      <a className="nav" href="/pokemon"><span>⚡</span> Pokémon <b>JEU</b></a>
      <div className="side-footer">
        {isAdmin ? <><span className="admin-dot"/> Admin connecté <form action={logout}><button className="logout">Déconnexion</button></form></> : <a href="/login">Connexion administrateur →</a>}
      </div>
    </aside>

    <section className="main-area">
      <header className="main-header">
        <div><div className="eyebrow">THE SEVEN DEADLY SINS: ORIGIN</div><h1>{tab === "overview" ? "Centre de données" : tab === "personnages" ? "Personnages" : "Donjons"}</h1><p>{tab === "overview" ? "Vue analytique des deux bases indépendantes." : tab === "personnages" ? "Recherche, classement et analyse de la base Personnages." : "Recherche, classement et analyse de la base Donjons."}</p></div>
        {isAdmin && <span className="admin-pill">● ADMIN</span>}
      </header>

      {tab === "overview" ? <Overview personnages={personnages} donjons={donjons} onNavigate={setTab}/> : tab === "personnages" ?
        <Personnages rows={personnages} isAdmin={isAdmin} onRowsChange={setPersonnages}/> :
        <Donjons rows={donjons} isAdmin={isAdmin} onRowsChange={setDonjons}/>}    
    </section>

    {isAdmin && <>
      <button className="floating-add" onClick={() => setAddOpen(true)} aria-label="Ajouter une entrée"><span>+</span></button>
      {addOpen && <QuickAddModal initialKind={addKind} onClose={() => setAddOpen(false)} onPersonnage={(row) => setPersonnages(v => [...v, row].sort((a,b) => a.personnage.localeCompare(b.personnage, "fr")))} onDonjon={(row) => setDonjons(v => [...v, row].sort((a,b) => a.nom_donjon.localeCompare(b.nom_donjon, "fr")))}/>} 
    </>}
  </main>;
}

function Overview({ personnages, donjons, onNavigate }: { personnages: Personnage[]; donjons: Donjon[]; onNavigate: (t: Tab) => void }) {
  const pElement = counts(personnages.map(x => x.element));
  const pRarity = counts(personnages.map(x => x.rarete));
  const pWeapons = counts(personnages.map(x => x.arme));
  const dWeak = ELEMENTS.map(e => ({ label: e, count: donjons.filter(d => d.faiblesses.includes(e)).length }));
  const dTypes = counts(donjons.map(d => d.type));
  const dDifficulties = counts(donjons.flatMap(d => d.difficulte));
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
      <Bars title="Armes" data={pWeapons}/>
      <Bars title="Types de donjon" data={dTypes}/><Bars title="Difficultés" data={dDifficulties}/>
    </div>
    <div className="insight-grid">
      <Insight title="Élément le plus représenté" value={top(pElement)?.label || "—"} detail={`${top(pElement)?.count || 0} personnages`} toneClass={tone(top(pElement)?.label || "")}/>
      <Insight title="Faiblesse dominante" value={top(dWeak)?.label || "—"} detail={`${top(dWeak)?.count || 0} donjons`} toneClass={tone(top(dWeak)?.label || "")}/>
      <Insight title="Arme la plus représentée" value={top(pWeapons)?.label || "—"} detail={`${top(pWeapons)?.count || 0} personnages`} toneClass={weaponTone(top(pWeapons)?.label || "")}/>
    </div>
  </div>;
}

function Personnages({ rows, isAdmin, onRowsChange }: { rows: Personnage[]; isAdmin: boolean; onRowsChange: Dispatch<SetStateAction<Personnage[]>> }) {
  const [data, setData] = useState(rows);
  useEffect(() => { if (rows.length !== data.length) setData(rows); }, [rows.length, data.length]);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<CharacterFilters>({ rarete: "Toutes", arme: "Toutes", element: "Tous", type: "Tous", histoire: "Toutes" });
  const [sort, setSort] = useState("personnage");
  const filtered = useMemo(() => {
    const result = data.filter(r => (!q || r.personnage.toLowerCase().includes(q.toLowerCase())) &&
      (filters.rarete === "Toutes" || r.rarete === filters.rarete) &&
      (filters.arme === "Toutes" || r.arme === filters.arme) &&
      (filters.element === "Tous" || r.element === filters.element) &&
      (filters.type === "Tous" || r.type_personnage === filters.type) &&
      (filters.histoire === "Toutes" || r.histoire === filters.histoire));
    return [...result].sort((a, b) => String(a[sort as keyof Personnage] ?? "").localeCompare(String(b[sort as keyof Personnage] ?? ""), "fr"));
  }, [data, q, filters, sort]);

  return <div className="page-stack">
    <section className="metric-grid compact">
      <Metric label="Résultats" value={filtered.length} sub={`sur ${data.length}`}/>
      <Metric label="SSR" value={data.filter(r => r.rarete === "SSR").length} sub={pct(data.filter(r => r.rarete === "SSR").length, data.length)} toneClass="ssr"/>
      <Metric label="DPS" value={data.filter(r => r.type_personnage === "DPS").length} sub={pct(data.filter(r => r.type_personnage === "DPS").length, data.length)}/>
      <Metric label="OC" value={data.filter(r => r.histoire === "OC").length} sub={pct(data.filter(r => r.histoire === "OC").length, data.length)}/>
    </section>
    <Toolbar q={q} setQ={setQ} filters={filters} setFilters={setFilters} sort={sort} setSort={setSort} options={[
      ["rarete", "Rareté", ["Toutes", ...RARETES]], ["arme", "Arme", ["Toutes", ...ARMES]], ["element", "Élément", ["Tous", ...ELEMENTS]], ["type", "Type", ["Tous", ...TYPES_PERSONNAGE]], ["histoire", "Histoire", ["Toutes", ...HISTOIRES]]
    ]} sortOptions={[["personnage", "Nom"], ["rarete", "Rareté"], ["element", "Élément"], ["arme", "Arme"], ["type_personnage", "Type"], ["histoire", "Histoire"]]}/>
    <CharacterTable rows={filtered} viewKey={`${sort}|${q}|${JSON.stringify(filters)}`}  isAdmin={isAdmin} onRowsChange={(updater) => { setData(updater); onRowsChange(updater); }}/>
    <section className="analysis-block"><div className="section-title"><div><span className="eyebrow">ANALYSE</span><h2>Statistiques et classements</h2></div><span>{filtered.length} lignes filtrées</span></div>
      <div className="chart-grid"><Bars title="Éléments" data={counts(filtered.map(x => x.element))}/><Donut title="Raretés" data={counts(filtered.map(x => x.rarete))}/><Bars title="Armes" data={counts(filtered.map(x => x.arme))}/><Bars title="Types" data={counts(filtered.map(x => x.type_personnage))}/><Bars title="Histoires" data={counts(filtered.map(x => x.histoire))}/></div>
    </section>
    {isAdmin && <CsvTools kind="personnages" rows={rows}/>} 
  </div>;
}

function Donjons({ rows, isAdmin, onRowsChange }: { rows: Donjon[]; isAdmin: boolean; onRowsChange: Dispatch<SetStateAction<Donjon[]>> }) {
  const [data, setData] = useState(rows);
  useEffect(() => { if (rows.length !== data.length) setData(rows); }, [rows.length, data.length]);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<DungeonFilters>({ etat: "Tous", type: "Tous", difficulte: "Toutes", faiblesse: "Toutes" });
  const [sort, setSort] = useState("nom_donjon");
  const filtered = useMemo(() => {
    const result = data.filter(r => (!q || r.nom_donjon.toLowerCase().includes(q.toLowerCase())) &&
      (filters.etat === "Tous" || r.etat === filters.etat) &&
      (filters.type === "Tous" || r.type === filters.type) &&
      (filters.difficulte === "Toutes" || r.difficulte.includes(filters.difficulte as any)) &&
      (filters.faiblesse === "Toutes" || r.faiblesses.includes(filters.faiblesse)));
    return [...result].sort((a, b) => {
      if (sort === "faiblesse") {
        // Tri alphabétique des composants : première faiblesse, puis deuxième,
        // puis nom complet du donjon en dernier critère.
        const aw = [...a.faiblesses].sort((x, y) => x.localeCompare(y, "fr"));
        const bw = [...b.faiblesses].sort((x, y) => x.localeCompare(y, "fr"));
        const first = (aw[0] ?? "").localeCompare(bw[0] ?? "", "fr");
        if (first !== 0) return first;
        const second = (aw[1] ?? "").localeCompare(bw[1] ?? "", "fr");
        if (second !== 0) return second;
        return a.nom_donjon.localeCompare(b.nom_donjon, "fr");
      }
      const av = String(a[sort as keyof Donjon] ?? "");
      const bv = String(b[sort as keyof Donjon] ?? "");
      return av.localeCompare(bv, "fr") || a.nom_donjon.localeCompare(b.nom_donjon, "fr");
    });
  }, [data, q, filters, sort]);
  // Les graphiques d'analyse doivent suivre exactement le jeu de données actuellement filtré.
  // En cas d'égalité, counts() trie automatiquement par nom.
  // Conserver aussi les éléments à 0 pour que le diagramme reste complet.
  const weaknessByElement = ELEMENTS
    .map(e => ({ label: e, count: filtered.filter(r => r.faiblesses.includes(e)).length }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"));

  return <div className="page-stack">
    <section className="metric-grid compact">
      <Metric label="Résultats" value={filtered.length} sub={`sur ${data.length}`}/>
      <Metric label="Disponibles" value={data.filter(r => r.etat === "Disponible").length} sub={pct(data.filter(r => r.etat === "Disponible").length, data.length)}/>
      <Metric label="Sans faiblesse" value={data.filter(r => !r.faiblesses.length).length} sub={pct(data.filter(r => !r.faiblesses.length).length, data.length)}/>
      <Metric label="Faiblesses moy." value={data.length ? (data.reduce((s, r) => s + r.faiblesses.length, 0) / data.length).toFixed(2) : "0"} sub="par donjon"/>
    </section>
    <Toolbar q={q} setQ={setQ} filters={filters} setFilters={setFilters} sort={sort} setSort={setSort} options={[["etat", "État", ["Tous", ...ETATS_DONJON]], ["type", "Type", ["Tous", ...TYPES_DONJON]], ["difficulte", "Difficulté", ["Toutes", ...DIFFICULTES_DONJON]], ["faiblesse", "Faiblesse", ["Toutes", ...ELEMENTS]]]} sortOptions={[["nom_donjon", "Nom"], ["difficulte", "Difficulté"], ["etat", "État"], ["type", "Type"], ["faiblesse", "Faiblesses"]]}/>
    <DungeonTable rows={filtered} viewKey={`${sort}|${q}|${JSON.stringify(filters)}`}  isAdmin={isAdmin} onRowsChange={(updater) => { setData(updater); onRowsChange(updater); }}/>
    <section className="analysis-block"><div className="section-title"><div><span className="eyebrow">ANALYSE</span><h2>Statistiques et classements</h2></div><span>{filtered.length} lignes filtrées</span></div>
      <div className="chart-grid"><Bars title="Faiblesses — % des donjons filtrés" data={weaknessByElement} percentageTotal={filtered.length}/><Bars title="États" data={counts(filtered.map(x => x.etat))}/><Bars title="Types de donjon" data={counts(filtered.map(x => x.type))}/><Bars title="Difficultés" data={counts(filtered.flatMap(x => x.difficulte))}/></div>
    </section>
    {isAdmin && <CsvTools kind="donjons" rows={rows}/>} 
  </div>;
}

function CsvTools({ kind, rows }: { kind: AddKind; rows: Personnage[] | Donjon[] }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState("");
  const router = useRouter();
  const headers = kind === "personnages" ? ["personnage", "rarete", "arme", "element", "type_personnage", "histoire", "image_url"] : ["nom_donjon", "faiblesses", "etat", "type", "difficulte"];
  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const body = [headers, ...rows.map(r => headers.map(h => h === "faiblesses" ? (r as Donjon).faiblesses.join("|") : h === "difficulte" ? (r as Donjon).difficulte.join("|") : (r as any)[h]))].map(line => line.map(esc).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" }));
    a.download = `origin-${kind}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  const doImport = (file: File) => startTransition(async () => {
    setStatus("Import en cours…");
    try {
      const fd = new FormData(); fd.set("kind", kind); fd.set("file", file);
      const result = await importCsv(fd);
      setStatus(`${result.inserted} ligne(s) importée(s). Actualisation des données…`);
      router.refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Import impossible.");
    }
  });
  return <div className="csv-tools-card"><div><span className="eyebrow">ADMIN / DATA</span><strong>Import / export CSV</strong><small>{rows.length} lignes disponibles · import validé puis inséré par lots de 400.</small>{status && <small className="csv-status">{status}</small>}</div><div className="csv-tools"><button className="ghost" onClick={exportCsv}>↓ Exporter CSV</button><label className={`ghost file-button ${pending ? "disabled" : ""}`}>↑ {pending ? "Import…" : "Importer CSV"}<input disabled={pending} type="file" accept=".csv,text/csv" onChange={e => { const file = e.target.files?.[0]; if (file) doImport(file); e.currentTarget.value = ""; }}/></label></div></div>;
}

function Toolbar<T extends Record<string, string>>({ q, setQ, filters, setFilters, options, sort, setSort, sortOptions }: {
  q: string;
  setQ: (x: string) => void;
  filters: T;
  setFilters: (x: T) => void;
  options: [string, string, string[]][];
  sort: string;
  setSort: (x: string) => void;
  sortOptions: [string, string][];
}) {
  return <div className="toolbar">
    <div className="search">⌕<input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher…"/></div>
    {options.map(([key, label, opts]) => <select key={key} value={filters[key]} aria-label={label} onChange={e => setFilters({ ...filters, [key]: e.target.value } as T)}>{opts.map(o => <option key={o}>{o}</option>)}</select>)}
    <select value={sort} aria-label="Classement" onChange={e => setSort(e.target.value)}>{sortOptions.map(([value, label]) => <option key={value} value={value}>Tri : {label}</option>)}</select>
    <button className="ghost" onClick={() => { setQ(""); setFilters(Object.fromEntries(options.map(([k, , o]) => [k, o[0]])) as T); setSort(sortOptions[0][0]); }}>Réinitialiser</button>
  </div>;
}

const PAGE_SIZE = 50;

function CharacterTable({ rows, viewKey, isAdmin, onRowsChange }: { rows: Personnage[]; viewKey: string; isAdmin: boolean; onRowsChange: Dispatch<SetStateAction<Personnage[]>> }) {
  const [localRows, setLocalRows] = useState(rows);
  const [editing, setEditing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { setLocalRows(rows); setPage(1); setEditing(null); }, [viewKey]);
  const pages = Math.max(1, Math.ceil(localRows.length / PAGE_SIZE));
  const visible = localRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function submit(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault(); setBusy(id);
    try {
      const result = await savePersonnage(new FormData(e.currentTarget));
      setLocalRows(v => v.map(r => r.id === id ? result.row : r));
      onRowsChange(v => v.map(r => r.id === id ? result.row : r));
      setEditing(null);
    } catch (error) { alert(error instanceof Error ? error.message : "Enregistrement impossible."); }
    finally { setBusy(null); }
  }
  async function remove(id: string, name: string) {
    if (!confirm(`Supprimer « ${name} » ? Cette action est irréversible.`)) return;
    setBusy(id);
    const fd = new FormData(); fd.set("id", id);
    try { await deletePersonnage(fd); setLocalRows(v => v.filter(r => r.id !== id)); onRowsChange(v => v.filter(r => r.id !== id)); if (visible.length === 1 && page > 1) setPage(p => p - 1); } catch (error) { alert(error instanceof Error ? error.message : "Suppression impossible."); }
    finally { setBusy(null); }
  }

  return <section className="table-card"><div className="table-head"><div><h2>Classement / données</h2><span>{localRows.length} lignes · {isAdmin ? "édition directe activée" : "lecture seule"}</span></div><div className="table-head-actions"><Pagination page={page} pages={pages} setPage={setPage}/><button type="button" className="ghost collapse-button" onClick={() => setCollapsed(v => !v)}>{collapsed ? "Afficher le tableau ↓" : "Masquer le tableau ↑"}</button></div></div>{!collapsed && <><div className="table-scroll"><table><thead><tr><th>#</th><th>Personnage</th><th>Rareté</th><th>Arme</th><th>Élément</th><th>Type</th><th>Histoire</th>{isAdmin && <th>Action</th>}</tr></thead><tbody>{visible.map((r, i) => editing === r.id ? <tr key={r.id}><td className="rank">#{(page - 1) * PAGE_SIZE + i + 1}</td><td colSpan={6}><form id={`p-${r.id}`} onSubmit={e => void submit(e, r.id)} className="table-edit-form"><input type="hidden" name="id" value={r.id}/><input name="personnage" defaultValue={r.personnage}/><select name="rarete" defaultValue={r.rarete}>{RARETES.map(x => <option key={x}>{x}</option>)}</select><select name="arme" defaultValue={r.arme}>{ARMES.map(x => <option key={x}>{x}</option>)}</select><select name="element" defaultValue={r.element}>{ELEMENTS.map(x => <option key={x}>{x}</option>)}</select><select name="type_personnage" defaultValue={r.type_personnage}>{TYPES_PERSONNAGE.map(x => <option key={x}>{x}</option>)}</select><select name="histoire" defaultValue={r.histoire}>{HISTOIRES.map(x => <option key={x}>{x}</option>)}</select><input name="image_url" defaultValue={r.image_url ?? ""} placeholder="URL image"/></form></td><td><div className="row-actions"><button form={`p-${r.id}`} disabled={busy === r.id} className="primary">{busy === r.id ? "…" : "Enregistrer"}</button><button type="button" className="ghost" onClick={() => setEditing(null)}>Annuler</button></div></td></tr> : <tr key={r.id}><td className="rank">#{(page - 1) * PAGE_SIZE + i + 1}</td><td><div className="entity">{r.image_url ? <img src={r.image_url} alt="" loading="lazy"/> : <div className="avatar">✦</div>}<b>{r.personnage}</b></div></td><td><Badge text={r.rarete}/></td><td><WeaponBadge text={r.arme}/></td><td><Badge text={r.element}/></td><td>{r.type_personnage}</td><td>{r.histoire}</td>{isAdmin && <td><div className="action-group"><button className="link-button" onClick={() => setEditing(r.id)}>Modifier</button><button className="delete-button" disabled={busy === r.id} onClick={() => void remove(r.id, r.personnage)}>Supprimer</button></div></td>}</tr>)}</tbody></table></div><Pagination page={page} pages={pages} setPage={setPage}/></>}</section>;
}

function DungeonTable({ rows, viewKey, isAdmin, onRowsChange }: { rows: Donjon[]; viewKey: string; isAdmin: boolean; onRowsChange: Dispatch<SetStateAction<Donjon[]>> }) {
  const [localRows, setLocalRows] = useState(rows);
  const [editing, setEditing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { setLocalRows(rows); setPage(1); setEditing(null); }, [viewKey]);
  const pages = Math.max(1, Math.ceil(localRows.length / PAGE_SIZE));
  const visible = localRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function submit(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault(); setBusy(id);
    try { const result = await saveDonjon(new FormData(e.currentTarget)); setLocalRows(v => v.map(r => r.id === id ? result.row : r)); onRowsChange(v => v.map(r => r.id === id ? result.row : r)); setEditing(null); }
    catch (error) { alert(error instanceof Error ? error.message : "Enregistrement impossible."); }
    finally { setBusy(null); }
  }
  async function remove(id: string, name: string) {
    if (!confirm(`Supprimer « ${name} » ? Cette action est irréversible.`)) return;
    setBusy(id); const fd = new FormData(); fd.set("id", id);
    try { await deleteDonjon(fd); setLocalRows(v => v.filter(r => r.id !== id)); onRowsChange(v => v.filter(r => r.id !== id)); if (visible.length === 1 && page > 1) setPage(p => p - 1); }
    catch (error) { alert(error instanceof Error ? error.message : "Suppression impossible."); }
    finally { setBusy(null); }
  }

  return <section className="table-card"><div className="table-head"><div><h2>Classement / données</h2><span>{localRows.length} lignes · {isAdmin ? "édition directe activée" : "lecture seule"}</span></div><div className="table-head-actions"><Pagination page={page} pages={pages} setPage={setPage}/><button type="button" className="ghost collapse-button" onClick={() => setCollapsed(v => !v)}>{collapsed ? "Afficher le tableau ↓" : "Masquer le tableau ↑"}</button></div></div>{!collapsed && <><div className="table-scroll"><table><thead><tr><th>#</th><th>Donjon</th><th>Faiblesses</th><th>État</th><th>Type</th><th>Difficulté</th>{isAdmin && <th>Action</th>}</tr></thead><tbody>{visible.map((r, i) => editing === r.id ? <tr key={r.id}><td className="rank">#{(page - 1) * PAGE_SIZE + i + 1}</td><td colSpan={5}><form id={`d-${r.id}`} onSubmit={e => void submit(e, r.id)} className="table-edit-form dungeon-edit"><input type="hidden" name="id" value={r.id}/><input name="nom_donjon" defaultValue={r.nom_donjon}/><select name="faiblesses" multiple defaultValue={r.faiblesses} title="Sélectionne 0 à 2 éléments">{ELEMENTS.map(x => <option key={x}>{x}</option>)}</select><select name="etat" defaultValue={r.etat}>{ETATS_DONJON.map(x => <option key={x}>{x}</option>)}</select><select name="type" defaultValue={r.type}>{TYPES_DONJON.map(x => <option key={x}>{x}</option>)}</select><select name="difficulte" multiple defaultValue={r.difficulte} title="Sélectionne une ou plusieurs difficultés">{DIFFICULTES_DONJON.map(x => <option key={x}>{x}</option>)}</select></form></td><td><div className="row-actions"><button form={`d-${r.id}`} disabled={busy === r.id} className="primary">{busy === r.id ? "…" : "Enregistrer"}</button><button type="button" className="ghost" onClick={() => setEditing(null)}>Annuler</button></div></td></tr> : <tr key={r.id}><td className="rank">#{(page - 1) * PAGE_SIZE + i + 1}</td><td><b>{r.nom_donjon}</b></td><td>{r.faiblesses.length ? r.faiblesses.map(x => <Badge key={x} text={x}/>) : <span className="muted">Aucune</span>}</td><td>{r.etat}</td><td>{r.type}</td><td><div className="badge-list">{r.difficulte.map(d => <Badge key={d} text={d}/>)}</div></td>{isAdmin && <td><div className="action-group"><button className="link-button" onClick={() => setEditing(r.id)}>Modifier</button><button className="delete-button" disabled={busy === r.id} onClick={() => void remove(r.id, r.nom_donjon)}>Supprimer</button></div></td>}</tr>)}</tbody></table></div><Pagination page={page} pages={pages} setPage={setPage}/></>}</section>;
}

function Pagination({ page, pages, setPage }: { page: number; pages: number; setPage: (n: number) => void }) {
  if (pages <= 1) return null;
  return <div className="pagination"><button className="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button><span>Page <b>{page}</b> / {pages}</span><button className="ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>→</button></div>;
}

function QuickAddModal({ initialKind, onClose, onPersonnage, onDonjon }: { initialKind: AddKind; onClose: () => void; onPersonnage: (row: Personnage) => void; onDonjon: (row: Donjon) => void }) {
  const [kind, setKind] = useState<AddKind>(initialKind);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    try {
      const result = kind === "personnages" ? await savePersonnage(new FormData(e.currentTarget)) : await saveDonjon(new FormData(e.currentTarget));
      if (kind === "personnages") onPersonnage(result.row as Personnage); else onDonjon(result.row as Donjon);
      onClose();
    } catch (error) { alert(error instanceof Error ? error.message : "Ajout impossible."); }
    finally { setBusy(false); }
  }
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && !busy && onClose()}>
    <div className="quick-modal" role="dialog" aria-modal="true" aria-labelledby="quick-add-title">
      <div className="quick-modal-head"><div><span className="eyebrow">ADMINISTRATION</span><h2 id="quick-add-title">Ajouter une entrée</h2><p>Crée une nouvelle ligne sans quitter la page.</p></div><button className="close-button" onClick={onClose} disabled={busy} aria-label="Fermer">×</button></div>
      <div className="quick-kind-switch"><button type="button" className={kind === "personnages" ? "kind-button active" : "kind-button"} onClick={() => setKind("personnages")}>♢ Personnage</button><button type="button" className={kind === "donjons" ? "kind-button active" : "kind-button"} onClick={() => setKind("donjons")}>◇ Donjon</button></div>
      {kind === "personnages" ? <form onSubmit={submit} className="quick-form"><input name="personnage" placeholder="Nom du personnage" required/><select name="rarete" defaultValue="SSR">{RARETES.map(x => <option key={x}>{x}</option>)}</select><select name="arme">{ARMES.map(x => <option key={x}>{x}</option>)}</select><select name="element">{ELEMENTS.map(x => <option key={x}>{x}</option>)}</select><select name="type_personnage">{TYPES_PERSONNAGE.map(x => <option key={x}>{x}</option>)}</select><select name="histoire">{HISTOIRES.map(x => <option key={x}>{x}</option>)}</select><input name="image_url" placeholder="URL de l'image (facultatif)"/><button disabled={busy} className="primary wide" type="submit">{busy ? "Ajout…" : "Ajouter le personnage"}</button></form> : <form onSubmit={submit} className="quick-form"><input name="nom_donjon" placeholder="Nom du donjon" required/><label className="form-label">Faiblesses <span>0 à 2</span><select name="faiblesses" multiple defaultValue={[]} className="multi-select">{ELEMENTS.map(x => <option key={x}>{x}</option>)}</select></label><select name="etat">{ETATS_DONJON.map(x => <option key={x}>{x}</option>)}</select><select name="type">{TYPES_DONJON.map(x => <option key={x}>{x}</option>)}</select><select name="difficulte" defaultValue="Normal">{DIFFICULTES_DONJON.map(x => <option key={x}>{x}</option>)}</select><button disabled={busy} className="primary wide" type="submit">{busy ? "Ajout…" : "Ajouter le donjon"}</button></form>}
    </div>
  </div>;
}

function Metric({ label, value, sub, onClick, toneClass }: { label: string; value: string | number; sub: string; onClick?: () => void; toneClass?: string }) {
  return <button className={`metric ${toneClass ? `metric-${toneClass}` : ""}`} onClick={onClick}><span>{label}</span><strong>{value}</strong><small>{sub}</small></button>;
}
function Insight({ title, value, detail, toneClass }: { title: string; value: string; detail: string; toneClass?: string }) { return <div className={`insight ${toneClass ? `tone-${toneClass}` : ""}`}><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>; }
function Badge({ text }: { text: string }) { return <span className={`badge tone-${tone(text)}`}>{text}</span>; }
function WeaponBadge({ text }: { text: string }) { return <span className={`badge weapon-badge weapon-${weaponTone(text)}`}>{text}</span>; }
function chartTone(value: string) { return tone(value); }
function Bars({ title, data, percentageTotal }: { title: string; data: { label: string; count: number }[]; percentageTotal?: number }) {
  const max = Math.max(...data.map(x => x.count), 1);
  const total = data.reduce((s, y) => s + y.count, 0);
  const denominator = percentageTotal ?? total;
  return <div className="chart-card"><div className="chart-title"><h3>{title}</h3><span>{percentageTotal !== undefined ? `${percentageTotal} donjons filtrés` : `${total} occurrences`}</span></div>{data.map((x, i) => <div className="bar-row" key={x.label}><span>{i + 1}</span><b className={WEAPON_TONES[x.label] ? `weapon-text-${weaponTone(x.label)}` : `tone-text-${chartTone(x.label)}`}>{x.label}</b><div><i className={WEAPON_TONES[x.label] ? `bar-fill weapon-${weaponTone(x.label)}` : `bar-fill tone-${chartTone(x.label)}`} style={{ width: `${x.count / max * 100}%` } as CSSProperties}/></div><strong>{pct(x.count, denominator)}</strong></div>)}</div>;
}
function Donut({ title, data }: { title: string; data: { label: string; count: number }[] }) {
  const total = data.reduce((s, x) => s + x.count, 0); let offset = 0;
  const circles = data.map(x => { const p = total ? x.count / total : 0; const dash = p * 100; const color = WEAPON_TONES[x.label] ? `var(--weapon-${weaponTone(x.label)}-color)` : `var(--${chartTone(x.label)}-color, var(--orange))`; const el = <circle key={x.label} cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="10" pathLength="100" strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={-offset}/>; offset += dash; return el; });
  return <div className="chart-card donut-card"><div className="chart-title"><h3>{title}</h3><span>{total} total</span></div><div className="donut-wrap"><svg viewBox="0 0 100 100">{circles}</svg><div className="donut-center"><b>{total}</b><span>total</span></div></div><div className="legend">{data.slice(0, 8).map(x => <span key={x.label}><i className={`legend-dot ${WEAPON_TONES[x.label] ? `weapon-${weaponTone(x.label)}` : `tone-${chartTone(x.label)}`}`}/>{x.label}<b>{pct(x.count, total)}</b></span>)}</div></div>;
}

"use client";

import { useState } from "react";
import { deleteDonjon, deletePersonnage, savePersonnage, logout } from "@/app/actions";
import { DonjonForm } from "./DonjonForm";
import { ARMES, ELEMENTS, ETATS_DONJON, HISTOIRES, TYPES_DONJON, TYPES_PERSONNAGE, Personnage, Donjon } from "@/lib/types";

export function AdminPanel({ kind, rows }: { kind: "personnages"|"donjons"; rows: Personnage[]|Donjon[] }) {
  return <section className="admin-area"><div className="admin-heading"><div><div className="eyebrow">ADMIN</div><h2>Gestion — {kind === "personnages" ? "Personnages" : "Donjons"}</h2></div><form action={logout}><button className="ghost">Déconnexion</button></form></div>
    {kind === "personnages"
      ? <PersonnageEditor rows={rows as Personnage[]} />
      : <DonjonEditor rows={rows as Donjon[]} />}
  </section>;
}

function PersonnageEditor({rows}:{rows:Personnage[]}) {
  const [edit,setEdit] = useState<Personnage|null>(null);
  const empty = {personnage:"",arme:ARMES[0],element:ELEMENTS[0],type_personnage:TYPES_PERSONNAGE[0],histoire:HISTOIRES[0]};
  const item = edit ?? empty;
  return <div className="editor-grid"><form className="form-card" action={savePersonnage}>
    {edit && <input type="hidden" name="id" value={edit.id}/>}
    <h3>{edit ? "Modifier" : "Ajouter"} un personnage</h3>
    <label>Personnage<input name="personnage" defaultValue={item.personnage} required/></label>
    <label>Arme<Select name="arme" value={item.arme} options={ARMES}/></label>
    <label>Élément<Select name="element" value={item.element} options={ELEMENTS}/></label>
    <label>Type<Select name="type_personnage" value={item.type_personnage} options={TYPES_PERSONNAGE}/></label>
    <label>Histoire<Select name="histoire" value={item.histoire} options={HISTOIRES}/></label>
    <div className="form-actions"><button className="primary" type="submit">{edit ? "Enregistrer" : "Ajouter"}</button>{edit && <button type="button" className="ghost" onClick={()=>setEdit(null)}>Annuler</button>}</div>
  </form><div className="mini-list"><h3>Entrées existantes</h3>{rows.map(r=><div className="mini-row" key={r.id}><span>{r.personnage}</span><div><button onClick={()=>setEdit(r)} className="link-button">Modifier</button><form action={deletePersonnage} className="inline"><input type="hidden" name="id" value={r.id}/><button className="danger" type="submit">Supprimer</button></form></div></div>)}</div></div>;
}


function DonjonEditor({rows}:{rows:Donjon[]}) {
  const [edit,setEdit] = useState<Donjon|null>(null);
  return <div className="editor-grid"><DonjonForm edit={edit}/><div className="mini-list"><h3>Entrées existantes</h3>{rows.map(r=><div className="mini-row" key={r.id}><span>{r.nom_donjon}</span><div><button onClick={()=>setEdit(r)} className="link-button">Modifier</button><form action={deleteDonjon} className="inline"><input type="hidden" name="id" value={r.id}/><button className="danger" type="submit">Supprimer</button></form></div></div>)}</div></div>;
}

function Select({name,value,options}:{name:string;value:string;options:readonly string[]}) {
  return <select name={name} defaultValue={value}>{options.map(o=><option key={o}>{o}</option>)}</select>;
}

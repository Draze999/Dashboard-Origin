"use client";

import { useState } from "react";
import { saveDonjon } from "@/app/actions";
import { Donjon, ELEMENTS, ETATS_DONJON, TYPES_DONJON } from "@/lib/types";

export function DonjonForm({ edit }: { edit: Donjon | null }) {
  const [selected, setSelected] = useState<string[]>(edit?.faiblesses ?? []);
  const toggle = (e: string) => setSelected(v => v.includes(e) ? v.filter(x => x !== e) : v.length < 2 ? [...v, e] : v);

  return <form className="form-card" action={async (fd) => { void (await saveDonjon(fd)); }}>
    {edit && <input type="hidden" name="id" value={edit.id}/>}
    <h3>{edit ? "Modifier" : "Ajouter"} un donjon</h3>
    <label>Nom du donjon<input name="nom_donjon" defaultValue={edit?.nom_donjon ?? ""} required/></label>
    <label>Faiblesses <span className="hint">(0 à 2)</span>
      <div className="checks">{ELEMENTS.map(e=><label className="check" key={e}><input type="checkbox" checked={selected.includes(e)} onChange={()=>toggle(e)}/> {e}</label>)}</div>
      {selected.map(e => <input key={e} type="hidden" name="faiblesses" value={e}/>)}
    </label>
    <label>État<select name="etat" defaultValue={edit?.etat ?? ETATS_DONJON[0]}>{ETATS_DONJON.map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Type<select name="type" defaultValue={edit?.type ?? TYPES_DONJON[0]}>{TYPES_DONJON.map(x=><option key={x}>{x}</option>)}</select></label>
    <div className="form-actions"><button className="primary" type="submit">{edit ? "Enregistrer" : "Ajouter"}</button></div>
  </form>;
}

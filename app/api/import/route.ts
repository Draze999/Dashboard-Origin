import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ARMES,ELEMENTS,ETATS_DONJON,HISTOIRES,RARETES,TYPES_DONJON,TYPES_PERSONNAGE } from "@/lib/types";

function parseCSV(text:string){
 const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(x=>x.trim());
 if(!lines.length)return [];
 const parse=(line:string)=>{const out:string[]=[];let cur="",q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q}else if(c===","&&!q){out.push(cur);cur=""}else cur+=c}out.push(cur);return out};
 const headers=parse(lines[0]).map(x=>x.trim());
 return lines.slice(1).map(line=>{const vals=parse(line);return Object.fromEntries(headers.map((h,i)=>[h,vals[i]??""]))});
}
const one=(v:string,a:readonly string[])=>a.includes(v)?v:null;
export async function POST(request:Request){
 try{
  await requireAdmin();
  const fd=await request.formData(); const kind=String(fd.get("kind")||""); const file=fd.get("file");
  if(!(file instanceof File)) throw new Error("Fichier CSV manquant.");
  const rows=parseCSV(await file.text()); const db=createSupabaseAdminClient();
  if(kind==="personnages"){
   const data=rows.map(r=>{if(!r.personnage||!one(r.rarete,RARETES)||!one(r.arme,ARMES)||!one(r.element,ELEMENTS)||!one(r.type_personnage,TYPES_PERSONNAGE)||!one(r.histoire,HISTOIRES))throw new Error("Une ligne Personnage contient une valeur invalide.");return {personnage:r.personnage,rarete:r.rarete,arme:r.arme,element:r.element,type_personnage:r.type_personnage,histoire:r.histoire,image_url:r.image_url||null};});
   const {error}=await db.from("personnages").insert(data); if(error)throw new Error(error.message);
  }else if(kind==="donjons"){
   const data=rows.map(r=>{const f=(r.faiblesses||"").split("|").filter(Boolean);if(!r.nom_donjon||!one(r.etat,ETATS_DONJON)||!one(r.type,TYPES_DONJON)||f.length>2||f.some(x=>!ELEMENTS.includes(x as any)))throw new Error("Une ligne Donjon contient une valeur invalide.");return {nom_donjon:r.nom_donjon,faiblesses:f,etat:r.etat,type:r.type};});
   const {error}=await db.from("donjons").insert(data); if(error)throw new Error(error.message);
  }else throw new Error("Base inconnue.");
  return NextResponse.json({ok:true,count:rows.length});
 }catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:"Import impossible."},{status:400});}
}

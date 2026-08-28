import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Donjon, Personnage } from "@/lib/types";

export async function getPersonnages() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("personnages")
    .select("id,personnage,rarete,arme,element,type_personnage,histoire,image_url,created_at,updated_at")
    .order("personnage");
  if (error) throw new Error(error.message);
  return (data ?? []) as Personnage[];
}

export async function getDonjons() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("donjons")
    .select("id,nom_donjon,faiblesses,etat,type,created_at,updated_at")
    .order("nom_donjon");
  if (error) throw new Error(error.message);
  return (data ?? []) as Donjon[];
}

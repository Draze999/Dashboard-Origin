import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Donjon, Personnage } from "@/lib/types";

export async function getPersonnages(): Promise<Personnage[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("personnages").select("*").order("personnage");
  if (error) throw new Error(error.message);
  return (data ?? []) as Personnage[];
}

export async function getDonjons(): Promise<Donjon[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("donjons").select("*").order("nom_donjon");
  if (error) throw new Error(error.message);
  return (data ?? []) as Donjon[];
}

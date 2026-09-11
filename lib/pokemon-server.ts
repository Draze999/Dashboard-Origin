import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PokemonRow } from "@/lib/pokemon";

export async function getPokemonRows(): Promise<PokemonRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pokemon")
    .select("id,national_id,nom_fr,nom_en,type_1,type_2,image_url")
    .order("national_id");
  if (error) throw new Error(error.message);
  return (data ?? []) as PokemonRow[];
}

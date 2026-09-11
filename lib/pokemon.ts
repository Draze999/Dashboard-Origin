import { createSupabaseServerClient } from "@/lib/supabase/server";

export const POKEMON_TYPES = [
  "Normal", "Feu", "Eau", "Électrik", "Plante", "Glace", "Combat", "Poison",
  "Sol", "Vol", "Psy", "Insecte", "Roche", "Spectre", "Dragon", "Ténèbres",
  "Acier", "Fée"
] as const;

export type PokemonType = typeof POKEMON_TYPES[number];

export type PokemonRow = {
  id: string;
  national_id: number;
  nom_fr: string;
  nom_en: string;
  type_1: PokemonType;
  type_2: PokemonType | null;
  image_url: string | null;
};

export const TYPE_ICONS: Record<PokemonType, string> = {
  Normal: "◌", Feu: "🔥", Eau: "💧", Électrik: "⚡", Plante: "🌿", Glace: "❄️",
  Combat: "✊", Poison: "☠", Sol: "⛰", Vol: "🪽", Psy: "◉", Insecte: "🪲",
  Roche: "◆", Spectre: "👻", Dragon: "🐉", Ténèbres: "☾", Acier: "⚙", Fée: "✦"
};

export const TYPE_COLORS: Record<PokemonType, string> = {
  Normal: "#a8a77a", Feu: "#ee8130", Eau: "#6390f0", Électrik: "#f7d02c",
  Plante: "#7ac74c", Glace: "#96d9d6", Combat: "#c22e28", Poison: "#a33ea1",
  Sol: "#e2bf65", Vol: "#a98ff3", Psy: "#f95587", Insecte: "#a6b91a",
  Roche: "#b6a136", Spectre: "#735797", Dragon: "#6f35fc", Ténèbres: "#705746",
  Acier: "#b7b7ce", Fée: "#d685ad"
};

/**
 * Multiplicateurs officiels des types Pokémon (Gen VI+).
 * La matrice est indexée par type attaquant puis type défenseur.
 */
export const TYPE_CHART: Record<PokemonType, Record<PokemonType, number>> = {
  Normal:   {Normal:1,Feu:1,Eau:1,Électrik:1,Plante:1,Glace:1,Combat:1,Poison:1,Sol:1,Vol:1,Psy:1,Insecte:1,Roche:0.5,Spectre:0,Dragon:1,Ténèbres:1,Acier:0.5,Fée:1},
  Feu:      {Normal:1,Feu:0.5,Eau:0.5,Électrik:1,Plante:2,Glace:2,Combat:1,Poison:1,Sol:1,Vol:1,Psy:1,Insecte:2,Roche:0.5,Spectre:1,Dragon:0.5,Ténèbres:1,Acier:2,Fée:1},
  Eau:      {Normal:1,Feu:2,Eau:0.5,Électrik:1,Plante:0.5,Glace:1,Combat:1,Poison:1,Sol:2,Vol:1,Psy:1,Insecte:1,Roche:2,Spectre:1,Dragon:0.5,Ténèbres:1,Acier:1,Fée:1},
  Électrik: {Normal:1,Feu:1,Eau:2,Électrik:0.5,Plante:0.5,Glace:1,Combat:1,Poison:1,Sol:0,Vol:2,Psy:1,Insecte:1,Roche:1,Spectre:1,Dragon:0.5,Ténèbres:1,Acier:1,Fée:1},
  Plante:   {Normal:1,Feu:0.5,Eau:2,Électrik:1,Plante:0.5,Glace:1,Combat:1,Poison:0.5,Sol:2,Vol:0.5,Psy:1,Insecte:0.5,Roche:2,Spectre:1,Dragon:0.5,Ténèbres:1,Acier:0.5,Fée:1},
  Glace:    {Normal:1,Feu:0.5,Eau:0.5,Électrik:1,Plante:2,Glace:0.5,Combat:1,Poison:1,Sol:2,Vol:2,Psy:1,Insecte:1,Roche:1,Spectre:1,Dragon:2,Ténèbres:1,Acier:0.5,Fée:1},
  Combat:   {Normal:2,Feu:1,Eau:1,Électrik:1,Plante:1,Glace:2,Combat:1,Poison:0.5,Sol:1,Vol:0.5,Psy:0.5,Insecte:0.5,Roche:2,Spectre:0,Dragon:1,Ténèbres:2,Acier:2,Fée:0.5},
  Poison:   {Normal:1,Feu:1,Eau:1,Électrik:1,Plante:2,Glace:1,Combat:1,Poison:0.5,Sol:0.5,Vol:1,Psy:1,Insecte:1,Roche:0.5,Spectre:0.5,Dragon:1,Ténèbres:1,Acier:0,Fée:2},
  Sol:      {Normal:1,Feu:2,Eau:1,Électrik:2,Plante:0.5,Glace:1,Combat:1,Poison:2,Sol:1,Vol:0,Psy:1,Insecte:0.5,Roche:2,Spectre:1,Dragon:1,Ténèbres:1,Acier:2,Fée:1},
  Vol:      {Normal:1,Feu:1,Eau:1,Électrik:0.5,Plante:2,Glace:1,Combat:2,Poison:1,Sol:1,Vol:1,Psy:1,Insecte:2,Roche:0.5,Spectre:1,Dragon:1,Ténèbres:1,Acier:0.5,Fée:1},
  Psy:      {Normal:1,Feu:1,Eau:1,Électrik:1,Plante:1,Glace:1,Combat:2,Poison:2,Sol:1,Vol:1,Psy:0.5,Insecte:1,Roche:1,Spectre:1,Dragon:1,Ténèbres:0,Acier:0.5,Fée:1},
  Insecte:  {Normal:1,Feu:0.5,Eau:1,Électrik:1,Plante:2,Glace:1,Combat:0.5,Poison:0.5,Sol:1,Vol:0.5,Psy:2,Insecte:1,Roche:1,Spectre:0.5,Dragon:1,Ténèbres:2,Acier:0.5,Fée:0.5},
  Roche:    {Normal:1,Feu:2,Eau:1,Électrik:1,Plante:1,Glace:2,Combat:0.5,Poison:1,Sol:0.5,Vol:2,Psy:1,Insecte:2,Roche:1,Spectre:1,Dragon:1,Ténèbres:1,Acier:0.5,Fée:1},
  Spectre:  {Normal:0,Feu:1,Eau:1,Électrik:1,Plante:1,Glace:1,Combat:1,Poison:1,Sol:1,Vol:1,Psy:2,Insecte:1,Roche:1,Spectre:2,Dragon:1,Ténèbres:0.5,Acier:1,Fée:1},
  Dragon:   {Normal:1,Feu:1,Eau:1,Électrik:1,Plante:1,Glace:1,Combat:1,Poison:1,Sol:1,Vol:1,Psy:1,Insecte:1,Roche:1,Spectre:1,Dragon:2,Ténèbres:1,Acier:0.5,Fée:0},
  Ténèbres: {Normal:1,Feu:1,Eau:1,Électrik:1,Plante:1,Glace:1,Combat:0.5,Poison:1,Sol:1,Vol:1,Psy:2,Insecte:1,Roche:1,Spectre:2,Dragon:1,Ténèbres:0.5,Acier:1,Fée:0.5},
  Acier:    {Normal:1,Feu:0.5,Eau:0.5,Électrik:0.5,Plante:1,Glace:2,Combat:1,Poison:1,Sol:1,Vol:1,Psy:1,Insecte:1,Roche:2,Spectre:1,Dragon:1,Ténèbres:1,Acier:0.5,Fée:2},
  Fée:      {Normal:1,Feu:0.5,Eau:1,Électrik:1,Plante:1,Glace:1,Combat:2,Poison:0.5,Sol:1,Vol:1,Psy:1,Insecte:1,Roche:1,Spectre:1,Dragon:2,Ténèbres:2,Acier:0.5,Fée:1}
};

export function effectiveness(attack: PokemonType, defenses: PokemonType[]) {
  return defenses.reduce((value, defense) => value * TYPE_CHART[attack][defense], 1);
}

export function effectivenessLabel(value: number) {
  if (value === 0) return "Immunité";
  if (value === 0.25) return "Double résistance";
  if (value === 0.5) return "Résistance";
  if (value === 1) return "Efficacité normale";
  if (value === 2) return "Faiblesse";
  if (value === 4) return "Double faiblesse";
  return `${value}×`;
}

export async function getPokemonRows(): Promise<PokemonRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pokemon")
    .select("id,national_id,nom_fr,nom_en,type_1,type_2,image_url")
    .order("national_id");
  if (error) throw new Error(error.message);
  return (data ?? []) as PokemonRow[];
}

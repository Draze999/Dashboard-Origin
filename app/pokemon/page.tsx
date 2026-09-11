import { PokemonGame } from "@/components/PokemonGame";
import { getPokemonRows } from "@/lib/pokemon-server";

export const dynamic = "force-dynamic";

export default async function PokemonPage() {
  let pokemon = [];
  let databaseError = false;
  try {
    pokemon = await getPokemonRows();
  } catch {
    databaseError = true;
  }
  return <PokemonGame initialPokemon={pokemon} databaseError={databaseError} />;
}

/**
 * Génère data/pokemon.csv depuis PokéAPI.
 *
 * Usage:
 *   npm run pokemon:seed
 *
 * Le script récupère les Pokémon nationaux disponibles dans PokéAPI,
 * les noms français/anglais, leurs 1-2 types et l'artwork officiel.
 */
import fs from "node:fs/promises";

const limit = 2000;
const list = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`).then(r => {
  if (!r.ok) throw new Error(`PokéAPI list: ${r.status}`);
  return r.json();
});

const rows = [];
for (let i = 0; i < list.results.length; i++) {
  const entry = list.results[i];
  const id = Number(entry.url.match(/\/(\d+)\/$/)?.[1]);
  if (!id || id > 1025) continue;

  const [pokemon, species] = await Promise.all([
    fetch(entry.url).then(r => r.json()),
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`).then(r => r.json())
  ]);

  const fr = species.names.find(x => x.language.name === "fr")?.name ?? entry.name;
  const en = species.names.find(x => x.language.name === "en")?.name ?? entry.name;
  const types = pokemon.types.sort((a,b) => a.slot-b.slot).map(x => {
    const map = {
      normal:"Normal", fire:"Feu", water:"Eau", electric:"Électrik", grass:"Plante",
      ice:"Glace", fighting:"Combat", poison:"Poison", ground:"Sol", flying:"Vol",
      psychic:"Psy", bug:"Insecte", rock:"Roche", ghost:"Spectre", dragon:"Dragon",
      dark:"Ténèbres", steel:"Acier", fairy:"Fée"
    };
    return map[x.type.name];
  });

  const image = pokemon.sprites?.other?.["official-artwork"]?.front_default ?? "";
  rows.push([id, fr, en, types[0], types[1] ?? "", image]);

  if ((i + 1) % 25 === 0) console.log(`${i + 1}/${list.results.length}`);
}

rows.sort((a,b) => a[0] - b[0]);
const escape = v => `"${String(v ?? "").replaceAll('"','""')}"`;
const csv = [
  "national_id,nom_fr,nom_en,type_1,type_2,image_url",
  ...rows.map(r => r.map(escape).join(","))
].join("\n");

await fs.mkdir("data", { recursive: true });
await fs.writeFile("data/pokemon.csv", csv, "utf8");
console.log(`Écrit: data/pokemon.csv (${rows.length} Pokémon)`);

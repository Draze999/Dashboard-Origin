"use client";

import { useMemo, useState } from "react";
import {
  POKEMON_TYPES, TYPE_CHART, TYPE_COLORS, TYPE_ICONS, effectiveness,
  effectivenessLabel, type PokemonType, type PokemonRow
} from "@/lib/pokemon";

type Mode = "single" | "double" | "sort" | "pokemon";
type SortBucket = "immune" | "weak" | "resist" | "normal";
type Result = { value: number; label: string };

const MODES: { id: Mode; title: string; desc: string; icon: string }[] = [
  { id: "single", title: "Type → type", desc: "Trouve le multiplicateur contre un type.", icon: "⚔" },
  { id: "double", title: "Type → double type", desc: "Multiplie les deux interactions.", icon: "⚡" },
  { id: "sort", title: "Classement", desc: "Range les types dans les bonnes catégories.", icon: "▦" },
  { id: "pokemon", title: "Type → Pokémon", desc: "Devine sans voir son ou ses types.", icon: "◈" }
];

const FALLBACK: PokemonRow[] = [
  { id:"demo-1", national_id:25, nom_fr:"Pikachu", nom_en:"Pikachu", type_1:"Électrik", type_2:null, image_url:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" },
  { id:"demo-2", national_id:6, nom_fr:"Dracaufeu", nom_en:"Charizard", type_1:"Feu", type_2:"Vol", image_url:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png" },
  { id:"demo-3", national_id:448, nom_fr:"Lucario", nom_en:"Lucario", type_1:"Combat", type_2:"Acier", image_url:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png" },
  { id:"demo-4", national_id:197, nom_fr:"Noctali", nom_en:"Umbreon", type_1:"Ténèbres", type_2:null, image_url:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/197.png" },
  { id:"demo-5", national_id:445, nom_fr:"Carchacrok", nom_en:"Garchomp", type_1:"Dragon", type_2:"Sol", image_url:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/445.png" },
  { id:"demo-6", national_id:468, nom_fr:"Togekiss", nom_en:"Togekiss", type_1:"Fée", type_2:"Vol", image_url:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/468.png" },
  { id:"demo-7", national_id:130, nom_fr:"Léviator", nom_en:"Gyarados", type_1:"Eau", type_2:"Vol", image_url:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/130.png" },
  { id:"demo-8", national_id:212, nom_fr:"Cizayox", nom_en:"Scizor", type_1:"Insecte", type_2:"Acier", image_url:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/212.png" }
];

function random<T>(items: T[]) { return items[Math.floor(Math.random() * items.length)]; }
function shuffle<T>(items: T[]) { return [...items].sort(() => Math.random() - 0.5); }
function typeChip(t: PokemonType) {
  return <span className="pk-type" style={{ "--type-color": TYPE_COLORS[t] } as React.CSSProperties}><i>{TYPE_ICONS[t]}</i>{t}</span>;
}
function resultClass(v: number) {
  return v === 0 ? "result-0" : v < 1 ? "result-low" : v > 1 ? "result-high" : "result-neutral";
}

function formatMultiplier(value: number) {
  return String(value).replace(".", ",");
}

function bucketLabel(bucket: SortBucket) {
  return { immune: "Immunité", weak: "Faiblesse", resist: "Résistance", normal: "Neutre" }[bucket];
}


export function PokemonGame({ initialPokemon, databaseError }: { initialPokemon: PokemonRow[]; databaseError: boolean }) {
  const [mode, setMode] = useState<Mode>("single");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [attack, setAttack] = useState<PokemonType>("Feu");
  const [defenses, setDefenses] = useState<PokemonType[]>(["Plante"]);
  const [pokemon, setPokemon] = useState<PokemonRow>(FALLBACK[0]);
  const [sortItems, setSortItems] = useState<PokemonType[]>([]);
  const [sortPlaced, setSortPlaced] = useState<Record<SortBucket, PokemonType[]>>({ immune:[], weak:[], resist:[], normal:[] });
  const [sortStarted, setSortStarted] = useState(false);
  const [sortFeedback, setSortFeedback] = useState<{ type: "good" | "bad"; text: string } | null>(null);

  const validPool = initialPokemon.filter(row =>
    POKEMON_TYPES.includes(row.type_1) && (!row.type_2 || POKEMON_TYPES.includes(row.type_2))
  );
  const pool = validPool.length ? validPool : FALLBACK;
  const currentValue = useMemo(() => effectiveness(attack, defenses), [attack, defenses]);

  function newRound(nextMode = mode) {
    setAnswered(false); setLastCorrect(null); setSortFeedback(null); setRound(x => x + 1);
    if (nextMode === "single") {
      const a = random([...POKEMON_TYPES]); setAttack(a); setDefenses([random([...POKEMON_TYPES])]);
    } else if (nextMode === "double") {
      const a = random([...POKEMON_TYPES]); setAttack(a);
      const d1 = random([...POKEMON_TYPES]); let d2 = random([...POKEMON_TYPES]);
      while (d2 === d1) d2 = random([...POKEMON_TYPES]);
      setDefenses([d1,d2]);
    } else if (nextMode === "pokemon") {
      setAttack(random([...POKEMON_TYPES])); setPokemon(random(pool));
    } else {
      const a = random([...POKEMON_TYPES]);
      setAttack(a);
      setSortPlaced({ immune:[], weak:[], resist:[], normal:[] });
      setSortItems(shuffle([...POKEMON_TYPES]));
      setSortStarted(true);
    }
  }

  function chooseMode(next: Mode) {
    setMode(next); setScore(0); setStreak(0); setLastCorrect(null); setSortFeedback(null);
    if (next === "sort") {
      const a = random([...POKEMON_TYPES]); setAttack(a); setSortItems(shuffle([...POKEMON_TYPES]));
      setSortPlaced({ immune:[], weak:[], resist:[], normal:[] }); setSortStarted(true);
    } else {
      setAnswered(false); setRound(0);
      if (next === "single") {
        setAttack(random([...POKEMON_TYPES])); setDefenses([random([...POKEMON_TYPES])]);
      } else if (next === "double") {
        const a = random([...POKEMON_TYPES]); const d1 = random([...POKEMON_TYPES]); let d2 = random([...POKEMON_TYPES]);
        while (d2 === d1) d2 = random([...POKEMON_TYPES]);
        setAttack(a); setDefenses([d1,d2]);
      } else {
        setAttack(random([...POKEMON_TYPES])); setPokemon(random(pool));
      }
    }
  }

  function answer(value: number) {
    if (answered) return;
    const ok = value === currentValue;
    setAnswered(true); setLastCorrect(ok);
    if (ok) { setScore(x => x + 1); setStreak(x => x + 1); }
    else setStreak(0);
  }

  function place(bucket: SortBucket, t: PokemonType) {
    if (!sortItems.includes(t)) return;
    const multiplier = effectiveness(attack, [t]);
    const correctBucket: SortBucket = multiplier === 0 ? "immune" :
      multiplier > 1 ? "weak" :
      multiplier < 1 ? "resist" : "normal";
    const ok = bucket === correctBucket;

    if (ok) {
      setSortPlaced(prev => ({ ...prev, [bucket]: [...prev[bucket], t] }));
      setSortItems(prev => prev.filter(x => x !== t));
      setScore(x => x + 1);
      setStreak(x => x + 1);
    } else {
      // Une mauvaise tentative reste disponible pour être réessayée.
      setStreak(0);
    }
    setLastCorrect(ok);
    setSortFeedback({ type: ok ? "good" : "bad", text: ok
      ? `${t} est bien placé : ${attack} inflige ×${formatMultiplier(multiplier)} contre ce type.`
      : `${t} n'est pas dans cette catégorie : ${attack} inflige ×${formatMultiplier(multiplier)}. Il va dans « ${bucketLabel(correctBucket)} ».`
    });
  }

  const displayValue = mode === "pokemon"
    ? effectiveness(attack, [pokemon.type_1, ...(pokemon.type_2 ? [pokemon.type_2] : [])])
    : currentValue;

  const result: Result = { value: displayValue, label: effectivenessLabel(displayValue) };

  return (
    <main className="pk-shell">
      <aside className="pk-sidebar">
        <a className="pk-brand" href="/">
          <span className="pk-brand-mark">◎</span>
          <span><b>ORIGIN</b><small>DATABASE</small></span>
        </a>
        <div className="pk-side-label">PROJETS</div>
        <a className="pk-nav" href="/"><span>◈</span> Origin</a>
        <div className="pk-nav active"><span>⚡</span> Pokémon <b>JEU</b></div>
        <div className="pk-side-footer">Entraînement à la table des types<br/><small>Gen VI+ · 18 types</small></div>
      </aside>

      <section className="pk-main">
        <header className="pk-header">
          <div>
            <div className="pk-eyebrow">POKÉMON · TYPE TRAINER</div>
            <h1>Maîtrise la table des types.</h1>
            <p>Réponds vite, visualise les interactions et construis tes réflexes.</p>
          </div>
          <div className="pk-score">
            <span>SCORE</span><strong>{score}</strong><small>🔥 {streak} série</small>
          </div>
        </header>

        <nav className="pk-mode-tabs">
          {MODES.map(m => <button key={m.id} className={mode === m.id ? "active" : ""} onClick={() => chooseMode(m.id)}>
            <i>{m.icon}</i><span><b>{m.title}</b><small>{m.desc}</small></span>
          </button>)}
        </nav>

        {databaseError && <div className="pk-notice">La table Supabase <b>pokemon</b> n'est pas encore disponible : le mode Pokémon utilise un petit jeu de démonstration. Importe le CSV fourni pour activer toute ta base.</div>}
        {!databaseError && initialPokemon.length === 0 && <div className="pk-notice">Base Pokémon vide : importe le fichier généré par <code>npm run pokemon:seed</code> dans Supabase.</div>}

        {mode === "sort" ? (
          <SortMode attack={attack} items={sortItems} placed={sortPlaced} place={place} onNext={() => newRound("sort")} started={sortStarted} feedback={sortFeedback}/>
        ) : (
          <QuestionMode
            mode={mode} attack={attack} defenses={defenses} pokemon={pokemon}
            result={result} answered={answered} lastCorrect={lastCorrect}
            onAnswer={answer} onNext={() => newRound(mode)}
          />
        )}

        <footer className="pk-footer">Les multiplicateurs sont calculés par multiplication des interactions de chaque type défenseur.</footer>
      </section>
    </main>
  );
}

function QuestionMode({ mode, attack, defenses, pokemon, result, answered, lastCorrect, onAnswer, onNext }: {
  mode: Mode; attack: PokemonType; defenses: PokemonType[]; pokemon: PokemonRow; result: Result;
  answered: boolean; lastCorrect: boolean | null; onAnswer: (value:number)=>void; onNext:()=>void;
}) {
  const pokemonTypes = [pokemon.type_1, ...(pokemon.type_2 ? [pokemon.type_2] : [])];
  const interactionTypes = mode === "pokemon" ? pokemonTypes : defenses;
  return <section className="pk-card pk-question">
    <div className="pk-question-top">
      <span className="pk-round">QUESTION</span>
      <span className="pk-hint">{mode === "pokemon" ? "Le type du Pokémon est caché." : "Une seule réponse."}</span>
    </div>

    <div className="pk-vs">
      <div className="pk-combatant attacker"><small>ATTAQUE</small><div className="pk-big-type" style={{ "--type-color": TYPE_COLORS[attack] } as React.CSSProperties}><span>{TYPE_ICONS[attack]}</span><b>{attack}</b></div></div>
      <div className="pk-arrow">×</div>
      <div className="pk-combatant defender"><small>{mode === "pokemon" ? "POKÉMON" : "DÉFENSE"}</small>
        {mode === "pokemon" ? <div className="pk-pokemon-card">
          <div className="pk-sprite-wrap">{pokemon.image_url ? <img src={pokemon.image_url} alt="" /> : <span>?</span>}</div>
          <b>{pokemon.nom_fr}</b><small>#{String(pokemon.national_id).padStart(4,"0")}</small>
        </div> : <div className="pk-defenses">{defenses.map(t => <div key={t} className="pk-big-type mini" style={{ "--type-color": TYPE_COLORS[t] } as React.CSSProperties}><span>{TYPE_ICONS[t]}</span><b>{t}</b></div>)}</div>}
      </div>
    </div>

    <div className="pk-question-label">Quelle est l'efficacité ?</div>
    <div className="pk-answers">
      {[0,0.25,0.5,1,2,4].filter(v => mode === "single" ? [0,0.5,1,2].includes(v) : true).map(v =>
        <button key={v} disabled={answered} className={answered && v === result.value ? "correct" : answered ? "muted-answer" : ""} onClick={() => onAnswer(v)}>
          <strong>{v}×</strong><span>{effectivenessLabel(v)}</span>
        </button>
      )}
    </div>

    {answered && <div className={`pk-feedback ${lastCorrect ? "good" : "bad"}`}>
      <div className="pk-feedback-main"><b>{lastCorrect ? "Bien joué !" : "Pas tout à fait."}</b><span>{result.value}× · {result.label}</span></div>
      <div className="pk-explain">
        {interactionTypes.map((t, index) => {
          const multiplier = TYPE_CHART[attack][t];
          return <span key={`${t}-${index}`} className="pk-interaction">{attack} <b>--×{formatMultiplier(multiplier)}→</b> {t}</span>;
        })}
      </div>
      {mode === "pokemon" && <div className="pk-revealed-types"><small>TYPES DU POKÉMON</small><div>{pokemonTypes.map(t => <span key={t}>{typeChip(t)}</span>)}</div></div>}
      <button onClick={onNext}>Question suivante →</button>
    </div>}
  </section>
}

function SortMode({ attack, items, placed, place, onNext, feedback }: {
  attack: PokemonType; items: PokemonType[]; placed: Record<SortBucket, PokemonType[]>; place:(b:SortBucket,t:PokemonType)=>void; onNext:()=>void; started:boolean; feedback: { type: "good" | "bad"; text: string } | null;
}) {
  const buckets: { id: SortBucket; title:string; desc:string; values:number[] }[] = [
    { id:"immune", title:"Immunité", desc:"×0", values:[0] },
    { id:"weak", title:"Faiblesse", desc:"×2", values:[2] },
    { id:"resist", title:"Résistance", desc:"×0,5", values:[0.5] },
    { id:"normal", title:"Neutre", desc:"×1", values:[1] }
  ];
  return <section className="pk-card pk-sort">
    <div className="pk-sort-head"><div><span className="pk-round">CLASSEMENT</span><h2>Contre une attaque <span style={{color:TYPE_COLORS[attack]}}>{TYPE_ICONS[attack]} {attack}</span></h2><p>Dépose chaque type défenseur dans sa catégorie.</p></div><button className="pk-next" onClick={onNext}>Nouvelle série ↻</button></div>
    <div className="pk-sort-items">{items.map(t => <button key={t} draggable onDragStart={e => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("type", t); }}>{TYPE_ICONS[t]} {t}</button>)}</div>
    <div className="pk-buckets">
      {buckets.map(b => <div key={b.id} className={`pk-bucket bucket-${b.id}`}
        onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); const t=e.dataTransfer.getData("type") as PokemonType; if(t) place(b.id,t);}}>
        <div className="pk-bucket-title"><b>{b.title}</b><span>{b.desc}</span></div>
        <div className="pk-dropzone">{placed[b.id].length ? placed[b.id].map(t => <span key={t} className="pk-placed" style={{"--type-color":TYPE_COLORS[t]} as React.CSSProperties}>{TYPE_ICONS[t]} {t}</span>) : <i>Dépose les types ici…</i>}</div>
      </div>)}
    </div>
    {feedback && <div className={`pk-sort-feedback ${feedback.type}`}>
      <b>{feedback.type === "good" ? "✓ Correct" : "✕ À revoir"}</b>
      <span>{feedback.text}</span>
    </div>}
  </section>
}

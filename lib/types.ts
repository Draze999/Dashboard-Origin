export const ARMES = [
  "Epee Longue", "Espadon", "Epees Doubles", "Gantelets", "Nunchaku",
  "Hache", "Lance", "Rapière", "Epee & Bouclier", "Grimoire", "Baguette", "Bâton"
] as const;

export const ELEMENTS = [
  "Physique", "Feu", "Glace", "Vent", "Terre", "Foudre", "Ténèbres", "Sacré"
] as const;

export const TYPES_PERSONNAGE = ["DPS", "Déluge", "Défense", "Support"] as const;
export const HISTOIRES = ["7DS", "4KoA", "OC"] as const;

export const RARETES = [
  "SR",
  "SSR"
] as const;

export const ETATS_DONJON = [
  "Disponible", "Temporairement désactivé", "Retiré", "Terminé"
] as const;

export const TYPES_DONJON = ["Boss d’Elite", "Donjons", "Raids", "Jonctions"] as const;

export type Personnage = {
  id: string;
  personnage: string;
  rarete: typeof RARETES[number];
  arme: typeof ARMES[number];
  element: typeof ELEMENTS[number];
  type_personnage: typeof TYPES_PERSONNAGE[number];
  histoire: typeof HISTOIRES[number];
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Donjon = {
  id: string;
  nom_donjon: string;
  faiblesses: string[];
  etat: typeof ETATS_DONJON[number];
  type: typeof TYPES_DONJON[number];
  created_at: string;
  updated_at: string;
};

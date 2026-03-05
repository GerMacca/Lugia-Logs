// ── Resource reference ────────────────────────────────────────
export interface NamedResource {
  name: string;
  url: string;
}

// ── Pokemon list ──────────────────────────────────────────────
export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedResource[];
}

// ── Pokemon detail ────────────────────────────────────────────
export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  species: NamedResource;
  sprites: PokemonSprites;
  types: PokemonTypeSlot[];
  stats: PokemonStat[];
  abilities: PokemonAbilitySlot[];
}

export interface PokemonSprites {
  front_default: string | null;
  front_shiny: string | null;
  front_female: string | null;
  front_shiny_female: string | null;
  other: {
    'official-artwork': {
      front_default: string | null;
      front_shiny: string | null;
    };
    home?: {
      front_default: string | null;
      front_shiny: string | null;
      front_female: string | null;
      front_shiny_female: string | null;
    };
  };
}

export interface PokemonTypeSlot {
  slot: number;
  type: NamedResource;
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: NamedResource;
}

export interface PokemonAbilitySlot {
  ability: NamedResource;
  is_hidden: boolean;
  slot: number;
}

// ── Generation ────────────────────────────────────────────────
export interface GenerationListResponse {
  count: number;
  results: NamedResource[];
}

export interface Generation {
  id: number;
  name: string;
  main_region: NamedResource;
  pokemon_species: NamedResource[];
  version_groups: NamedResource[];
}

// ── Type endpoint ─────────────────────────────────────────────
export interface PokemonTypeEntry {
  pokemon: NamedResource;
  slot: number;
}

export interface PokemonTypeResponse {
  id: number;
  name: string;
  pokemon: PokemonTypeEntry[];
}

// ── Species (para dados complementares do Pokémon) ────────────
export interface PokemonVariety {
  is_default: boolean;
  pokemon: NamedResource;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  flavor_text_entries: FlavorTextEntry[];
  genera: Genus[];
  generation: NamedResource;
  is_legendary: boolean;
  is_mythical: boolean;
  color: NamedResource;
  base_happiness: number | null;
  evolution_chain: { url: string };
  varieties: PokemonVariety[];
}

export interface FlavorTextEntry {
  flavor_text: string;
  language: NamedResource;
  version: NamedResource;
}

export interface Genus {
  genus: string;
  language: NamedResource;
}

// ── Evolution chain ───────────────────────────────────────────
export interface EvolutionDetail {
  min_level: number | null;
  item: NamedResource | null;
  held_item: NamedResource | null;
  known_move: NamedResource | null;
  location: NamedResource | null;
  min_affection: number | null;
  min_beauty: number | null;
  min_happiness: number | null;
  needs_overworld_rain: boolean;
  party_species: NamedResource | null;
  party_type: NamedResource | null;
  relative_physical_stats: number | null;
  time_of_day: string;
  trade_species: NamedResource | null;
  trigger: NamedResource;
  turn_upside_down: boolean;
}

export interface ChainLink {
  is_baby: boolean;
  species: NamedResource;
  evolution_details: EvolutionDetail[];
  evolves_to: ChainLink[];
}

export interface EvolutionChainResponse {
  id: number;
  chain: ChainLink;
}

import { useState, useEffect } from 'react';
import { pokemonService } from '../services/pokemon.service';
import type {
  PokemonDetail,
  PokemonSpecies,
  PokemonTypeSlot,
  ChainLink,
  EvolutionDetail,
} from '../types/pokemon.types';

// ── Type effectiveness chart (Gen 6+, defending type perspective) ─
const TYPE_CHART: Record<string, { weak: string[]; resist: string[]; immune: string[] }> = {
  normal:   { weak: ['fighting'],                                   resist: [],                                                                    immune: ['ghost'] },
  fire:     { weak: ['water', 'ground', 'rock'],                    resist: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],                     immune: [] },
  water:    { weak: ['electric', 'grass'],                          resist: ['fire', 'water', 'ice', 'steel'],                                     immune: [] },
  electric: { weak: ['ground'],                                     resist: ['electric', 'flying', 'steel'],                                       immune: [] },
  grass:    { weak: ['fire', 'ice', 'poison', 'flying', 'bug'],     resist: ['water', 'electric', 'grass', 'ground'],                              immune: [] },
  ice:      { weak: ['fire', 'fighting', 'rock', 'steel'],          resist: ['ice'],                                                               immune: [] },
  fighting: { weak: ['flying', 'psychic', 'fairy'],                 resist: ['bug', 'rock', 'dark'],                                               immune: [] },
  poison:   { weak: ['ground', 'psychic'],                          resist: ['grass', 'fighting', 'poison', 'bug', 'fairy'],                       immune: [] },
  ground:   { weak: ['water', 'grass', 'ice'],                      resist: ['poison', 'rock'],                                                    immune: ['electric'] },
  flying:   { weak: ['electric', 'ice', 'rock'],                    resist: ['fighting', 'bug', 'grass'],                                          immune: ['ground'] },
  psychic:  { weak: ['bug', 'ghost', 'dark'],                       resist: ['fighting', 'psychic'],                                               immune: [] },
  bug:      { weak: ['fire', 'flying', 'rock'],                     resist: ['grass', 'fighting', 'ground'],                                       immune: [] },
  rock:     { weak: ['water', 'grass', 'fighting', 'ground', 'steel'], resist: ['normal', 'fire', 'poison', 'flying'],                            immune: [] },
  ghost:    { weak: ['ghost', 'dark'],                               resist: ['poison', 'bug'],                                                    immune: ['normal', 'fighting'] },
  dragon:   { weak: ['ice', 'dragon', 'fairy'],                     resist: ['fire', 'water', 'electric', 'grass'],                               immune: [] },
  dark:     { weak: ['fighting', 'bug', 'fairy'],                   resist: ['ghost', 'dark'],                                                     immune: ['psychic'] },
  steel:    { weak: ['fire', 'fighting', 'ground'],                 resist: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'], immune: ['poison'] },
  fairy:    { weak: ['poison', 'steel'],                            resist: ['fighting', 'bug', 'dark'],                                           immune: ['dragon'] },
};

const ALL_TYPES = Object.keys(TYPE_CHART);

export interface TypeEffectiveness {
  quadWeak: string[];
  weak: string[];
  resistant: string[];
  quadResistant: string[];
  immune: string[];
}

function calcEffectiveness(types: PokemonTypeSlot[]): TypeEffectiveness {
  const multipliers: Record<string, number> = {};
  for (const t of ALL_TYPES) multipliers[t] = 1;

  for (const { type } of types) {
    const chart = TYPE_CHART[type.name];
    if (!chart) continue;
    for (const t of chart.weak)   multipliers[t] = (multipliers[t] ?? 1) * 2;
    for (const t of chart.resist) multipliers[t] = (multipliers[t] ?? 1) * 0.5;
    for (const t of chart.immune) multipliers[t] = 0;
  }

  const result: TypeEffectiveness = { quadWeak: [], weak: [], resistant: [], quadResistant: [], immune: [] };
  for (const [t, m] of Object.entries(multipliers)) {
    if (m >= 4)        result.quadWeak.push(t);
    else if (m === 2)  result.weak.push(t);
    else if (m === 0.5) result.resistant.push(t);
    else if (m <= 0.25 && m > 0) result.quadResistant.push(t);
    else if (m === 0)  result.immune.push(t);
  }
  return result;
}

function idFromUrl(url: string): number {
  const id = url.replace(/\/$/, '').split('/').pop();
  return parseInt(id ?? '1', 10);
}

// ── Evolution chain flattening ────────────────────────────────
interface RawNode {
  speciesName: string;
  speciesId: number;
  evolutionDetails: EvolutionDetail[];
}

function getAllPaths(link: ChainLink, currentPath: RawNode[], paths: RawNode[][]): void {
  const node: RawNode = {
    speciesName: link.species.name,
    speciesId: idFromUrl(link.species.url),
    evolutionDetails: link.evolution_details,
  };
  const newPath = [...currentPath, node];
  if (link.evolves_to.length === 0) {
    paths.push(newPath);
  } else {
    for (const next of link.evolves_to) {
      getAllPaths(next, newPath, paths);
    }
  }
}

// ── Ability translation ───────────────────────────────────────
interface AbilityApiResponse {
  names: Array<{ language: { name: string }; name: string }>;
  effect_entries: Array<{ language: { name: string }; short_effect: string }>;
}

const formatName = (name: string) =>
  name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

export interface AbilityTranslation {
  slug: string;
  label: string;
  description: string;
  is_hidden: boolean;
}

async function translateAbilities(
  abilities: PokemonDetail['abilities']
): Promise<AbilityTranslation[]> {
  return Promise.all(
    abilities.map(async ({ ability, is_hidden }) => {
      try {
        const res = await fetch(ability.url);
        const data: AbilityApiResponse = await res.json();
        const ptBr = data.names.find(n => n.language.name === 'pt-br');
        const en   = data.names.find(n => n.language.name === 'en');
        const desc = data.effect_entries.find(e => e.language.name === 'en');
        return {
          slug: ability.name,
          label: ptBr?.name ?? en?.name ?? formatName(ability.name),
          description: desc?.short_effect ?? '',
          is_hidden,
        };
      } catch {
        return { slug: ability.name, label: formatName(ability.name), description: '', is_hidden };
      }
    })
  );
}

// ── Exported types ────────────────────────────────────────────
export interface EvoNode {
  id: number;
  name: string;
  sprite: string | null;
  officialArt: string | null;
  types: PokemonTypeSlot[];
  evolutionDetails: EvolutionDetail[];
}

export type EvoPath = EvoNode[];

export interface UsePokemonDetailResult {
  pokemon: PokemonDetail | null;
  species: PokemonSpecies | null;
  abilities: AbilityTranslation[] | null;
  evoPaths: EvoPath[] | null;
  alternateForms: PokemonDetail[] | null;
  typeEffectiveness: TypeEffectiveness;
  loading: boolean;
  error: string | null;
}

// ── Hook ──────────────────────────────────────────────────────
export function usePokemonDetail(id: string | number): UsePokemonDetailResult {
  const [pokemon, setPokemon]           = useState<PokemonDetail | null>(null);
  const [species, setSpecies]           = useState<PokemonSpecies | null>(null);
  const [abilities, setAbilities]       = useState<AbilityTranslation[] | null>(null);
  const [evoPaths, setEvoPaths]         = useState<EvoPath[] | null>(null);
  const [alternateForms, setAltForms]   = useState<PokemonDetail[] | null>(null);
  const [typeEffectiveness, setTE]      = useState<TypeEffectiveness>({
    quadWeak: [], weak: [], resistant: [], quadResistant: [], immune: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setPokemon(null);
    setSpecies(null);
    setAbilities(null);
    setEvoPaths(null);
    setAltForms(null);
    setTE({ quadWeak: [], weak: [], resistant: [], quadResistant: [], immune: [] });

    const run = async () => {
      // Phase 1: critical data — show main content ASAP
      const p = await pokemonService.getPokemon(id);
      const speciesId = idFromUrl(p.species.url);
      const s = await pokemonService.getPokemonSpecies(speciesId);

      if (cancelled) return;
      setPokemon(p);
      setSpecies(s);
      setTE(calcEffectiveness(p.types));
      setLoading(false);

      // Phase 2: abilities + evo chain in parallel
      const evoChainId = idFromUrl(s.evolution_chain.url);
      const [abils, evoChain] = await Promise.all([
        translateAbilities(p.abilities),
        pokemonService.getEvolutionChain(evoChainId),
      ]);

      if (cancelled) return;
      setAbilities(abils);

      // Phase 3: fetch pokemon details for each unique species in the chain
      const rawPaths: RawNode[][] = [];
      getAllPaths(evoChain.chain, [], rawPaths);

      const uniqueIds = [...new Set(rawPaths.flat().map(n => n.speciesId))];
      const details = await Promise.all(uniqueIds.map(sid => pokemonService.getPokemon(sid)));
      const detailMap = new Map(uniqueIds.map((sid, i) => [sid, details[i]]));

      const resolvedPaths: EvoPath[] = rawPaths.map(path =>
        path.map(node => {
          const d = detailMap.get(node.speciesId)!;
          return {
            id: node.speciesId,
            name: node.speciesName,
            sprite: d.sprites.front_default,
            officialArt: d.sprites.other['official-artwork'].front_default,
            types: d.types,
            evolutionDetails: node.evolutionDetails,
          };
        })
      );

      if (cancelled) return;
      setEvoPaths(resolvedPaths);

      // Phase 4: alternate forms
      const altVarieties = s.varieties.filter(v => !v.is_default);
      if (altVarieties.length > 0) {
        const altDetails = await Promise.all(
          altVarieties.map(v => pokemonService.getPokemon(v.pokemon.name))
        );
        if (!cancelled) setAltForms(altDetails);
      } else {
        if (!cancelled) setAltForms([]);
      }
    };

    run().catch(() => {
      if (!cancelled) {
        setError('Não foi possível carregar os dados do Pokémon.');
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [String(id)]);

  return { pokemon, species, abilities, evoPaths, alternateForms, typeEffectiveness, loading, error };
}

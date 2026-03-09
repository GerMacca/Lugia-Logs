import { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
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
    if (m >= 4)              result.quadWeak.push(t);
    else if (m === 2)        result.weak.push(t);
    else if (m === 0.5)      result.resistant.push(t);
    else if (m > 0 && m < 1) result.quadResistant.push(t);
    else if (m === 0)        result.immune.push(t);
  }
  return result;
}

function idFromUrl(url: string): number {
  const id = url.replace(/\/$/, '').split('/').pop();
  return parseInt(id ?? '1', 10);
}

// ── Evolution chain flattening ────────────────────────────────────
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

// ── Ability translation ───────────────────────────────────────────
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

// ── Exported types ────────────────────────────────────────────────
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

// ── Hook ─────────────────────────────────────────────────────────
export function usePokemonDetail(id: string | number): UsePokemonDetailResult {

  // ── Fase 1: pokemon + espécie (em paralelo) ───────────────────
  const { data: pokemon, isLoading: loadingPokemon, error: pokemonError } = useQuery({
    queryKey: ['pokemon', String(id)],
    queryFn: () => pokemonService.getPokemon(id),
    enabled: !!id,
  });

  const speciesId = pokemon ? idFromUrl(pokemon.species.url) : null;

  const { data: species, isLoading: loadingSpecies } = useQuery({
    queryKey: ['pokemon-species', speciesId],
    queryFn: () => pokemonService.getPokemonSpecies(speciesId!),
    enabled: !!speciesId,
  });

  // ── Fase 2: habilidades (useQueries — uma query por habilidade) ─
  const abilityUrls = pokemon?.abilities.map(a => a.ability.url) ?? [];

  const abilityResults = useQueries({
    queries: abilityUrls.map(url => ({
      queryKey: ['ability', url],
      queryFn: async (): Promise<AbilityTranslation & { url: string }> => {
        const abilitySlot = pokemon!.abilities.find(a => a.ability.url === url)!;
        try {
          const res  = await fetch(url);
          const data: AbilityApiResponse = await res.json();
          const ptBr = data.names.find(n => n.language.name === 'pt-br');
          const en   = data.names.find(n => n.language.name === 'en');
          const desc = data.effect_entries.find(e => e.language.name === 'en');
          return {
            url,
            slug:        abilitySlot.ability.name,
            label:       ptBr?.name ?? en?.name ?? formatName(abilitySlot.ability.name),
            description: desc?.short_effect ?? '',
            is_hidden:   abilitySlot.is_hidden,
          };
        } catch {
          return {
            url,
            slug:        abilitySlot.ability.name,
            label:       formatName(abilitySlot.ability.name),
            description: '',
            is_hidden:   abilitySlot.is_hidden,
          };
        }
      },
      enabled: !!pokemon,
    })),
  });

  const abilities: AbilityTranslation[] | null = useMemo(() => {
    if (!pokemon) return null;
    if (abilityResults.some(r => r.isLoading)) return null;
    return abilityResults.map(r => {
      const d = r.data!;
      return { slug: d.slug, label: d.label, description: d.description, is_hidden: d.is_hidden };
    });
  }, [pokemon, abilityResults]);

  // ── Fase 3: cadeia evolutiva ──────────────────────────────────
  const evoChainId = species ? idFromUrl(species.evolution_chain.url) : null;

  const { data: evoChain } = useQuery({
    queryKey: ['evo-chain', evoChainId],
    queryFn: () => pokemonService.getEvolutionChain(evoChainId!),
    enabled: !!evoChainId,
  });

  // IDs únicos na cadeia → buscar detalhes (reutiliza cache da pokedex)
  const evoUniqueIds: number[] = useMemo(() => {
    if (!evoChain) return [];
    const paths: RawNode[][] = [];
    getAllPaths(evoChain.chain, [], paths);
    return [...new Set(paths.flat().map(n => n.speciesId))];
  }, [evoChain]);

  const evoDetailResults = useQueries({
    queries: evoUniqueIds.map(sid => ({
      queryKey: ['pokemon', String(sid)],
      queryFn: () => pokemonService.getPokemon(sid),
    })),
  });

  const evoPaths: EvoPath[] | null = useMemo(() => {
    if (!evoChain) return null;
    if (evoDetailResults.some(r => r.isLoading)) return null;

    const detailMap = new Map(
      evoUniqueIds.map((sid, i) => [sid, evoDetailResults[i].data!])
    );

    const rawPaths: RawNode[][] = [];
    getAllPaths(evoChain.chain, [], rawPaths);

    return rawPaths.map(path =>
      path.map(node => {
        const d = detailMap.get(node.speciesId)!;
        return {
          id:               node.speciesId,
          name:             node.speciesName,
          sprite:           d?.sprites.front_default ?? null,
          officialArt:      d?.sprites.other['official-artwork'].front_default ?? null,
          types:            d?.types ?? [],
          evolutionDetails: node.evolutionDetails,
        };
      })
    );
  }, [evoChain, evoUniqueIds, evoDetailResults]);

  // ── Fase 4: formas alternativas ───────────────────────────────
  const altVarieties = species?.varieties.filter(v => !v.is_default) ?? [];

  const altFormResults = useQueries({
    queries: altVarieties.map(v => ({
      queryKey: ['pokemon', v.pokemon.name],
      queryFn: () => pokemonService.getPokemon(v.pokemon.name),
      enabled: !!species,
    })),
  });

  const alternateForms: PokemonDetail[] | null = useMemo(() => {
    if (!species) return null;
    if (altFormResults.some(r => r.isLoading)) return null;
    return altFormResults.map(r => r.data!).filter(Boolean);
  }, [species, altFormResults]);

  // ── Type effectiveness ────────────────────────────────────────
  const typeEffectiveness = useMemo(
    () => pokemon ? calcEffectiveness(pokemon.types) : { quadWeak: [], weak: [], resistant: [], quadResistant: [], immune: [] },
    [pokemon]
  );

  const loading  = loadingPokemon || (!!pokemon && loadingSpecies);
  const error    = pokemonError ? 'Não foi possível carregar os dados do Pokémon.' : null;

  return { pokemon: pokemon ?? null, species: species ?? null, abilities, evoPaths, alternateForms, typeEffectiveness, loading, error };
}

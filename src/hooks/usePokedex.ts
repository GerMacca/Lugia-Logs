import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { pokemonService } from '../services/pokemon.service';
import type { PokemonDetail } from '../types/pokemon.types';

const TOTAL_POKEMON = 1025;
const BATCH_SIZE = 100;

function idFromUrl(url: string): number {
  const id = url.replace(/\/$/, '').split('/').pop();
  return parseInt(id ?? '1', 10);
}

// Faixas de ID por geração (PokeAPI)
const GEN_RANGES: [number, number][] = [
  [1, 151],   [152, 251],  [252, 386],
  [387, 493], [494, 649],  [650, 721],
  [722, 809], [810, 905],  [906, 1010],
];

function getGen(id: number): number {
  for (let i = 0; i < GEN_RANGES.length; i++) {
    if (id >= GEN_RANGES[i][0] && id <= GEN_RANGES[i][1]) return i + 1;
  }
  return 1;
}

export type SortBy =
  | 'id'
  | 'name'
  | 'weight-asc'
  | 'weight-desc'
  | 'height-asc'
  | 'height-desc';

export interface UsePokedexResult {
  pokemon: PokemonDetail[];
  loading: boolean;      // true enquanto o primeiro batch não chegou
  loadingAll: boolean;   // true enquanto ainda há batches sendo carregados
  error: string | null;
  total: number;
  search: string;
  setSearch: (v: string) => void;
  typeFilter: string[];
  setTypeFilter: (v: string[]) => void;
  genFilter: number[];
  setGenFilter: (v: number[]) => void;
  heightFilter: string[];
  setHeightFilter: (v: string[]) => void;
  weightFilter: string[];
  setWeightFilter: (v: string[]) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
}

export function usePokedex(): UsePokedexResult {
  const queryClient = useQueryClient();

  const [all, setAll]           = useState<PokemonDetail[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [search, setSearch]               = useState('');
  const [typeFilter, setTypeFilter]       = useState<string[]>([]);
  const [genFilter, setGenFilter]         = useState<number[]>([]);
  const [heightFilter, setHeightFilter]   = useState<string[]>([]);
  const [weightFilter, setWeightFilter]   = useState<string[]>([]);
  const [sortBy, setSortBy]               = useState<SortBy>('id');

  // ── Passo 1: buscar lista de nomes/URLs (1 request, cache eterno) ─
  const { data: nameList, error: listError } = useQuery({
    queryKey: ['pokemon-name-list'],
    queryFn: () => pokemonService.listPokemons(TOTAL_POKEMON, 0),
  });

  useEffect(() => {
    if (listError) setError('Não foi possível carregar os Pokémons.');
  }, [listError]);

  // ─ Passo 2: buscar detalhes em batches, populando o cache RQ 
  useEffect(() => {
    if (!nameList) return;
    let cancelled = false;

    const fetchAll = async () => {
      const urls = nameList.results;
      const accumulated: PokemonDetail[] = [];

      for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        if (cancelled) return;

        const batch = urls.slice(i, i + BATCH_SIZE);
        const ids   = batch.map(r => idFromUrl(r.url));

        const details = await Promise.all(
          ids.map(id => {
            // Reutiliza cache do React Query (ex: pokemon já visitado na detail page)
            const cached = queryClient.getQueryData<PokemonDetail>(['pokemon', String(id)]);
            if (cached) return Promise.resolve(cached);

            return pokemonService.getPokemon(id).then(p => {
              // Popula o cache para que a detail page seja instantânea
              queryClient.setQueryData(['pokemon', String(id)], p);
              return p;
            });
          })
        );

        if (cancelled) return;
        accumulated.push(...details);
        setAll([...accumulated]); // atualiza progressivamente
      }

      if (!cancelled) setLoadingAll(false);
    };

    fetchAll().catch(() => {
      if (!cancelled) {
        setError('Não foi possível carregar os Pokémons.');
        setLoadingAll(false);
      }
    });

    return () => { cancelled = true; };
  }, [nameList, queryClient]);

  const ALIASES: Record<string, string[]> = {
    'gorda balofa rosa redonda': ['chansey'],
    'goats': ['lugia', 'dragonite', 'gengar'],
    'eeveelutions': ['jolteon','flareon','vaporeon','espeon','umbreon','glaceon','leafeon','sylveon']
  }

  // ── Filtros + ordenação ───────────────────────────────────────────
  const filtered = useMemo(() => {
    return all
      .filter(p => {
        const q = search.toLowerCase().trim();
        const aliasedNames = Object.entries(ALIASES)
          .filter(([alias]) => alias === q)
          .flatMap(([, names]) => names);
        const matchesSearch = !q || p.name.toLowerCase().includes(q) || aliasedNames.includes(p.name.toLowerCase());
        const matchesType =
          typeFilter.length === 0 ||
          p.types.some(t => typeFilter.includes(t.type.name));
        const matchesGen =
          genFilter.length === 0 ||
          genFilter.includes(getGen(p.id));
        const matchesHeight =
          heightFilter.length === 0 ||
          heightFilter.some(bucket => {
            if (bucket === 'small')  return p.height <= 5;
            if (bucket === 'medium') return p.height >= 6 && p.height <= 15;
            return p.height >= 16;
          });
        const matchesWeight =
          weightFilter.length === 0 ||
          weightFilter.some(bucket => {
            if (bucket === 'light')  return p.weight <= 100;
            if (bucket === 'medium') return p.weight >= 101 && p.weight <= 1000;
            return p.weight >= 1001;
          });
        return matchesSearch && matchesType && matchesGen && matchesHeight && matchesWeight;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':        return a.name.localeCompare(b.name);
          case 'weight-asc':  return a.weight - b.weight;
          case 'weight-desc': return b.weight - a.weight;
          case 'height-asc':  return a.height - b.height;
          case 'height-desc': return b.height - a.height;
          default:            return a.id - b.id;
        }
      });
  }, [all, search, typeFilter, genFilter, heightFilter, weightFilter, sortBy]);

  return {
    pokemon: filtered,
    loading: all.length === 0 && loadingAll,
    loadingAll,
    error,
    total: nameList?.results.length ?? 0,
    search,       setSearch,
    typeFilter,   setTypeFilter,
    genFilter,    setGenFilter,
    heightFilter, setHeightFilter,
    weightFilter, setWeightFilter,
    sortBy,       setSortBy,
  };
}

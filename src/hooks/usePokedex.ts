import { useState, useEffect, useCallback, useRef } from 'react';
import { pokemonService } from '../services/pokemon.service';
import type { PokemonDetail } from '../types/pokemon.types';

const PAGE_SIZE = 50;

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
  loading: boolean;
  loadingMore: boolean;
  isLoadingAll: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
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
  const [all, setAll]         = useState<PokemonDetail[]>([]);
  const [offset, setOffset]   = useState(0);
  const [total, setTotal]     = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef                = useRef(false); // guard síncrono contra race condition
  const [error, setError]     = useState<string | null>(null);

  const [search, setSearch]               = useState('');
  const [typeFilter, setTypeFilter]       = useState<string[]>([]);
  const [genFilter, setGenFilter]         = useState<number[]>([]);
  const [heightFilter, setHeightFilter]   = useState<string[]>([]);
  const [weightFilter, setWeightFilter]   = useState<string[]>([]);
  const [sortBy, setSortBy]               = useState<SortBy>('id');

  const fetchBatch = useCallback(async (batchOffset: number, append: boolean) => {
    try {
      const list = await pokemonService.listPokemons(PAGE_SIZE, batchOffset);
      if (!append) setTotal(list.count);
      setHasMore(list.next !== null);

      const details = await Promise.all(
        list.results.map(r => pokemonService.getPokemon(idFromUrl(r.url)))
      );

      setAll(prev => append ? [...prev, ...details] : details);
    } catch {
      setError('Não foi possível carregar os Pokémons.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchBatch(0, false);
  }, [fetchBatch]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const next = offset + PAGE_SIZE;
    setOffset(next);
    fetchBatch(next, true);
  }, [hasMore, offset, fetchBatch]);

  const filtered = all
    .filter(p => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || p.name.toLowerCase().includes(q);
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
          return p.height >= 16; // 'large'
        });
      const matchesWeight =
        weightFilter.length === 0 ||
        weightFilter.some(bucket => {
          if (bucket === 'light')  return p.weight <= 100;
          if (bucket === 'medium') return p.weight >= 101 && p.weight <= 1000;
          return p.weight >= 1001; // 'heavy'
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

  // Auto-load quando filtros ativos não encontram resultados nos dados carregados
  // (ex: selecionar Gen 2 com só Gen 1 carregada → continua paginando até achar)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (filtered.length === 0 && hasMore && !loading && !loadingMoreRef.current && all.length > 0) {
      loadMore();
    }
  }, [filtered.length, hasMore, loading, loadingMore, all.length, loadMore]);

  // Auto-load todos os dados quando ordenação não-padrão está ativa
  // (garante que a lista seja completamente ordenada antes de exibir)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (sortBy !== 'id' && hasMore && !loading && !loadingMoreRef.current) {
      loadMore();
    }
  }, [sortBy, hasMore, loading, loadingMore, loadMore]);

  const isLoadingAll = sortBy !== 'id' && hasMore;

  return {
    pokemon: filtered,
    loading,
    loadingMore,
    isLoadingAll,
    error,
    hasMore,       // nunca desabilitado — scroll continua carregando mesmo com filtro
    loadMore,
    total,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    genFilter,
    setGenFilter,
    heightFilter,
    setHeightFilter,
    weightFilter,
    setWeightFilter,
    sortBy,
    setSortBy,
  };
}

import { useState, useEffect } from 'react';

import { pokemonService } from '../services/pokemon.service';
import type { PokemonDetail } from '../types/pokemon.types';

const POKEMON_COUNT = 1010; // mesmo valor de usePokemonOfTheDay

function getTodayId(): number {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  // Knuth multiplicative hash — non-sequential for consecutive days
  const hash = Math.imul(seed, 0x9e3779b1) >>> 0;
  return (hash % POKEMON_COUNT) + 1;
}

export function usePokemonOfDay() {
  const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pokemonService
      .getPokemon(getTodayId())
      .then(setPokemon)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { pokemon, loading };
}

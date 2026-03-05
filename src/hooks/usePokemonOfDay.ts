import { useState, useEffect } from 'react';
import { pokemonService } from '../services/pokemon.service';
import type { PokemonDetail } from '../types/pokemon.types';

const POKEMON_COUNT = 1010; // mesmo valor de usePokemonOfTheDay

function getTodayId(): number {
  // Mesma fórmula de usePokemonOfTheDay — garante o mesmo Pokémon em todas as páginas
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return (seed % POKEMON_COUNT) + 1;
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

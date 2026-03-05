import { useState, useEffect } from 'react';

import { pokemonService } from '../services/pokemon.service';
import type { PokemonDetail, PokemonSpecies } from '../types/pokemon.types';

const POKEMON_COUNT = 1010;

function getDailyId(): number {
  const d = new Date();
  const seed =
    d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return (seed % POKEMON_COUNT) + 1;
}

const formatFallback = (name: string) =>
  name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

interface AbilityApiResponse {
  names: Array<{ language: { name: string }; name: string }>;
}

export interface AbilityTranslation {
  slug: string;
  label: string;
  is_hidden: boolean;
}

export interface PokemonOfTheDayData {
  pokemon: PokemonDetail | null;
  species: PokemonSpecies | null;
  abilities: AbilityTranslation[];
  loading: boolean;
  error: string | null;
}

export function usePokemonOfTheDay(): PokemonOfTheDayData {
  const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [abilities, setAbilities] = useState<AbilityTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = getDailyId();
    setLoading(true);
    setError(null);

    Promise.all([
      pokemonService.getPokemon(id),
      pokemonService.getPokemonSpecies(id),
    ])
      .then(async ([p, s]) => {
        setPokemon(p);
        setSpecies(s);

        // Busca nome traduzido de cada habilidade em paralelo
        const translatedAbilities = await Promise.all(
          p.abilities.map(async ({ ability, is_hidden }) => {
            try {
              const res = await fetch(ability.url);
              const data: AbilityApiResponse = await res.json();
              const ptBr = data.names.find(n => n.language.name === 'pt-br');
              const en   = data.names.find(n => n.language.name === 'en');
              return {
                slug: ability.name,
                label: ptBr?.name ?? en?.name ?? formatFallback(ability.name),
                is_hidden,
              };
            } catch {
              return {
                slug: ability.name,
                label: formatFallback(ability.name),
                is_hidden,
              };
            }
          })
        );

        setAbilities(translatedAbilities);
      })
      .catch(() => setError('Não foi possível carregar o Pokémon do dia.'))
      .finally(() => setLoading(false));
  }, []);

  return { pokemon, species, abilities, loading, error };
}

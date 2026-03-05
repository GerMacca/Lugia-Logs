import type {
  PokemonListResponse,
  PokemonDetail,
  PokemonSpecies,
  GenerationListResponse,
  Generation,
  PokemonTypeResponse,
  EvolutionChainResponse,
} from '../types/pokemon.types';

const BASE_URL = 'https://pokeapi.co/api/v2';

async function get<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`[PokeAPI] ${response.status} ${response.statusText} — ${endpoint}`);
  }
  return response.json() as Promise<T>;
}

export const pokemonService = {
  listPokemons: (limit = 20, offset = 0): Promise<PokemonListResponse> =>
    get<PokemonListResponse>(`/pokemon?limit=${limit}&offset=${offset}`),

  getPokemon: (idOrName: string | number): Promise<PokemonDetail> =>
    get<PokemonDetail>(`/pokemon/${idOrName}`),

  getPokemonSpecies: (idOrName: string | number): Promise<PokemonSpecies> =>
    get<PokemonSpecies>(`/pokemon-species/${idOrName}`),

  listGenerations: (): Promise<GenerationListResponse> =>
    get<GenerationListResponse>('/generation'),

  getGeneration: (idOrName: string | number): Promise<Generation> =>
    get<Generation>(`/generation/${idOrName}`),

  getType: (typeName: string): Promise<PokemonTypeResponse> =>
    get<PokemonTypeResponse>(`/type/${typeName}`),

  getEvolutionChain: (id: number): Promise<EvolutionChainResponse> =>
    get<EvolutionChainResponse>(`/evolution-chain/${id}`),
};

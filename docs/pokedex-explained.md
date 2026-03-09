# Pokédex — Como funciona

Documentação completa do sistema de carregamento, filtros, ordenação e cache da PokedexPage.

---

## Visão geral

A Pokédex funciona com quatro camadas:

```
PokedexPage.tsx          → UI: grid de cards, barra de filtros, skeletons, sidebar
usePokedex.ts            → Lógica: estado, carregamento progressivo, filtros, ordenação
pokemon.service.ts       → Dados: chamadas à PokéAPI
React Query (QueryClient) → Cache: armazena dados entre navegações
```

---

## Estratégia de carregamento

### Antes (infinite scroll)

A versão anterior carregava 50 pokémons por vez, dependendo de scroll para disparar o próximo batch. Isso causava:
- Filtros mostrando resultados incompletos enquanto nem todos os pokémons estavam carregados
- Estado zerado ao voltar para a Pokédex (sem cache)
- Mensagem temporária "Nenhum Pokémon encontrado" ao pesquisar algo ainda não carregado

### Agora (load-all com React Query)

A nova estratégia carrega **todos os ~1025 pokémons** em sequência ao abrir a Pokédex:

```
Passo 1: GET /pokemon?limit=1025  →  lista com todos os nomes/URLs (1 request)

Passo 2: Para cada batch de 100 pokémons (Promise.all em paralelo):
  GET /pokemon/{id}  ×100
  → armazena cada um no cache React Query
  → atualiza o grid progressivamente
```

Total: ~11 batches de 100 requests cada. O grid vai sendo preenchido conforme os batches chegam.

---

## React Query — cache e performance

O `QueryClient` é criado em `main.tsx` com:

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,      // dados nunca ficam "stale" (PokéAPI é imutável)
      gcTime: 30 * 60 * 1000,  // mantém no cache por 30min após desuso
      retry: 1,
    },
  },
})
```

### Por que staleTime: Infinity?

Dados da PokéAPI nunca mudam. Sem `staleTime: Infinity`, o React Query faria refetch em background toda vez que a janela ganhar foco ou o componente remontar. Desnecessário aqui.

### Reuso de cache entre Pokédex e Detail Page

Cada pokémon carregado pelo batch da Pokédex é armazenado no cache com:

```ts
queryClient.setQueryData(['pokemon', String(id)], pokemonDetail)
```

Quando o usuário abre a detail page de um pokémon já carregado, a query `['pokemon', id]` resolve **instantaneamente do cache** — zero requests de rede.

### Segunda visita à Pokédex

Na remontagem do componente, `nameList` já está no cache React Query. O `useEffect` de batch-fetch verifica o cache antes de fazer cada request:

```ts
const cached = queryClient.getQueryData<PokemonDetail>(['pokemon', String(id)]);
if (cached) return Promise.resolve(cached); // sem request
```

Os ~1025 pokémons são restaurados do cache em milissegundos.

---

## Scroll para pokémon ao voltar da detail page

Ao navegar de volta para a Pokédex vinda da Detail Page, a página rola suavemente até o card do pokémon que estava sendo visualizado.

**Implementação:**

1. O botão "Pokédex" na detail page navega com `state: { scrollToId: displayId }`
2. A Pokédex lê `location.state.scrollToId` ao montar
3. Um `useEffect` observa `pokemon` (lista filtrada) — quando o target aparece no DOM, chama `scrollIntoView({ behavior: 'smooth', block: 'center' })`
4. Como todos os pokémons carregam progressivamente e automaticamente, o target aparece logo sem lógica extra

```ts
const [scrollTargetId, setScrollTargetId] = useState<number | null>(
  () => location.state?.scrollToId ?? null
);

useEffect(() => {
  if (!scrollTargetId) return;
  if (!pokemon.some(p => p.id === scrollTargetId)) return;
  requestAnimationFrame(() => {
    document.getElementById(`pokemon-card-${scrollTargetId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setScrollTargetId(null);
  });
}, [scrollTargetId, pokemon]);
```

---

## Filtros

Todos os filtros são **client-side** — operam sobre `all` em memória, sem requisições extras.

O array filtrado e ordenado é calculado com `useMemo`, recalculando apenas quando `all` ou os filtros mudam.

### Busca por nome

- Campo de texto reativo (`onChange`) — filtra enquanto digita
- Comparação case-insensitive: `p.name.toLowerCase().includes(query)`

### Tipo

- Chips clicáveis na sidebar (desktop) e no painel overlay (mobile)
- `typeFilter: string[]` — seleção múltipla
- Lógica **OR**: pokémon aparece se tiver **qualquer** tipo selecionado

### Geração

- Chips Gen 1–9, `genFilter: number[]` — seleção múltipla, lógica OR
- A geração é calculada pelo ID usando `GEN_RANGES`:

```ts
const GEN_RANGES: [number, number][] = [
  [1, 151],   [152, 251],  [252, 386],
  [387, 493], [494, 649],  [650, 721],
  [722, 809], [810, 905],  [906, 1010],
];
```

### Altura

- Buckets: Pequeno (≤ 0,5m), Médio (0,6–1,5m), Grande (≥ 1,6m)
- Valores em decímetros (unidade da PokéAPI)

### Peso

- Buckets: Leve (≤ 10kg), Médio (10–100kg), Pesado (≥ 100kg)
- Valores em hectogramas (unidade da PokéAPI)

### Combinação de filtros

Todos aplicados juntos com lógica **AND**:
> nome contém X **E** tem algum tipo Y **E** é da geração Z **E** tem altura W **E** tem peso V

---

## Ordenação

`sortBy: SortBy` — opções: `'id'` (padrão), `'name'`, `'weight-asc'`, `'weight-desc'`, `'height-asc'`, `'height-desc'`.

### isLoadingAll

Com load-all, ordenação não-padrão pode mostrar resultados parcialmente ordenados enquanto os batches chegam (pokémons novos seriam inseridos no meio da lista já visível).

Para evitar isso, `PokedexPage` computa:

```ts
const isLoadingAll = loadingAll && sortBy !== 'id';
```

Enquanto `isLoadingAll` for `true`:
- O grid mostra **skeletons** em vez dos pokémons parcialmente ordenados
- Uma mensagem "Carregando todos os Pokémons para ordenar…" é exibida

Quando `loadingAll` vira `false` (todos os batches completos), a lista ordenada é exibida de uma vez.

---

## Estado de busca sem resultados

Quando `isFiltered && pokemon.length === 0 && loadingAll`, a UI exibe uma animação de "Buscando Pokémon" com 3 pontos pulsando em vez de "Nenhum encontrado" — porque o pokémon pode estar em um batch ainda não carregado.

---

## Estado completo do hook (usePokedex)

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `all` | `PokemonDetail[]` | Todos os pokémons carregados até o momento |
| `loadingAll` | `boolean` | `true` enquanto ainda há batches em andamento |
| `error` | `string \| null` | Erro de rede, se houver |
| `search` | `string` | Texto da busca por nome |
| `typeFilter` | `string[]` | Tipos selecionados |
| `genFilter` | `number[]` | Gerações selecionadas |
| `heightFilter` | `string[]` | Buckets de altura selecionados |
| `weightFilter` | `string[]` | Buckets de peso selecionados |
| `sortBy` | `SortBy` | Critério de ordenação atual |

O hook retorna `pokemon` (array filtrado/ordenado via `useMemo`) — a UI nunca acessa `all` diretamente.

`loading` é derivado: `all.length === 0 && loadingAll` — `true` somente enquanto o primeiro batch não chegou.

---

## usePokemonDetail — como funciona

O hook da detail page também usa React Query:

| Query key | Dados | Reuso |
|-----------|-------|-------|
| `['pokemon', id]` | Dados do pokémon | Reutiliza cache da Pokédex |
| `['pokemon-species', speciesId]` | Espécie (genus, evo chain URL, variedades) | Cache compartilhado entre forms |
| `['ability', url]` | Tradução de habilidade (PT-BR/EN) | Cache por URL da ability |
| `['evo-chain', evoChainId]` | Cadeia evolutiva completa | Compartilhado entre evoluções |
| `['pokemon', sid]` | Detalhes de cada pokémon na cadeia | Reutiliza cache |

### Fases de carregamento

1. **Fase 1** — `loading = true`: busca pokémon + espécie. Mostra skeleton.
2. **loading = false**: exibe hero (artwork, tipos, stats, fraquezas). Seções secundárias aparecem como `null` (sem skeleton — aparecem quando chegarem).
3. **Fase 2** — em paralelo: habilidades (`useQueries`), evo chain, formas alternativas. Aparecem progressivamente sem bloquear a UI.

---

## Layout da página

### Mobile

```
[Header]
[Barra de busca] [Botão Filtros ▼]
  └── Painel overlay (tipo, geração, altura, peso, ordenação)
[Grid 2 colunas]
```

### Desktop (≥ 1024px)

```
[Header]
[Barra de busca] [Slider colunas] [Botão Filtros]
[Sidebar filtros] | [Grid 3–5 colunas] | [Sidebar Pokémon do Dia]
```

---

## Controle de colunas (slider)

Um `<input type="range" min=3 max=5>` na barra de filtros (visível apenas em desktop `md+`) permite ao usuário escolher entre 3, 4 ou 5 pokémons por linha.

Funciona via CSS custom properties passadas inline no container do grid:

```tsx
style={{
  '--cols': rgValue,
  '--watermark-size': rgValue === 3 ? '68px' : rgValue === 4 ? '58px' : '42px',
}}
```

O SCSS usa `repeat(var(--cols, 3), 1fr)` em `md+`. O `--watermark-size` ajusta o número `#XXXX` no background do card proporcionalmente ao tamanho da coluna. Em mobile o grid permanece fixo em 2 colunas.

---

## PokemonDetailPage — features adicionais

### Mascote de Capa

Um mapa estático `COVER_POKEMON: Record<number, string[]>` associa IDs de pokémon aos jogos em que aparecem na capa. Nenhuma request extra — lookup de `O(1)` em tempo de render.

Quando o pokémon atual é mascote de algum jogo, a UI exibe:
- Um badge `[MASCOTE]` em `heroMeta`, ao lado de Lendário/Mítico
- Uma linha "Capa em → `[Pokémon Red]` `[Pokémon FireRed]`" entre os tipos e o flavor text

Cobre 26 jogos, de Red/Blue até Scarlet/Violet.

### Localizações (lazy)

A seção "Localizações" usa `IntersectionObserver` com `rootMargin: '300px'` para disparar o fetch apenas quando o usuário está próximo de rolar até ela:

```ts
// Só ativa a query quando a seção entra no viewport
const { data } = useQuery({
  queryKey: ['encounters', pokemonId],
  queryFn:  () => pokemonService.getPokemonEncounters(pokemonId),
  enabled:  inView,          // controlado pelo IntersectionObserver
  staleTime: Infinity,
});
```

Endpoint: `GET /pokemon/{id}/encounters`

Os dados são agrupados por versão de jogo e exibidos em um **masonry layout** (`CSS columns`) — cada card de jogo ocupa a altura que precisa sem forçar linhas de altura igual.

Cada entrada mostra: **local | método | faixa de nível | % de chance**.

Pokémons sem encontros selvagens (lendários, etc.) exibem uma mensagem específica.

### Shiny toggle — reset ao navegar

Ao navegar para outro pokémon, `shiny` e `displayedSrc` são resetados **no mesmo effect** (`[id]`), evitando o caso em que a imagem shiny do novo pokémon era exibida antes do state ser zerado:

```ts
useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'instant' });
  setShiny(false);
  setDisplayedSrc(null); // cancela qualquer preload em andamento
}, [id]);
```

---

## Arquivos da feature

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/main.tsx` | Configura `QueryClient` e `QueryClientProvider` |
| `src/hooks/usePokedex.ts` | Carregamento progressivo, filtros, ordenação, integração React Query |
| `src/hooks/usePokemonDetail.ts` | Detail page: queries encadeadas com React Query |
| `src/hooks/usePokemonOfDay.ts` | Pokémon do dia determinístico |
| `src/pages/PokedexPage/PokedexPage.tsx` | UI: grid, filtros, sidebar, skeleton, scroll-to-pokemon, slider de colunas |
| `src/pages/PokedexPage/PokedexPage.module.scss` | Estilos da página |
| `src/pages/PokemonDetailPage/PokemonDetailPage.tsx` | Detail page: mascote de capa, localizações lazy, shiny toggle |
| `src/services/pokemon.service.ts` | Chamadas à PokéAPI (inclui `getPokemonEncounters`) |
| `src/types/pokemon.types.ts` | Tipos TypeScript dos dados da API (inclui `PokemonEncounterEntry`) |

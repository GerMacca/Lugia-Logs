# Pokédex — Como funciona

Documentação completa do sistema de carregamento, filtros, ordenação e infinite scroll da PokedexPage.

---

## Visão geral

A Pokédex funciona com três camadas:

```
PokedexPage.tsx          → UI: grid de cards, barra de filtros, skeletons, sidebar
usePokedex.ts            → Lógica: estado, paginação, filtros, ordenação
pokemon.service.ts       → Dados: chamadas à PokéAPI
```

---

## Fluxo de requisições

### Carregamento inicial

Quando a página abre, o hook busca o primeiro lote de 50 pokémons:

```
GET /pokemon?limit=50&offset=0
  → retorna lista com nomes + URLs

Para cada resultado (Promise.all):
  GET /pokemon/{id}
  → retorna detalhes completos (tipos, sprites, stats, peso, altura, etc.)
```

Isso resulta em **51 requisições simultâneas** por batch: 1 para a lista + 50 para os detalhes.

### Cache HTTP

A PokéAPI envia headers `Cache-Control` corretos. O navegador armazena cada resposta em cache automaticamente — na segunda visita, todas as ~1350 requisições são resolvidas localmente, sem rede. Não é necessário implementar cache manual (localStorage, etc.).

---

## Infinite scroll

Conforme o usuário rola a página, batches adicionais são carregados:

```
offset 0   → pokémons #1  – #50   (carregamento inicial)
offset 50  → pokémons #51 – #100  (1º scroll)
offset 100 → pokémons #101 – #150 (2º scroll)
...até hasMore === false
```

O trigger é um `div` sentinel de 1px posicionado **abaixo e fora do grid**. O `IntersectionObserver` detecta quando ele entra na viewport com `rootMargin: '300px'` (300px antes de ser visível) e chama `loadMore()`.

**Todos os pokémons carregados acumulam no array `all` do hook.** Nunca são descartados.

### Por que o sentinel fica fora do grid?

Se ficasse dentro do grid (calculado por índice), seria um elemento DOM diferente toda vez que um filtro mudasse — o observer continuaria apontando para o nó antigo (desmontado) e nunca mais dispararia.

Fora do grid, é sempre o mesmo elemento DOM, independente de quantos cards estão visíveis.

---

## Filtros

Todos os filtros são **client-side** — operam sobre `all` em memória, sem requisições extras.

### Busca por nome

- Campo de texto reativo (`onChange`) — filtra enquanto digita
- Comparação case-insensitive: `p.name.toLowerCase().includes(query)`

### Tipo

- Chips clicáveis na sidebar (desktop) e no painel overlay (mobile)
- `typeFilter: string[]` — seleção múltipla
- Lógica **OR**: pokémon aparece se tiver **qualquer** tipo selecionado
- `p.types.some(t => typeFilter.includes(t.type.name))`

### Geração

- Chips Gen 1–9
- `genFilter: number[]` — seleção múltipla, mesma lógica OR
- A geração de cada pokémon é calculada pelo ID usando `GEN_RANGES`:

```ts
const GEN_RANGES: [number, number][] = [
  [1, 151],   [152, 251],  [252, 386],
  [387, 493], [494, 649],  [650, 721],
  [722, 809], [810, 905],  [906, 1010],
];
```

### Altura

- Buckets: Pequeno (≤ 0,5m / `height ≤ 5`), Médio (0,6–1,5m / `height 6–15`), Grande (≥ 1,6m / `height ≥ 16`)
- Valores em decímetros (unidade da PokéAPI)
- `heightFilter: string[]` — seleção múltipla, lógica OR

### Peso

- Buckets: Leve (≤ 10kg / `weight ≤ 100`), Médio (10–100kg / `weight 101–1000`), Pesado (≥ 100kg / `weight ≥ 1001`)
- Valores em hectogramas (unidade da PokéAPI)
- `weightFilter: string[]` — seleção múltipla, lógica OR

### Combinação de filtros

Todos os filtros são aplicados juntos com lógica **AND**:
> nome contém X **E** tem algum tipo Y **E** é da geração Z **E** tem altura W **E** tem peso V

---

## Ordenação

`sortBy: SortBy` — opções disponíveis: `'id'` (padrão) e `'name'` (A–Z).

### Problema: ordenação + lazy loading

Ordenação não-padrão (ex: A–Z) é incompatível com lazy loading progressivo: conforme novos batches chegam, pokémons com letras anteriores aparecem no meio da lista já renderizada — causando saltos visuais.

### Solução: isLoadingAll

Quando `sortBy !== 'id'`, o hook ativa o modo **"carregar tudo primeiro"**:

```
isLoadingAll = sortBy !== 'id' && hasMore
```

Enquanto `isLoadingAll` for `true`:
- O grid mostra **skeletons** (não os pokémons parcialmente ordenados)
- Uma mensagem "Carregando todos os Pokémons para ordenar…" é exibida
- Um `useEffect` dispara automaticamente cada batch sem precisar de scroll
- O sentinel é ocultado (o auto-load substitui o IntersectionObserver)

Quando `hasMore` vira `false` (todos carregados), `isLoadingAll` vira `false` e o grid exibe a lista completa e corretamente ordenada de uma vez.

---

## Scroll com filtro ativo e filtro sem resultados

**O infinite scroll continua funcionando mesmo com filtro ativo.**

Se o filtro retorna zero resultados nos dados já carregados, um segundo `useEffect` dispara `loadMore()` automaticamente:

```ts
useEffect(() => {
  if (filtered.length === 0 && hasMore && !loading && !loadingMoreRef.current && all.length > 0) {
    loadMore();
  }
}, [filtered.length, hasMore, loading, loadingMore, all.length, loadMore]);
```

Isso continua batch a batch até encontrar resultados ou esgotar todos os pokémons.

**Exemplo:** selecionar Gen 2 com apenas Gen 1 carregada:
```
genFilter = [2], all = 50 pokémons (Gen 1)
→ filtered.length === 0 → loadMore()
→ all = 100 → ainda Gen 1 → filtered.length === 0 → loadMore()
→ all = 150 → pokémons #152+ aparecem → filtered.length > 0 → para
```

---

## Race condition: guarda síncrona com useRef

**Problema:** tanto o `IntersectionObserver` quanto o `useEffect` de auto-load podem chamar `loadMore()` no mesmo render, antes que `setLoadingMore(true)` seja processado pelo React — causando dois batches simultâneos e pokémons duplicados.

**Solução:** `loadingMoreRef = useRef(false)` funciona como mutex síncrono:

```ts
const loadMore = useCallback(() => {
  if (loadingMoreRef.current || !hasMore) return;  // guarda
  loadingMoreRef.current = true;                    // trava imediatamente
  setLoadingMore(true);
  fetchBatch(next, true);
}, [...]);

// No finally do fetchBatch:
loadingMoreRef.current = false;  // libera
```

Diferente de `useState`, `useRef` não causa re-render e é lido/escrito de forma síncrona — por isso funciona como guarda contra race conditions.

---

## Estado completo do hook (usePokedex)

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `all` | `PokemonDetail[]` | Todos os pokémons carregados até agora |
| `offset` | `number` | Posição atual na paginação global |
| `total` | `number` | Total de pokémons na PokéAPI (~1302) |
| `hasMore` | `boolean` | Se ainda há batches disponíveis |
| `loading` | `boolean` | Carregamento inicial em andamento |
| `loadingMore` | `boolean` | Batch adicional em andamento |
| `loadingMoreRef` | `MutableRefObject<boolean>` | Guarda síncrona contra race condition |
| `isLoadingAll` | `boolean` | `sortBy !== 'id' && hasMore` |
| `search` | `string` | Texto da busca por nome |
| `typeFilter` | `string[]` | Tipos selecionados |
| `genFilter` | `number[]` | Gerações selecionadas |
| `heightFilter` | `string[]` | Buckets de altura selecionados |
| `weightFilter` | `string[]` | Buckets de peso selecionados |
| `sortBy` | `SortBy` | Critério de ordenação atual |

O hook retorna `pokemon` (array filtrado e ordenado) em vez de `all` — a UI nunca acessa o array bruto.

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
[Barra de busca]
[Sidebar filtros] | [Grid 3–4 colunas] | [Sidebar Pokémon do Dia]
```

### Sidebar esquerda (filtros)
- Ordenação (select)
- Tipo (18 chips coloridos)
- Geração (9 chips)
- Altura (3 chips)
- Peso (3 chips)
- Scroll interno quando o conteúdo ultrapassa a viewport

### Sidebar direita (Pokémon do Dia)
- Aparece em telas ≥ 1280px
- Pokémon determinístico por data (seed = dia do ano)
- Mostra arte oficial, tipos, HP/Ataque/Defesa/Velocidade com barras

---

## Arquivos da feature

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/hooks/usePokedex.ts` | Toda a lógica de estado, paginação, filtros e ordenação |
| `src/hooks/usePokemonOfDay.ts` | Pokémon do dia determinístico |
| `src/pages/PokedexPage/PokedexPage.tsx` | UI completa: grid, filtros, sidebar, skeleton, scroll |
| `src/pages/PokedexPage/PokedexPage.module.scss` | Estilos da página |
| `src/services/pokemon.service.ts` | Chamadas à PokéAPI (`listPokemons`, `getPokemon`, `getType`, etc.) |
| `src/types/pokemon.types.ts` | Tipos TypeScript dos dados da API |

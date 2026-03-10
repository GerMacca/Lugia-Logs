import { useRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import MainLayout from '../../layouts/MainLayout/MainLayout';
import { usePokedex } from '../../hooks/usePokedex';
import type { SortBy } from '../../hooks/usePokedex';
import { usePokemonOfDay } from '../../hooks/usePokemonOfDay';
import type { PokemonDetail } from '../../types/pokemon.types';
import psyduck from '../../assets/psyduck.png'

import styles from './PokedexPage.module.scss';

const PAGE_SIZE = 50;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function hexToAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Dados de tipos ────────────────────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  normal: { bg: '#9a9a6e', text: '#fff' },
  fire: { bg: '#f08030', text: '#fff' },
  water: { bg: '#6890f0', text: '#fff' },
  electric: { bg: '#f8d030', text: '#1a1210' },
  grass: { bg: '#78c850', text: '#fff' },
  ice: { bg: '#98d8d8', text: '#1a2a2a' },
  fighting: { bg: '#c03028', text: '#fff' },
  poison: { bg: '#a040a0', text: '#fff' },
  ground: { bg: '#e0c068', text: '#1a1a08' },
  flying: { bg: '#a890f0', text: '#fff' },
  psychic: { bg: '#f85888', text: '#fff' },
  bug: { bg: '#a8b820', text: '#fff' },
  rock: { bg: '#b8a038', text: '#fff' },
  ghost: { bg: '#705898', text: '#fff' },
  dragon: { bg: '#7038f8', text: '#fff' },
  dark: { bg: '#705848', text: '#fff' },
  steel: { bg: '#b8b8d0', text: '#1a1a28' },
  fairy: { bg: '#ee99ac', text: '#1a0810' },
};

const TYPES = Object.keys(TYPE_COLORS);

// ── Gerações ──────────────────────────────────────────────────────
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// ── Buckets de altura (decímetros) ────────────────────────────────
const HEIGHT_BUCKETS = [
  { key: 'small', label: 'Small', desc: '≤ 0.5m' },
  { key: 'medium', label: 'Medium', desc: '0.6–1.5m' },
  { key: 'large', label: 'Large', desc: '≥ 1.6m' },
];

// ── Buckets de peso (hectogramas) ─────────────────────────────────
const WEIGHT_BUCKETS = [
  { key: 'light', label: 'Light', desc: '≤ 10kg' },
  { key: 'medium', label: 'Medium', desc: '10–100kg' },
  { key: 'heavy', label: 'Heavy', desc: '≥ 100kg' },
];

// ── Opções de ordenação ───────────────────────────────────────────
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'id', label: 'Number (default)' },
  { value: 'name', label: 'Name A–Z' }
];

// ── Skeleton ──────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skArtSection}>
        <div className={`${styles.skBox} ${styles.skArt}`} />
      </div>
      <div className={styles.skInfo}>
        <div className={`${styles.skBox} ${styles.skName}`} />
        <div className={`${styles.skBox} ${styles.skType}`} />
      </div>
    </div>
  );
}

// ── Card de Pokémon ───────────────────────────────────────────────
function PokemonCard({ pokemon }: { pokemon: PokemonDetail }) {
  const primaryType = pokemon.types[0]?.type.name ?? 'normal';
  const typeColor = TYPE_COLORS[primaryType]?.bg ?? '#485a95';
  const artwork =
    pokemon.sprites.other['official-artwork'].front_default ??
    pokemon.sprites.front_default;

  return (
    <Link
      id={`pokemon-card-${pokemon.id}`}
      to={`/pokedex/${pokemon.id}`}
      className={styles.card}
      style={{
        '--type-color': typeColor,
        '--type-bg': hexToAlpha(typeColor, 0.1),
        '--type-shadow': hexToAlpha(typeColor, 0.32),
      } as React.CSSProperties}
    >
      {/* Área da arte */}
      <div className={styles.cardArtSection}>
        <span className={styles.cardWatermark} aria-hidden="true">
          #{String(pokemon.id).padStart(4, '0')}
        </span>
        <div className={styles.cardGlow} aria-hidden="true" />
        {artwork && (
          <img
            src={artwork}
            alt={capitalize(pokemon.name)}
            className={styles.cardArt}
            loading="lazy"
            draggable={false}
          />
        )}
      </div>

      {/* Info */}
      <div className={styles.cardInfo}>
        <h3 className={styles.cardName}>{capitalize(pokemon.name)}</h3>
        <div className={styles.cardTypes}>
          {pokemon.types.map(({ type }) => {
            const c = TYPE_COLORS[type.name] ?? { bg: '#888', text: '#fff' };
            return (
              <span
                key={type.name}
                className={styles.cardType}
                style={{ background: c.bg, color: c.text }}
              >
                {capitalize(type.name)}
              </span>
            );
          })}
        </div>
      </div>
    </Link>
  );
}

// ── Pokémon do Dia ────────────────────────────────────────────────
const STAT_KEYS = ['hp', 'attack', 'defense', 'speed'];
const statLabel = (name: string) => name === 'hp' ? 'HP' : capitalize(name);

function PokemonOfDay() {
  const { pokemon, loading } = usePokemonOfDay();

  if (loading) {
    return (
      <div className={styles.potdSkeleton}>
        <div className={styles.potdSkArt} />
        <div className={styles.potdSkInfo}>
          <div className={`${styles.skBox} ${styles.skName}`} />
          <div className={`${styles.skBox} ${styles.skType}`} />
        </div>
      </div>
    );
  }

  if (!pokemon) return null;

  const primaryType = pokemon.types[0]?.type.name ?? 'normal';
  const typeColor = TYPE_COLORS[primaryType]?.bg ?? '#485a95';
  const artwork =
    pokemon.sprites.other['official-artwork'].front_default ??
    pokemon.sprites.front_default;
  const today = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short' });

  const stats = pokemon.stats
    .filter(s => STAT_KEYS.includes(s.stat.name))
    .sort((a, b) => STAT_KEYS.indexOf(a.stat.name) - STAT_KEYS.indexOf(b.stat.name));

  return (
    <div
      className={styles.potd}
      style={{
        '--type-color': typeColor,
        '--type-bg': hexToAlpha(typeColor, 0.1),
        '--type-shadow': hexToAlpha(typeColor, 0.22),
      } as React.CSSProperties}
    >
      {/* Cabeçalho */}
      <div className={styles.potdHeader}>
        <span className={styles.potdTitle}>Today's Pokémon</span>
        <span className={styles.potdDate}>{today}</span>
      </div>

      {/* Arte */}
      <div className={styles.potdArtSection}>
        <span className={styles.potdWatermark} aria-hidden="true">
          #{String(pokemon.id).padStart(4, '0')}
        </span>
        <div className={styles.potdGlow} aria-hidden="true" />
        {artwork && (
          <img
            src={artwork}
            alt={capitalize(pokemon.name)}
            className={styles.potdArt}
            draggable={false}
          />
        )}
      </div>

      {/* Info */}
      <div className={styles.potdInfo}>
        <h3 className={styles.potdName}>{capitalize(pokemon.name)}</h3>

        <div className={styles.potdTypes}>
          {pokemon.types.map(({ type }) => {
            const c = TYPE_COLORS[type.name] ?? { bg: '#888', text: '#fff' };
            return (
              <span
                key={type.name}
                className={styles.potdType}
                style={{ background: c.bg, color: c.text }}
              >
                {capitalize(type.name)}
              </span>
            );
          })}
        </div>

        <div className={styles.potdStats}>
          {stats.map(s => (
            <div key={s.stat.name} className={styles.potdStat}>
              <div className={styles.potdStatRow}>
                <span className={styles.potdStatName}>{statLabel(s.stat.name)}</span>
                <span className={styles.potdStatVal}>{s.base_stat}</span>
              </div>
              <div className={styles.potdStatBar}>
                <div
                  className={styles.potdStatFill}
                  style={{
                    width: `${Math.min(100, (s.base_stat / 255) * 100)}%`,
                    background: typeColor,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <Link to={`/pokedex/${pokemon.id}`} className={styles.potdLink}>
          See Details
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────
const PokedexPage: React.FC = () => {
  const location = useLocation();
  const {
    pokemon, loading, loadingAll, error,
    total,
    search, setSearch,
    typeFilter, setTypeFilter,
    genFilter, setGenFilter,
    heightFilter, setHeightFilter,
    weightFilter, setWeightFilter,
    sortBy, setSortBy,
  } = usePokedex();

  // Quando ordenação não-padrão está ativa, aguarda todos os dados estarem carregados
  const isLoadingAll = loadingAll && sortBy !== 'id';

  const isFiltered =
    !!search ||
    typeFilter.length > 0 ||
    genFilter.length > 0 ||
    heightFilter.length > 0 ||
    weightFilter.length > 0;

  // ── Scroll to pokemon card on back navigation ─────────────────────
  const [scrollTargetId, setScrollTargetId] = useState<number | null>(
    () => (location.state as { scrollToId?: number } | null)?.scrollToId ?? null
  );

  // Scroll once the card is rendered
  useEffect(() => {
    if (!scrollTargetId) return;
    if (!pokemon.some(p => p.id === scrollTargetId)) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(`pokemon-card-${scrollTargetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setScrollTargetId(null);
      }
    });
  }, [scrollTargetId, pokemon]);

  const activeFilterCount =
    typeFilter.length +
    genFilter.length +
    heightFilter.length +
    weightFilter.length +
    (sortBy !== 'id' ? 1 : 0);

  const clearAll = () => {
    setTypeFilter([]);
    setGenFilter([]);
    setHeightFilter([]);
    setWeightFilter([]);
    setSortBy('id');
  };

  // ── Filtros: painel overlay ───────────────────────────────────────
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filtersOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [filtersOpen]);

  // ── Scroll to top ao mudar filtros ───────────────────────────────
  const filtersMounted = useRef(false);
  useEffect(() => {
    if (!filtersMounted.current) { filtersMounted.current = true; return; }
    window.scrollTo({ top: 375, behavior: 'smooth' });
  }, [search, typeFilter, genFilter, heightFilter, weightFilter, sortBy]);

  // ── Scroll to top ────────────────────────────────────────────────
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);


  const [rgValue, setRgValue] = useState(3);

  return (
    <MainLayout>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerBlob} aria-hidden="true" />
        <div className={styles.headerInner}>
          <p className={styles.eyebrow}>Discover</p>
          <h1 className={styles.pageTitle}>
            Poké<span className={styles.titleAccent}>dex</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Explore every Pokémon from all 9 generations with types, stats,
            abilities, and much more.
          </p>
          <div className={styles.headerStats}>
            <div className={styles.hStat}>
              <span className={styles.hStatValue}>
                {total > 0 ? `${total}+` : '1000+'}
              </span>
              <span className={styles.hStatLabel}>Pokémon</span>
            </div>
            <div className={styles.hStatDivider} />
            <div className={styles.hStat}>
              <span className={styles.hStatValue}>18</span>
              <span className={styles.hStatLabel}>Types</span>
            </div>
            <div className={styles.hStatDivider} />
            <div className={styles.hStat}>
              <span className={styles.hStatValue}>9</span>
              <span className={styles.hStatLabel}>Generations</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filtros ────────────────────────────────────────────── */}
      <div className={styles.filtersBar} ref={filterBarRef}>

        {/* Linha superior: busca + botão filtros */}
        <div className={styles.filterRow}>
          <div className={styles.searchWrap}>
            <svg
              className={styles.searchIcon}
              width="16" height="16" viewBox="0 0 16 16"
              fill="none" aria-hidden="true"
            >
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search Pokémon by name"
            />
            {search && (
              <button
                className={styles.searchClear}
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className={styles.colsControl} role="group" aria-label="Columns per row">
            {([3, 4, 5] as const).map(n => (
              <button
                key={n}
                className={`${styles.colsBtn}${rgValue === n ? ` ${styles.colsBtnActive}` : ''}`}
                onClick={() => setRgValue(n)}
                aria-pressed={rgValue === n}
                title={`${n} columns per row`}
              >
                <svg width="16" height="14" viewBox={`0 0 ${n * 4 + (n - 1) * 2} 14`} fill="none" aria-hidden="true">
                  {Array.from({ length: n }).map((_, i) => (
                    <rect key={i} x={i * 6} y={0} width={4} height={14} rx={1} fill="currentColor" />
                  ))}
                </svg>
              </button>
            ))}
          </div>

          <button
            className={`${styles.filterToggle}${filtersOpen ? ` ${styles.filterToggleOpen}` : ''}`}
            onClick={() => setFiltersOpen(v => !v)}
            aria-expanded={filtersOpen}
            aria-label="Open filters"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M1 3h13M3 7.5h9M5.5 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className={styles.filterBadge}>{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Painel overlay */}
        <div
          className={`${styles.filterPanel}${filtersOpen ? ` ${styles.filterPanelOpen}` : ''}`}
          aria-hidden={!filtersOpen}
        >
          <div className={styles.filterPanelInner}>

            {activeFilterCount > 0 && (
              <div className={styles.panelHeader}>
                <span className={styles.panelActiveCount}>{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</span>
                <button className={styles.clearAllBtn} onClick={clearAll}>Clear all</button>
              </div>
            )}

            {/* Seção: Ordenação */}
            <div className={styles.filterSection}>
              <div className={styles.filterSectionHead}>
                <span className={styles.filterSectionLabel}>Order</span>
                {sortBy !== 'id' && (
                  <button className={styles.clearBtn} onClick={() => setSortBy('id')}>
                    Clear
                  </button>
                )}
              </div>
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortBy)}
                aria-label="Sort Pokémon"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Seção: Tipo */}
            <div className={styles.filterSection}>
              <div className={styles.filterSectionHead}>
                <span className={styles.filterSectionLabel}>Type</span>
                {typeFilter.length > 0 && (
                  <button className={styles.clearBtn} onClick={() => setTypeFilter([])}>
                    Clear
                  </button>
                )}
              </div>
              <div className={styles.typeGrid} role="group" aria-label="Filter by type">
                {TYPES.map(type => {
                  const c = TYPE_COLORS[type];
                  const isActive = typeFilter.includes(type);
                  return (
                    <button
                      key={type}
                      className={`${styles.typeChip}${isActive ? ` ${styles.typeChipActive}` : ''}`}
                      style={isActive
                        ? { background: c.bg, color: c.text, borderColor: c.bg }
                        : undefined
                      }
                      onClick={() => setTypeFilter(
                        isActive ? typeFilter.filter(t => t !== type) : [...typeFilter, type]
                      )}
                      aria-pressed={isActive}
                    >
                      {capitalize(type)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seção: Geração */}
            <div className={styles.filterSection}>
              <div className={styles.filterSectionHead}>
                <span className={styles.filterSectionLabel}>Generation</span>
                {genFilter.length > 0 && (
                  <button className={styles.clearBtn} onClick={() => setGenFilter([])}>
                    Clear
                  </button>
                )}
              </div>
              <div className={styles.typeGrid} role="group" aria-label="Filter by generation">
                {GENS.map(gen => {
                  const isActive = genFilter.includes(gen);
                  return (
                    <button
                      key={gen}
                      className={`${styles.typeChip}${isActive ? ` ${styles.typeChipActive}` : ''}`}
                      onClick={() => setGenFilter(
                        isActive ? genFilter.filter(g => g !== gen) : [...genFilter, gen]
                      )}
                      aria-pressed={isActive}
                    >
                      Gen {gen}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seção: Altura */}
            <div className={styles.filterSection}>
              <div className={styles.filterSectionHead}>
                <span className={styles.filterSectionLabel}>Height</span>
                {heightFilter.length > 0 && (
                  <button className={styles.clearBtn} onClick={() => setHeightFilter([])}>
                    Clear
                  </button>
                )}
              </div>
              <div className={styles.typeGrid} role="group" aria-label="Filter by height">
                {HEIGHT_BUCKETS.map(({ key, label, desc }) => {
                  const isActive = heightFilter.includes(key);
                  return (
                    <button
                      key={key}
                      className={`${styles.typeChip}${isActive ? ` ${styles.typeChipActive}` : ''}`}
                      title={desc}
                      onClick={() => setHeightFilter(
                        isActive ? heightFilter.filter(h => h !== key) : [...heightFilter, key]
                      )}
                      aria-pressed={isActive}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seção: Peso */}
            <div className={styles.filterSection}>
              <div className={styles.filterSectionHead}>
                <span className={styles.filterSectionLabel}>Weight</span>
                {weightFilter.length > 0 && (
                  <button className={styles.clearBtn} onClick={() => setWeightFilter([])}>
                    Clear
                  </button>
                )}
              </div>
              <div className={styles.typeGrid} role="group" aria-label="Filter by weight">
                {WEIGHT_BUCKETS.map(({ key, label, desc }) => {
                  const isActive = weightFilter.includes(key);
                  return (
                    <button
                      key={key}
                      className={`${styles.typeChip}${isActive ? ` ${styles.typeChipActive}` : ''}`}
                      title={desc}
                      onClick={() => setWeightFilter(
                        isActive ? weightFilter.filter(w => w !== key) : [...weightFilter, key]
                      )}
                      aria-pressed={isActive}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ── Grid ───────────────────────────────────────────────── */}
      <div className={styles.gridSection}>
        <div className={styles.gridInner}>

          {/* Sidebar de filtros (desktop) */}
          <aside className={styles.sidebar} aria-label="Filters">

            {/* Sidebar header */}
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarTitleRow}>
                <span className={styles.sidebarTitle}>Filters</span>
                {activeFilterCount > 0 && (
                  <span className={styles.sidebarBadge}>{activeFilterCount}</span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button className={styles.clearAllBtn} onClick={clearAll}>
                  Clear all
                </button>
              )}
            </div>

            <hr className={styles.sidebarDivider} />

            {/* Ordenação */}
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarHead}>
                <span className={styles.sidebarLabel}>Order</span>
                {sortBy !== 'id' && (
                  <button className={styles.clearBtn} onClick={() => setSortBy('id')}>
                    Clear
                  </button>
                )}
              </div>
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortBy)}
                aria-label="Sort Pokémon"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <hr className={styles.sidebarDivider} />

            {/* Tipo */}
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarHead}>
                <span className={styles.sidebarLabel}>Type</span>
                {typeFilter.length > 0 && (
                  <button className={styles.clearBtn} onClick={() => setTypeFilter([])}>
                    Clear
                  </button>
                )}
              </div>
              <div className={styles.typeGrid} role="group" aria-label="Filter by type">
                {TYPES.map(type => {
                  const c = TYPE_COLORS[type];
                  const isActive = typeFilter.includes(type);
                  return (
                    <button
                      key={type}
                      className={`${styles.typeChip}${isActive ? ` ${styles.typeChipActive}` : ''}`}
                      style={isActive
                        ? { background: c.bg, color: c.text, borderColor: c.bg }
                        : undefined
                      }
                      onClick={() => setTypeFilter(
                        isActive ? typeFilter.filter(t => t !== type) : [...typeFilter, type]
                      )}
                      aria-pressed={isActive}
                    >
                      {capitalize(type)}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className={styles.sidebarDivider} />

            {/* Geração */}
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarHead}>
                <span className={styles.sidebarLabel}>Generation</span>
                {genFilter.length > 0 && (
                  <button className={styles.clearBtn} onClick={() => setGenFilter([])}>
                    Clear
                  </button>
                )}
              </div>
              <div className={styles.typeGrid} role="group" aria-label="Filter by generation">
                {GENS.map(gen => {
                  const isActive = genFilter.includes(gen);
                  return (
                    <button
                      key={gen}
                      className={`${styles.typeChip}${isActive ? ` ${styles.typeChipActive}` : ''}`}
                      onClick={() => setGenFilter(
                        isActive ? genFilter.filter(g => g !== gen) : [...genFilter, gen]
                      )}
                      aria-pressed={isActive}
                    >
                      Gen {gen}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className={styles.sidebarDivider} />

            {/* Altura */}
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarHead}>
                <span className={styles.sidebarLabel}>Height</span>
                {heightFilter.length > 0 && (
                  <button className={styles.clearBtn} onClick={() => setHeightFilter([])}>
                    Clear
                  </button>
                )}
              </div>
              <div className={styles.typeGrid} role="group" aria-label="Filter by height">
                {HEIGHT_BUCKETS.map(({ key, label, desc }) => {
                  const isActive = heightFilter.includes(key);
                  return (
                    <button
                      key={key}
                      className={`${styles.typeChip}${isActive ? ` ${styles.typeChipActive}` : ''}`}
                      title={desc}
                      onClick={() => setHeightFilter(
                        isActive ? heightFilter.filter(h => h !== key) : [...heightFilter, key]
                      )}
                      aria-pressed={isActive}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className={styles.sidebarDivider} />

            {/* Peso */}
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarHead}>
                <span className={styles.sidebarLabel}>Weight</span>
                {weightFilter.length > 0 && (
                  <button className={styles.clearBtn} onClick={() => setWeightFilter([])}>
                    Clear
                  </button>
                )}
              </div>
              <div className={styles.typeGrid} role="group" aria-label="Filter by weight">
                {WEIGHT_BUCKETS.map(({ key, label, desc }) => {
                  const isActive = weightFilter.includes(key);
                  return (
                    <button
                      key={key}
                      className={`${styles.typeChip}${isActive ? ` ${styles.typeChipActive}` : ''}`}
                      title={desc}
                      onClick={() => setWeightFilter(
                        isActive ? weightFilter.filter(w => w !== key) : [...weightFilter, key]
                      )}
                      aria-pressed={isActive}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

          </aside>

          <div className={styles.gridMain}>

            {!loading && !isLoadingAll && !error && (
              <p className={styles.resultsInfo}>
                {isFiltered
                  ? `${pokemon.length} result${pokemon.length !== 1 ? 's' : ''} found`
                  : `Showing ${pokemon.length} of ${total} Pokémon`
                }
              </p>
            )}

            {error && (
              <div className={styles.errorState}>
                <p>{error}</p>
              </div>
            )}

            {isLoadingAll && !loading && (
              <p className={styles.loadingAllMsg}>
                Loading all Pokémon for sorting…
              </p>
            )}

            {!error && (
              <div
                className={styles.grid}
                style={{
                  '--cols': rgValue,
                  '--watermark-size': rgValue === 3 ? '68px' : rgValue === 4 ? '58px' : '42px',
                } as React.CSSProperties}
              >
                {(loading || isLoadingAll)
                  ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))
                  : pokemon.map(p => <PokemonCard key={p.id} pokemon={p} />)
                }
              </div>
            )}

            {!loading && !isLoadingAll && !error && pokemon.length === 0 && isFiltered && loadingAll && (
              <div className={styles.searchingState}>
                <p className={styles.searchingText}>Searching...</p>
                <div className={styles.searchingDots}>
                  <span /><span /><span />
                </div>
              </div>
            )}

            {!loading && !isLoadingAll && !error && pokemon.length === 0 && (!isFiltered || !loadingAll) && (
              <div className={styles.emptyState}>
                <img
                  src={psyduck}
                  alt="Psyduck confused"
                  className={styles.emptyStateImg}
                  draggable={false}
                />
                <p className={styles.emptyStateTitle}>No Pokémon found!</p>
                <p className={styles.emptyStateSub}>Even Psyduck can't figure out what you're looking for.</p>
              </div>
            )}

          </div>

          {/* Sidebar direita: Pokémon do Dia (desktop xl+) */}
          <aside className={styles.rightSidebar} aria-label="Pokémon of the Day">
            <PokemonOfDay />
          </aside>

        </div>
      </div>

      {/* ── Scroll to top ───────────────────────────────────────── */}
      <button
        className={`${styles.scrollTopBtn}${showScrollTop ? ` ${styles.scrollTopBtnVisible}` : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Voltar ao início da página"
        aria-hidden={!showScrollTop}
        title='Back to top'
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 12V4M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

    </MainLayout>
  );
};

export default PokedexPage;

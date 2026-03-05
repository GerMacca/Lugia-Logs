import { useState } from 'react';
import { Link } from 'react-router-dom';

import { usePokemonOfTheDay } from '../../hooks/usePokemonOfTheDay';
import type { AbilityTranslation } from '../../hooks/usePokemonOfTheDay';
import type { PokemonDetail, PokemonSpecies } from '../../types/pokemon.types';

import styles from './PokemonOfTheDay.module.scss';

// ── Cores por tipo ────────────────────────────────────────────────
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

// ── Nomes de tipo em português ────────────────────────────────────
const TYPE_NAMES_PT: Record<string, string> = {
  normal: 'Normal',
  fire: 'Fogo',
  water: 'Água',
  electric: 'Elétrico',
  grass: 'Planta',
  ice: 'Gelo',
  fighting: 'Lutador',
  poison: 'Venenoso',
  ground: 'Terra',
  flying: 'Voador',
  psychic: 'Psíquico',
  bug: 'Inseto',
  rock: 'Pedra',
  ghost: 'Fantasma',
  dragon: 'Dragão',
  dark: 'Sombrio',
  steel: 'Aço',
  fairy: 'Fada',
};

const STAT_NAMES: Record<string, string> = {
  hp: 'HP',
  attack: 'Ataque',
  defense: 'Defesa',
  'special-attack': 'Atq. Esp.',
  'special-defense': 'Def. Esp.',
  speed: 'Velocidade',
};

// ── Helpers ───────────────────────────────────────────────────────
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function getFlavorText(species: PokemonSpecies): string {
  const entries = species.flavor_text_entries;
  const ptBr = entries.filter(e => e.language.name === 'pt-br');
  const en = entries.filter(e => e.language.name === 'en');
  const raw = (ptBr[ptBr.length - 1] ?? en[en.length - 1])?.flavor_text ?? '';
  return raw.replace(/[\f\n\r]/g, ' ').trim();
}

function getGenus(species: PokemonSpecies): string {
  return (
    species.genera.find(g => g.language.name === 'pt-br')?.genus ??
    species.genera.find(g => g.language.name === 'en')?.genus ??
    ''
  );
}

const formatDate = () =>
  new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const statLevel = (v: number): 'low' | 'mid' | 'high' =>
  v >= 90 ? 'high' : v >= 55 ? 'mid' : 'low';

// ── Skeleton ──────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className={styles.card}>
      <div className={`${styles.imageCol} ${styles.skeletonImageCol}`}>
        <div className={`${styles.skeletonBox} ${styles.skeletonArtwork}`} />
        <div className={`${styles.skeletonBox} ${styles.skeletonBadge}`} />
      </div>
      <div className={`${styles.infoCol} ${styles.skeletonInfoCol}`}>
        <div className={`${styles.skeletonBox} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeletonBox} ${styles.skeletonSubtitle}`} />
        <div className={`${styles.skeletonBox} ${styles.skeletonTypes}`} />
        <div className={`${styles.skeletonBox} ${styles.skeletonFlavor}`} />
        <div className={`${styles.skeletonBox} ${styles.skeletonStats}`} />
      </div>
    </div>
  );
}

// ── Card principal ────────────────────────────────────────────────
function PokemonCard({
  pokemon,
  species,
  abilities,
}: {
  pokemon: PokemonDetail;
  species: PokemonSpecies;
  abilities: AbilityTranslation[];
}) {
  const [isShiny, setIsShiny] = useState(false);

  const artwork = isShiny
    ? (pokemon.sprites.other['official-artwork'].front_shiny ??
      pokemon.sprites.other['official-artwork'].front_default)
    : pokemon.sprites.other['official-artwork'].front_default;

  const flavorText = getFlavorText(species);
  const genus = getGenus(species);
  const heightM = (pokemon.height / 10).toFixed(1);
  const weightKg = (pokemon.weight / 10).toFixed(1);
  const genRoman = species.generation.name.replace('generation-', '').toUpperCase();

  return (
    <div className={styles.card}>

      <div className={styles.imageCol}>
        <span className={styles.dateBadge}>{formatDate()}</span>

        <div className={styles.artworkWrap}>
          {artwork && (
            <img
              src={artwork}
              alt={capitalize(pokemon.name)}
              className={styles.artwork}
              draggable={false}
            />
          )}
          <div className={styles.artworkGlow} aria-hidden="true" />
        </div>

        <div className={styles.imageFooter}>
          <span className={styles.numberBadge}>
            #{String(pokemon.id).padStart(4, '0')}
          </span>
          <button
            className={`${styles.shinyBtn}${isShiny ? ` ${styles.shinyBtnActive}` : ''}`}
            onClick={() => setIsShiny(s => !s)}
            aria-pressed={isShiny}
            title={isShiny ? 'Ver versão normal' : 'Ver versão shiny ✨'}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 1l1.5 4.5H14l-3.8 2.8 1.4 4.7L8 10.5l-3.6 2.5 1.4-4.7L2 5.5h4.5L8 1z"
                fill="currentColor"
              />
            </svg>
            Shiny
          </button>
        </div>
      </div>

      {/* ── Coluna direita: informações ── */}
      <div className={styles.infoCol}>

        {/* Nome e badges */}
        <div className={styles.nameRow}>
          {species.is_legendary && (
            <span className={styles.badge} data-kind="legendary">Lendário</span>
          )}
          {species.is_mythical && (
            <span className={styles.badge} data-kind="mythical">Mítico</span>
          )}
          <h2 className={styles.pokeName}>{capitalize(pokemon.name)}</h2>
          {genus && <span className={styles.genus}>{genus}</span>}
        </div>

        {/* Tipos */}
        <div className={styles.types}>
          {pokemon.types.map(({ type }) => {
            const colors = TYPE_COLORS[type.name] ?? { bg: '#888', text: '#fff' };
            return (
              <span
                key={type.name}
                className={styles.typeBadge}
                style={{ background: colors.bg, color: colors.text }}
              >
                {TYPE_NAMES_PT[type.name] ?? capitalize(type.name)}
              </span>
            );
          })}
        </div>

        {/* Curiosidade */}
        {flavorText && (
          <blockquote className={styles.flavor}>
            <p>"{flavorText}"</p>
          </blockquote>
        )}

        {/* Stats */}
        <div className={styles.statsSection}>
          <h3 className={styles.sectionLabel}>Estatísticas Base</h3>
          <div className={styles.statsList}>
            {pokemon.stats.map(({ stat, base_stat }) => (
              <div key={stat.name} className={styles.statRow}>
                <span className={styles.statLabel}>
                  {STAT_NAMES[stat.name] ?? capitalize(stat.name)}
                </span>
                <div className={styles.statBarWrap}>
                  <div
                    className={styles.statBarFill}
                    data-level={statLevel(base_stat)}
                    style={{ width: `${Math.min((base_stat / 255) * 100, 100)}%` }}
                  />
                </div>
                <span className={styles.statValue}>{base_stat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Habilidades */}
        <div className={styles.abilitiesSection}>
          <h3 className={styles.sectionLabel}>Habilidades</h3>
          <div className={styles.abilitiesList}>
            {abilities.map(({ slug, label, is_hidden }) => (
              <div key={slug} className={styles.abilityTag}>
                {label}
                {is_hidden && (
                  <span className={styles.hiddenBadge}>Oculta</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Medidas */}
        <div className={styles.measurements}>
          <div className={styles.measurement}>
            <span className={styles.measureLabel}>Altura</span>
            <span className={styles.measureValue}>{heightM} m</span>
          </div>
          <div className={styles.measureDivider} />
          <div className={styles.measurement}>
            <span className={styles.measureLabel}>Peso</span>
            <span className={styles.measureValue}>{weightKg} kg</span>
          </div>
          <div className={styles.measureDivider} />
          <div className={styles.measurement}>
            <span className={styles.measureLabel}>Geração</span>
            <span className={styles.measureValue}>Gen. {genRoman}</span>
          </div>
        </div>

        {/* CTA */}
        <Link to={`/pokedex/${pokemon.id}`} className={styles.detailLink}>
          Ver ficha completa
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

// ── Seção exportada ───────────────────────────────────────────────
const PokemonOfTheDay: React.FC = () => {
  const { pokemon, species, abilities, loading, error } = usePokemonOfTheDay();

  return (
    <section id="pokemon-do-dia" className={styles.section}>
      <div className={styles.blob} aria-hidden="true" />
      <div className={styles.inner}>

        <div className={styles.header}>
          <p className={styles.eyebrow}>Pokémon do Dia</p>
          <h2 className={styles.title}>
            Quem aparece <span className={styles.titleAccent}>hoje?</span>
          </h2>
          <p className={styles.subtitle}>
            Um Pokémon diferente a cada dia! Confira curiosidades, stats e
            habilidades do escolhido!
          </p>
        </div>

        {loading && <Skeleton />}

        {error && (
          <div className={styles.errorState}>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && pokemon && species && (
          <PokemonCard pokemon={pokemon} species={species} abilities={abilities} />
        )}
      </div>
    </section>
  );
};

export default PokemonOfTheDay;

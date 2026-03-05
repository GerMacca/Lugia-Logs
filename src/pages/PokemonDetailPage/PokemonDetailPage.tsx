import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout/MainLayout';
import { usePokemonDetail } from '../../hooks/usePokemonDetail';
import type { EvoPath, EvoNode, AbilityTranslation, TypeEffectiveness } from '../../hooks/usePokemonDetail';
import type { PokemonDetail, PokemonStat, EvolutionDetail } from '../../types/pokemon.types';
import styles from './PokemonDetailPage.module.scss';

const MAX_POKEMON = 1025;

const capitalize = (s: string) =>
  s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

function hexToAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Type data ─────────────────────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  normal:   { bg: '#9a9a6e', text: '#fff' },
  fire:     { bg: '#f08030', text: '#fff' },
  water:    { bg: '#6890f0', text: '#fff' },
  electric: { bg: '#f8d030', text: '#1a1210' },
  grass:    { bg: '#78c850', text: '#fff' },
  ice:      { bg: '#98d8d8', text: '#1a2a2a' },
  fighting: { bg: '#c03028', text: '#fff' },
  poison:   { bg: '#a040a0', text: '#fff' },
  ground:   { bg: '#e0c068', text: '#1a1a08' },
  flying:   { bg: '#a890f0', text: '#fff' },
  psychic:  { bg: '#f85888', text: '#fff' },
  bug:      { bg: '#a8b820', text: '#fff' },
  rock:     { bg: '#b8a038', text: '#fff' },
  ghost:    { bg: '#705898', text: '#fff' },
  dragon:   { bg: '#7038f8', text: '#fff' },
  dark:     { bg: '#705848', text: '#fff' },
  steel:    { bg: '#b8b8d0', text: '#1a1a28' },
  fairy:    { bg: '#ee99ac', text: '#1a0810' },
};

const TYPE_NAMES_PT: Record<string, string> = {
  normal: 'Normal', fire: 'Fogo', water: 'Água',
  electric: 'Elétrico', grass: 'Planta', ice: 'Gelo',
  fighting: 'Lutador', poison: 'Venenoso', ground: 'Terra',
  flying: 'Voador', psychic: 'Psíquico', bug: 'Inseto',
  rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão',
  dark: 'Sombrio', steel: 'Aço', fairy: 'Fada',
};

// ── Stat data ─────────────────────────────────────────────────
const STAT_PT: Record<string, string> = {
  hp: 'HP',
  attack: 'Ataque',
  defense: 'Defesa',
  'special-attack': 'Atq. Especial',
  'special-defense': 'Def. Especial',
  speed: 'Velocidade',
};

function getStatColor(value: number): string {
  if (value < 30)  return '#e74c3c';
  if (value < 50)  return '#e67e22';
  if (value < 70)  return '#f1c40f';
  if (value < 90)  return '#a8d548';
  if (value < 110) return '#2ecc71';
  return '#17a347';
}

// ── Evolution label ───────────────────────────────────────────
function getEvoLabel(details: EvolutionDetail[]): string {
  if (details.length === 0) return '';
  const d = details[0];
  if (d.trigger.name === 'level-up') {
    if (d.min_level)     return `Lv. ${d.min_level}`;
    if (d.min_happiness) return 'Amizade';
    if (d.min_affection) return 'Afeição';
    if (d.time_of_day === 'day')   return 'Dia';
    if (d.time_of_day === 'night') return 'Noite';
    if (d.known_move)    return 'Movimento';
    if (d.location)      return 'Local';
    return 'Nível acima';
  }
  if (d.trigger.name === 'use-item') {
    return capitalize(d.item?.name ?? 'item');
  }
  if (d.trigger.name === 'trade') {
    if (d.held_item) return 'Troca c/ item';
    return 'Troca';
  }
  if (d.trigger.name === 'shed') return 'Lv. 20';
  return '—';
}

// ── Type Badge ────────────────────────────────────────────────
function TypeBadge({ typeName, size = 'md' }: { typeName: string; size?: 'sm' | 'md' }) {
  const c = TYPE_COLORS[typeName] ?? { bg: '#888', text: '#fff' };
  return (
    <span
      className={`${styles.typeBadge} ${size === 'sm' ? styles.typeBadgeSm : ''}`}
      style={{ background: c.bg, color: c.text }}
    >
      {TYPE_NAMES_PT[typeName] ?? capitalize(typeName)}
    </span>
  );
}

// ── Stat Bar ─────────────────────────────────────────────────
function StatBar({ stat, animate }: { stat: PokemonStat; animate: boolean }) {
  const [displayVal, setDisplayVal] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    cancelAnimationFrame(frameRef.current);
    if (!animate) {
      setDisplayVal(0);
      setDisplayPct(0);
      return;
    }
    startRef.current = performance.now();
    const target    = stat.base_stat;
    const targetPct = Math.min(100, (target / 255) * 100);
    const duration  = 900;

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t       = Math.min(elapsed / duration, 1);
      const eased   = 1 - Math.pow(1 - t, 3);
      setDisplayVal(Math.round(target * eased));
      setDisplayPct(targetPct * eased);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [animate, stat.base_stat]);

  return (
    <div className={styles.statRow}>
      <span className={styles.statName}>{STAT_PT[stat.stat.name] ?? stat.stat.name}</span>
      <span className={styles.statNum}>{displayVal}</span>
      <div className={styles.statBarTrack}>
        <div
          className={styles.statBarFill}
          style={{ width: `${displayPct}%`, background: getStatColor(stat.base_stat) }}
        />
      </div>
    </div>
  );
}

// ── Stats Section ─────────────────────────────────────────────
function StatsSection({ stats }: { stats: PokemonStat[] }) {
  const [animate, setAnimate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAnimate(false);
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setAnimate(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stats]);

  const total = stats.reduce((s, st) => s + st.base_stat, 0);

  return (
    <section ref={ref} className={styles.section}>
      <h2 className={styles.sectionTitle}>Stats Base</h2>
      <div className={styles.statsGrid}>
        {stats.map(s => <StatBar key={s.stat.name} stat={s} animate={animate} />)}
        <div className={styles.statRow}>
          <span className={`${styles.statName} ${styles.statTotal}`}>Total</span>
          <span className={`${styles.statNum} ${styles.statTotal}`}>{animate ? total : 0}</span>
          <div className={styles.statBarTrack}>
            <div
              className={styles.statBarFill}
              style={{
                width: animate ? `${Math.min(100, (total / 720) * 100)}%` : '0%',
                background: getStatColor(Math.round(total / 6)),
                transition: animate ? 'width 0.9s cubic-bezier(0.16,1,0.3,1)' : 'none',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Abilities Section ─────────────────────────────────────────
function AbilitiesSection({ abilities }: { abilities: AbilityTranslation[] | null }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Habilidades</h2>
      {abilities === null ? (
        <div className={styles.abilityGrid}>
          {[1, 2].map(i => <div key={i} className={`${styles.abilityCard} ${styles.skPulse}`} style={{ height: 72 }} />)}
        </div>
      ) : (
        <div className={styles.abilityGrid}>
          {abilities.map(a => (
            <div key={a.slug} className={styles.abilityCard}>
              <div className={styles.abilityHead}>
                <span className={styles.abilityName}>{a.label}</span>
                {a.is_hidden && <span className={styles.abilityHiddenBadge}>Oculta</span>}
              </div>
              {a.description && (
                <p className={styles.abilityDesc}>{a.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Type Effectiveness Section ────────────────────────────────
function EffectivenessSection({ te }: { te: TypeEffectiveness }) {
  const groups = [
    { label: '4×',   types: te.quadWeak,      class: styles.mult4x },
    { label: '2×',   types: te.weak,           class: styles.mult2x },
    { label: '½×',   types: te.resistant,      class: styles.mult05x },
    { label: '¼×',   types: te.quadResistant,  class: styles.mult025x },
    { label: '0×',   types: te.immune,         class: styles.mult0x },
  ].filter(g => g.types.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Fraquezas e Resistências</h2>
      <div className={styles.effectivenessGroups}>
        {groups.map(g => (
          <div key={g.label} className={styles.effectRow}>
            <span className={`${styles.multLabel} ${g.class}`}>{g.label}</span>
            <div className={styles.effectBadges}>
              {g.types.map(t => <TypeBadge key={t} typeName={t} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Evolution Card ────────────────────────────────────────────
function EvoCard({ node, isCurrent }: { node: EvoNode; isCurrent: boolean }) {
  return (
    <Link
      to={`/pokedex/${node.id}`}
      className={`${styles.evoCard} ${isCurrent ? styles.evoCardCurrent : ''}`}
    >
      {node.officialArt || node.sprite ? (
        <img
          src={node.sprite ?? node.officialArt ?? ''}
          alt={capitalize(node.name)}
          className={styles.evoSprite}
          loading="lazy"
        />
      ) : (
        <div className={styles.evoSpritePlaceholder} />
      )}
      <span className={styles.evoName}>{capitalize(node.name)}</span>
      <div className={styles.evoTypes}>
        {node.types.map(({ type }) => <TypeBadge key={type.name} typeName={type.name} size="sm" />)}
      </div>
    </Link>
  );
}

// ── Evolution Section ─────────────────────────────────────────
function EvolutionSection({ evoPaths, currentId }: { evoPaths: EvoPath[] | null; currentId: number }) {
  if (evoPaths === null) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cadeia Evolutiva</h2>
        <div className={`${styles.evoLoadingRow} ${styles.skPulse}`} />
      </section>
    );
  }

  // Only one node total = no evolutions
  const allNodes = evoPaths.flat();
  const uniqueIds = new Set(allNodes.map(n => n.id));
  if (uniqueIds.size <= 1) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cadeia Evolutiva</h2>
        <p className={styles.noEvoMsg}>Este Pokémon não evolui.</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Cadeia Evolutiva</h2>
      <div className={styles.evoChain}>
        {evoPaths.map((path, pi) => (
          <div key={pi} className={styles.evoPath}>
            {path.map((node, ni) => (
              <div key={node.id} className={styles.evoStep}>
                {ni > 0 && (
                  <div className={styles.evoArrow}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M4 10h12M12 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {getEvoLabel(node.evolutionDetails) && (
                      <span className={styles.evoCondition}>{getEvoLabel(node.evolutionDetails)}</span>
                    )}
                  </div>
                )}
                <EvoCard node={node} isCurrent={node.id === currentId} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Forms Section ─────────────────────────────────────────────
function FormsSection({ forms }: { forms: PokemonDetail[] }) {
  if (forms.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Formas Alternativas</h2>
      <div className={styles.formsGrid}>
        {forms.map(form => {
          const art = form.sprites.other['official-artwork'].front_default ?? form.sprites.front_default;
          const primaryType = form.types[0]?.type.name ?? 'normal';
          const tc = TYPE_COLORS[primaryType];
          return (
            <Link
              key={form.id}
              to={`/pokedex/${form.name}`}
              className={styles.formCard}
              style={{ '--form-color': tc?.bg ?? '#485a95' } as React.CSSProperties}
            >
              {art && (
                <img src={art} alt={capitalize(form.name)} className={styles.formSprite} loading="lazy" />
              )}
              <span className={styles.formName}>{capitalize(form.name)}</span>
              <div className={styles.formTypes}>
                {form.types.map(({ type }) => <TypeBadge key={type.name} typeName={type.name} size="sm" />)}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skNav}>
        <div className={`${styles.skBox} ${styles.skNavBtn}`} />
        <div className={`${styles.skBox} ${styles.skNavBtn}`} />
      </div>
      <div className={styles.skHero}>
        <div className={`${styles.skBox} ${styles.skArtwork}`} />
        <div className={styles.skHeroInfo}>
          <div className={`${styles.skBox}`} style={{ height: 16, width: '40%' }} />
          <div className={`${styles.skBox}`} style={{ height: 40, width: '70%', marginTop: 8 }} />
          <div className={`${styles.skBox}`} style={{ height: 28, width: '50%', marginTop: 12 }} />
          <div className={`${styles.skBox}`} style={{ height: 60, marginTop: 16 }} />
          <div className={styles.skInfoGrid}>
            {[1, 2, 3, 4].map(i => <div key={i} className={`${styles.skBox} ${styles.skInfoBlock}`} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
const PokemonDetailPage: React.FC = () => {
  const { id = '1' } = useParams<{ id: string }>();
  const { pokemon, species, abilities, evoPaths, alternateForms, typeEffectiveness, loading, error } =
    usePokemonDetail(id);

  const [shiny, setShiny]   = useState(false);
  const [female, setFemale] = useState(false);

  // Reset toggles on pokemon change
  useEffect(() => {
    setShiny(false);
    setFemale(false);
  }, [id]);

  if (loading) return <MainLayout><PageSkeleton /></MainLayout>;

  if (error || !pokemon || !species) {
    return (
      <MainLayout>
        <div className={styles.errorPage}>
          <p>{error ?? 'Pokémon não encontrado.'}</p>
          <Link to="/pokedex" className={styles.backLink}>← Voltar à Pokédex</Link>
        </div>
      </MainLayout>
    );
  }

  // ── Artwork selection ────────────────────────────────────────
  const hasGender  = !!pokemon.sprites.front_female;
  const hasShiny   = !!(female
    ? (pokemon.sprites.other?.home?.front_shiny_female ?? pokemon.sprites.front_shiny_female)
    : pokemon.sprites.other['official-artwork'].front_shiny);

  let artworkSrc: string | null;
  if (female) {
    artworkSrc = shiny
      ? (pokemon.sprites.other?.home?.front_shiny_female ?? pokemon.sprites.front_shiny_female)
      : (pokemon.sprites.other?.home?.front_female ?? pokemon.sprites.front_female);
  } else {
    artworkSrc = shiny
      ? pokemon.sprites.other['official-artwork'].front_shiny
      : pokemon.sprites.other['official-artwork'].front_default;
  }

  // ── Type color for glow ──────────────────────────────────────
  const primaryType = pokemon.types[0]?.type.name ?? 'normal';
  const typeColorBg = TYPE_COLORS[primaryType]?.bg ?? '#485a95';

  // ── Species info ─────────────────────────────────────────────
  const genusEntry = species.genera.find(g => g.language.name === 'pt-br')
    ?? species.genera.find(g => g.language.name === 'en');
  const genus = genusEntry?.genus ?? '';

  const flavorEntry = [...species.flavor_text_entries]
    .reverse()
    .find(e => e.language.name === 'pt-br')
    ?? [...species.flavor_text_entries].reverse().find(e => e.language.name === 'en');
  const flavorText = flavorEntry?.flavor_text
    .replace(/[\f\n\r\u000C]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() ?? '';

  const heightM = (pokemon.height / 10).toFixed(1).replace('.', ',');
  const weightKg = (pokemon.weight / 10).toFixed(1).replace('.', ',');

  const displayId = species.id;
  const isLegendary = species.is_legendary;
  const isMythical  = species.is_mythical;

  return (
    <MainLayout>
      <div
        className={styles.page}
        style={{ '--type-color': typeColorBg, '--type-glow': hexToAlpha(typeColorBg, 0.18) } as React.CSSProperties}
      >

        {/* ── Nav arrows ──────────────────────────────────── */}
        <div className={styles.navArrows}>
          {displayId > 1 ? (
            <Link to={`/pokedex/${displayId - 1}`} className={styles.navBtn}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>#{String(displayId - 1).padStart(4, '0')}</span>
            </Link>
          ) : <span />}
          <Link to="/pokedex" state={{ scrollToId: displayId }} className={styles.navBack}>Pokédex</Link>
          {displayId < MAX_POKEMON && (
            <Link to={`/pokedex/${displayId + 1}`} className={styles.navBtn}>
              <span>#{String(displayId + 1).padStart(4, '0')}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
        </div>

        {/* ── Hero ─────────────────────────────────────────── */}
        <div className={styles.hero}>

          {/* Artwork side */}
          <div className={styles.heroArtwork}>
            <div className={styles.artworkWrap}>
              <div className={styles.artworkGlow} aria-hidden="true" />
              <div className={styles.artworkWatermark} aria-hidden="true">
                #{String(displayId).padStart(4, '0')}
              </div>
              {artworkSrc ? (
                <img
                  key={`${id}-${shiny}-${female}`}
                  src={artworkSrc}
                  alt={capitalize(pokemon.name)}
                  className={styles.artworkImg}
                  draggable={false}
                />
              ) : (
                <div className={styles.artworkPlaceholder} />
              )}
            </div>

            {/* Toggles */}
            <div className={styles.artworkToggles}>
              {hasShiny && (
                <button
                  className={`${styles.toggleBtn} ${shiny ? styles.toggleActive : ''}`}
                  onClick={() => setShiny(v => !v)}
                  aria-pressed={shiny}
                >
                  ✦ Shiny
                </button>
              )}
              {hasGender && (
                <button
                  className={`${styles.toggleBtn} ${female ? styles.toggleActive : ''}`}
                  onClick={() => setFemale(v => !v)}
                  aria-pressed={female}
                >
                  {female ? '♀ Fêmea' : '♂ Macho'}
                </button>
              )}
            </div>
          </div>

          {/* Info side */}
          <div className={styles.heroInfo}>
            <div className={styles.heroMeta}>
              <span className={styles.heroNumber}>#{String(displayId).padStart(4, '0')}</span>
              {(isLegendary || isMythical) && (
                <span className={styles.legendaryBadge}>
                  {isMythical ? 'Mítico' : 'Lendário'}
                </span>
              )}
            </div>

            <h1 className={styles.heroName}>{capitalize(pokemon.name)}</h1>

            {genus && <p className={styles.heroGenus}>{genus}</p>}

            <div className={styles.heroTypes}>
              {pokemon.types.map(({ type }) => <TypeBadge key={type.name} typeName={type.name} />)}
            </div>

            {flavorText && <p className={styles.heroFlavor}>{flavorText}</p>}

            <div className={styles.infoGrid}>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Altura</span>
                <span className={styles.infoValue}>{heightM} m</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Peso</span>
                <span className={styles.infoValue}>{weightKg} kg</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Exp. Base</span>
                <span className={styles.infoValue}>{pokemon.base_experience ?? '—'}</span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Felicidade</span>
                <span className={styles.infoValue}>{species.base_happiness ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sections ─────────────────────────────────────── */}
        <div className={styles.sections}>
          <StatsSection key={`stats-${pokemon.id}`} stats={pokemon.stats} />
          <AbilitiesSection abilities={abilities} />
          <EffectivenessSection te={typeEffectiveness} />
          <EvolutionSection evoPaths={evoPaths} currentId={pokemon.id} />
          {alternateForms !== null && alternateForms.length > 0 && (
            <FormsSection forms={alternateForms} />
          )}
        </div>

      </div>
    </MainLayout>
  );
};

export default PokemonDetailPage;

import { Link } from 'react-router-dom';
import { MdCatchingPokemon } from "react-icons/md";
import { CiCircleList } from "react-icons/ci";
import { PiBaseballCap } from "react-icons/pi";
import styles from './FeaturesSection.module.scss';

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
  linkLabel: string;
  accent: string;
}

const FEATURES: Feature[] = [
  {
    id: 'pokedex',
    icon: <MdCatchingPokemon size={30} />,
    title: 'Pokédex',
    description:
      'Explore todos os 900+ Pokémons com detalhes completos: tipos, stats base, habilidades, evoluções e sprites oficiais.',
    path: '/pokedex',
    linkLabel: 'Explorar Pokédex',
    accent: '#485a95',
  },
  {
    id: 'generations',
    icon: <CiCircleList size={30} />,
    title: 'Gerações',
    description:
      'Da Geração I à IX, veja quais Pokémons foram introduzidos em cada era, as regiões, jogos e marcos históricos.',
    path: '/generations',
    linkLabel: 'Ver Gerações',
    accent: '#4f83dd',
  },
  {
    id: 'trainers',
    icon: <PiBaseballCap size={30} />,
    title: 'Treinadores',
    description:
      'Conheça os treinadores mais icônicos do universo Pokémon: líderes de ginásio, membros da Elite 4 e campeões.',
    path: '/trainers',
    linkLabel: 'Ver Treinadores',
    accent: '#9394d8',
  }
];

const FeaturesSection: React.FC = () => {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>O que você encontra aqui</p>
          <h2 className={styles.title}>
            Tudo sobre o universo{' '}
            <span className={styles.titleAccent}>Pokémon</span>
          </h2>
          <p className={styles.subtitle}>
            Dados completos e atualizados, organizados para você explorar com facilidade.
          </p>
        </div>

        <div className={styles.grid}>
          {FEATURES.map((feature) => (
            <article
              key={feature.id}
              className={styles.card}
              style={{ '--card-accent': feature.accent } as React.CSSProperties}
            >
              <div className={styles.cardIcon}>{feature.icon}</div>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDescription}>{feature.description}</p>
              <Link to={feature.path} className={styles.cardLink}>
                {feature.linkLabel}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

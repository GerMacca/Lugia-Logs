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
      'Explore over 900 Pokémon with full details: types, base stats, abilities, evolutions, and official sprites.',
    path: '/pokedex',
    linkLabel: 'Explore Pokédex',
    accent: '#485a95',
  },
  {
    id: 'generations',
    icon: <CiCircleList size={30} />,
    title: 'Generations',
    description:
      'From Generation I to IX, discover which Pokémon were introduced in each era, along with regions, games, and major milestones.',
    path: '/generations',
    linkLabel: 'View Generations (developing)',
    accent: '#4f83dd',
  },
  {
    id: 'trainers',
    icon: <PiBaseballCap size={30} />,
    title: 'Trainers',
    description:
      'Meet the most iconic trainers in the Pokémon universe: Gym Leaders, Elite Four members, and Champions.',
    path: '/trainers',
    linkLabel: 'View Trainers (developing)',
    accent: '#9394d8',
  }
];

const FeaturesSection: React.FC = () => {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>What you'll find here</p>
          <h2 className={styles.title}>
            Everything about the{' '}
            <span className={styles.titleAccent}>Pokémon</span> universe
          </h2>
          <p className={styles.subtitle}>
            Complete and up-to-date data, organized so you can explore it easily.
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

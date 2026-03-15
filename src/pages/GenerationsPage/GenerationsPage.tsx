import MainLayout from '../../layouts/MainLayout/MainLayout';

import styles from './GenerationsPage.module.scss';

const GenerationsPage: React.FC = () => {
  return (
    <MainLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Generations</h1>
          <p className={styles.subtitle}>From Generation I to IX — history and Pokémon of each era.</p>
        </div>
        <p className={styles.wip}>Under construction — coming soon.</p>
      </div>
    </MainLayout>
  );
};

export default GenerationsPage;

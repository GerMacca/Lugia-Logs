import MainLayout from '../../layouts/MainLayout/MainLayout';

import styles from './TrainersPage.module.scss';

const TrainersPage: React.FC = () => {
  return (
    <MainLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Trainers</h1>
          <p className={styles.subtitle}>Gym Leaders, Elite Four, and Champions of the Pokémon universe.</p>
        </div>
        <p className={styles.wip}>Under construction — coming soon.</p>
      </div>
    </MainLayout>
  );
};

export default TrainersPage;

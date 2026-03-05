import MainLayout from '../../layouts/MainLayout/MainLayout';

import styles from './TrainersPage.module.scss';

const TrainersPage: React.FC = () => {
  return (
    <MainLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Treinadores</h1>
          <p className={styles.subtitle}>Líderes de ginásio, Elite 4 e campeões do universo Pokémon.</p>
        </div>
        <p className={styles.wip}>Em construção — em breve aqui.</p>
      </div>
    </MainLayout>
  );
};

export default TrainersPage;

import MainLayout from '../../layouts/MainLayout/MainLayout';

import styles from './GenerationsPage.module.scss';

const GenerationsPage: React.FC = () => {
  return (
    <MainLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Gerações</h1>
          <p className={styles.subtitle}>Da Geração I à IX — história e Pokémons de cada era.</p>
        </div>
        <p className={styles.wip}>Em construção — em breve aqui.</p>
      </div>
    </MainLayout>
  );
};

export default GenerationsPage;

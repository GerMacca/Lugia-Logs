import { useParams } from 'react-router-dom';

import MainLayout from '../../layouts/MainLayout/MainLayout';

import styles from './TrainerDetailPage.module.scss';

const TrainerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <MainLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>Trainer: {id}</h1>
        <p className={styles.wip}>Details under construction.</p>
      </div>
    </MainLayout>
  );
};

export default TrainerDetailPage;

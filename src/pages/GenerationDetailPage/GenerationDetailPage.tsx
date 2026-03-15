import { useParams } from 'react-router-dom';

import MainLayout from '../../layouts/MainLayout/MainLayout';

import styles from './GenerationDetailPage.module.scss';

const GenerationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <MainLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>Generation {id}</h1>
        <p className={styles.wip}>Details under construction.</p>
      </div>
    </MainLayout>
  );
};

export default GenerationDetailPage;

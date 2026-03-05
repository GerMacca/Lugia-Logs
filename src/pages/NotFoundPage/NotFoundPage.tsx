import { Link } from 'react-router-dom';

import MainLayout from '../../layouts/MainLayout/MainLayout';

import styles from './NotFoundPage.module.scss';

const NotFoundPage: React.FC = () => {
  return (
    <MainLayout>
      <div className={styles.page}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Página não encontrada</h1>
        <p className={styles.subtitle}>
          Parece que você se perdeu na Rota 404. Volte para o início e tente de novo.
        </p>
        <Link to="/" className={styles.btn}>
          Voltar ao início
        </Link>
      </div>
    </MainLayout>
  );
};

export default NotFoundPage;

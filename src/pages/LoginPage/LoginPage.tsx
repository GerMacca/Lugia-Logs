import { Link } from 'react-router-dom';

import MainLayout from '../../layouts/MainLayout/MainLayout';

import styles from './LoginPage.module.scss';

const LoginPage: React.FC = () => {
  return (
    <MainLayout>
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Entrar</h1>
          <p className={styles.subtitle}>
            Não tem conta?{' '}
            <Link to="/register" className={styles.link}>Registre-se</Link>
          </p>
          <p className={styles.wip}>Formulário em construção.</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoginPage;

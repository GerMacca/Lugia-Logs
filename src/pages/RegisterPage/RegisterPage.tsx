import { Link } from 'react-router-dom';

import MainLayout from '../../layouts/MainLayout/MainLayout';

import styles from './RegisterPage.module.scss';

const RegisterPage: React.FC = () => {
  return (
    <MainLayout>
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Criar conta</h1>
          <p className={styles.subtitle}>
            Já tem conta?{' '}
            <Link to="/login" className={styles.link}>Entrar</Link>
          </p>
          <p className={styles.wip}>Formulário em construção.</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default RegisterPage;

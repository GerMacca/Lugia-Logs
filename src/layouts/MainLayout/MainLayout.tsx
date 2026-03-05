import type React from 'react';

import Footer from './components/Footer/Footer';
import Navbar from './components/Navbar/Navbar';
import styles from './MainLayout.module.scss';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Navbar />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;

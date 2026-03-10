import { Link } from 'react-router-dom';
import Logo from '../../../../assets/logo.png'
import styles from './Footer.module.scss';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link to="/" className={styles.brandName}>
              <img src={Logo} className={styles.logoimg} />
              <div>
                <span className={styles.brandAccent}>Lugia</span>Logs
              </div>
            </Link>
            <p className={styles.brandTagline}>
              A complete encyclopedia of the Pokémon universe.
            </p>
          </div>

          <nav className={styles.footerNav} aria-label="Footer links">
            <div className={styles.navGroup}>
              <span className={styles.navGroupTitle}>Explore</span>
              <ul className={styles.navList}>
                <li><Link to="/pokedex" className={styles.navLink}>Pokédex</Link></li>
                <li><Link to="/generations" className={styles.navLink}>Generations</Link></li>
                <li><Link to="/trainers" className={styles.navLink}>Trainers</Link></li>
              </ul>
            </div>
            <div className={styles.navGroup}>
              <span className={styles.navGroupTitle}>Account</span>
              <ul className={styles.navList}>
                <li><Link to="/login" className={styles.navLink}>Login</Link></li>
                <li><Link to="/register" className={styles.navLink}>Sign up</Link></li>
              </ul>
            </div>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>
            © {new Date().getFullYear()} LugiaLogs. Data provided by{' '}
            <a
              href="https://pokeapi.co"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
            >
              PokéAPI
            </a>
            .
          </p>
          <p className={styles.disclaimer}>
            Pokémon and all related names are trademarks of Nintendo / Game Freak.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

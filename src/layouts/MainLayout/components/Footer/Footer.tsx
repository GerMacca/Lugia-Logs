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
              Uma enciclopédia completa do universo Pokémon.
            </p>
          </div>

          <nav className={styles.footerNav} aria-label="Links do rodapé">
            <div className={styles.navGroup}>
              <span className={styles.navGroupTitle}>Explorar</span>
              <ul className={styles.navList}>
                <li><Link to="/pokedex" className={styles.navLink}>Pokédex</Link></li>
                <li><Link to="/generations" className={styles.navLink}>Gerações</Link></li>
                <li><Link to="/trainers" className={styles.navLink}>Treinadores</Link></li>
              </ul>
            </div>
            <div className={styles.navGroup}>
              <span className={styles.navGroupTitle}>Conta</span>
              <ul className={styles.navList}>
                <li><Link to="/login" className={styles.navLink}>Entrar</Link></li>
                <li><Link to="/register" className={styles.navLink}>Registrar</Link></li>
              </ul>
            </div>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>
            © {new Date().getFullYear()} LugiaLogs. Dados fornecidos pela{' '}
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
            Pokémon e todos os nomes relacionados são marcas registradas da Nintendo / Game Freak.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

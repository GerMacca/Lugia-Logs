import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from '../../../../assets/logo.png';
import styles from './Navbar.module.scss';

interface NavItem {
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Pokédex',     path: '/pokedex'     },
  { label: 'Gerações',    path: '/generations'  },
  { label: 'Treinadores', path: '/trainers'     },
];

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // Fecha ao navegar
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Trava scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <header className={styles.header}>

      {/* ── Linha do topo ────────────────────────────────────────── */}
      <nav className={styles.nav} aria-label="Navegação principal">

        {/* Logo */}
        <Link to="/" className={styles.logo} onClick={close}>
          <img src={Logo} className={styles.logoImg} alt="" aria-hidden="true" />
          <span><span className={styles.logoAccent}>Lugia</span>Logs</span>
        </Link>

        {/* Links centrados (desktop) */}
        <ul className={styles.links}>
          {NAV_ITEMS.map(({ label, path }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  [styles.link, isActive ? styles.linkActive : ''].join(' ')
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Ações (desktop) */}
        <div className={styles.actions}>
          <Link to="/login"    className={styles.loginBtn}>Entrar</Link>
          <Link to="/register" className={styles.registerBtn}>Registrar</Link>
        </div>

        {/* Hamburger (mobile) */}
        <button
          className={`${styles.burger}${menuOpen ? ` ${styles.burgerOpen}` : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <span /><span /><span />
        </button>

      </nav>

      {/* ── Menu mobile ──────────────────────────────────────────── */}
      <div
        id="mobile-menu"
        className={`${styles.mobileMenu}${menuOpen ? ` ${styles.mobileMenuOpen}` : ''}`}
        aria-hidden={!menuOpen}
      >
        <div className={styles.mobileMenuInner}>

          <ul className={styles.mobileLinks}>
            {NAV_ITEMS.map(({ label, path }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    [styles.mobileLink, isActive ? styles.mobileLinkActive : ''].join(' ')
                  }
                  onClick={close}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className={styles.mobileActions}>
            <Link to="/login"    className={styles.mobileLoginBtn}    onClick={close}>Entrar</Link>
            <Link to="/register" className={styles.mobileRegisterBtn} onClick={close}>Registrar</Link>
          </div>

        </div>
      </div>

    </header>
  );
};

export default Navbar;

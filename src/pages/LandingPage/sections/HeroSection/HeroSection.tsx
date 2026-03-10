import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import LUGIA1_ART from '../../../../assets/lugia.png';
import LUGIA2_ART from '../../../../assets/lugia2.png';
import LUGIA3_ART from '../../../../assets/lugia3.png';
import LUGIA4_ART from '../../../../assets/lugia4.png';
import LUGIA5_ART from '../../../../assets/lugia5.png';

import styles from './HeroSection.module.scss';

const STATS = [
  { value: '1000+', label: 'Pokémon' },
  { value: '9', label: 'Generations' },
  { value: '18', label: 'Types' },
];

const CAROUSEL_ITEMS = [
  { id: 249, name: 'Lugia Official Sprite', src: LUGIA1_ART },
  { id: 250, name: 'Lugia Ocean Guardian', src: LUGIA2_ART },
  { id: 150, name: 'Lugia Hand Painted', src: LUGIA3_ART },
  { id: 384, name: 'Lugia Soul Silver Sprite', src: LUGIA4_ART },
  { id: 483, name: 'Lugia From Our Logo', src: LUGIA5_ART },
];

const INTERVAL = 4500;

const HeroSection: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setCurrent(c => (c + 1) % CAROUSEL_ITEMS.length);
    }, INTERVAL);
    return () => clearInterval(id);
  }, [paused, timerKey]);

  const goTo = (index: number) => {
    setCurrent(index);
    setTimerKey(k => k + 1);
  };

  return (
    <section className={styles.hero}>
      <div className={styles.bgBlob} aria-hidden="true" />

      <div className={styles.content}>

        <h1 className={styles.title}>
          Explore the
          <span className={styles.titleGradient}> Pokémon </span>
          universe
          <br />
          like never before!
        </h1>

        <p className={styles.subtitle}>
          A complete, dynamic, and interactive digital encyclopedia that brings
          together detailed information from every Pokémon generation, including
          species, types, abilities, evolutions, stats, alternate forms, and much more.
          All presented in an organized, visual, and easy-to-explore way, with data
          updated in real time.
        </p>
        <div className={styles.actions}>
          <Link to="/pokedex" className={styles.btnPrimary}>
            Start my journey!
          </Link>
        </div>

        <div className={styles.stats}>
          {STATS.map(({ value, label }) => (
            <div key={label} className={styles.stat}>
              <span className={styles.statValue}>{value}</span>
              <span className={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.visual}>
        <div className={styles.visualGlow} aria-hidden="true" />
        <div className={styles.visualRing} aria-hidden="true" />

        {/* Mobile: watermark estática */}
        <img
          src={LUGIA1_ART}
          alt="Lugia"
          className={styles.lugiaImg}
          draggable={false}
        />

        {/* Desktop only: carrossel de lendários */}
        <div
          className={styles.carousel}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className={styles.carouselImgWrap}>
            {CAROUSEL_ITEMS.map((item, i) => (
              <img
                key={item.id}
                src={item.src}
                alt={item.name}
                className={`${styles.carouselImg}${i === current ? ` ${styles.carouselImgActive}` : ''}`}
                draggable={false}
              />
            ))}
          </div>

          <div className={styles.carouselFooter}>
            <span className={styles.carouselName}>{CAROUSEL_ITEMS[current].name}</span>
            <div className={styles.carouselDots} role="tablist">
              {CAROUSEL_ITEMS.map((item, i) => (
                <button
                  key={item.id}
                  className={`${styles.carouselDot}${i === current ? ` ${styles.carouselDotActive}` : ''}`}
                  onClick={() => goTo(i)}
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Ver ${item.name}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

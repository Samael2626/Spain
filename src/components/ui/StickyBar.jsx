import React, { useState, useEffect } from 'react';
import { Tag, ArrowUpRight } from 'lucide-react';
import { sound } from '../../audio/soundFx';

export default function StickyBar({
  selectedColor = 'camo',
  onOpenOffers = () => {},
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Appear after scrolling down past the initial hero
      if (window.scrollY > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="sticky-buy-bar">
      <div className="sticky-container">
        <div className="sticky-meta">
          <strong className="sticky-title">JIMKEG™ TACTICAL 2.2L</strong>
          <span className="sticky-color-tag">
            {selectedColor === 'camo' ? 'Camuflaje Gris' : 'Negro Stealth'}
          </span>
          <span className="sticky-price">Desde 34,95 €</span>
        </div>

        <button
          className="sticky-btn"
          aria-label="Ver ofertas de JIMKEG"
          onClick={() => {
            sound.playClick();
            onOpenOffers();
          }}
        >
          <Tag size={16} />
          <span>VER OFERTAS</span>
          <ArrowUpRight size={16} />
        </button>
      </div>
    </div>
  );
}

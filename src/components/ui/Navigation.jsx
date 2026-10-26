import React from 'react';
import { Tag, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../../audio/soundFx';

export default function Navigation({
  onOpenOffers = () => {},
  soundEnabled = true,
  onToggleSound = () => {},
}) {
  return (
    <header className="nav-header">
      <div className="nav-container">
        {/* Brand Logo */}
        <a className="nav-logo" href="#inicio" aria-label="JIMKEG, volver al inicio">
          <span className="logo-glitch" data-text="JIMKEG">JIMKEG</span>
          <span className="logo-badge">TACTICAL 2.2L</span>
        </a>

        {/* Clean Luxury Nav Anchors */}
        <nav className="nav-links-center">
          <a href="#estudio" className="nav-link">Estudio 3D</a>
          <a href="#prueba" className="nav-link">Detalles</a>
          <a href="#entornos" className="nav-link">Escenarios</a>
          <a href="#packs" className="nav-link">Packs</a>
        </nav>

        {/* Navigation Actions */}
        <div className="nav-actions">
          {/* Sound Synthesizer Toggle */}
          <button
            className={`nav-btn-icon ${soundEnabled ? 'active' : ''}`}
            onClick={() => {
              onToggleSound();
              sound.playClick();
            }}
            title={soundEnabled ? 'Silenciar Efectos 3D' : 'Activar Sonido Sintetizado'}
            aria-label={soundEnabled ? 'Silenciar efectos' : 'Activar efectos'}
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            className="nav-offer-btn"
            aria-label="Ver ofertas"
            onClick={() => {
              sound.playClick();
              onOpenOffers();
            }}
          >
            <Tag size={18} />
            <span className="offer-nav-text">VER OFERTAS</span>
          </button>
        </div>
      </div>
    </header>
  );
}

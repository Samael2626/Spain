import React from 'react';
import { Palette, RotateCcw, CheckCircle2, ArrowRight } from 'lucide-react';
import { sound } from '../../audio/soundFx';

export default function ConfiguratorSection({
  activeColor = 'camo',
  onColorChange = () => {},
  manualRotation = 0,
  onRotate = () => {},
  onBuyClick = () => {},
}) {
  return (
    <section className="configurator-section">
      <div className="config-panel">
        <div className="section-pill">
          <Palette size={14} />
          <span>ESTUDIO 3D • PERSONALIZACIÓN</span>
        </div>

        <h2 className="config-title">
          ELIGE TU ESTILO: <br />
          <span className="gradient-text">DOS MODELOS, MISMA ROBUSTEZ.</span>
        </h2>

        <p className="config-desc">
          Cambia de color en tiempo real en el visor 3D superior y rota libremente la botella
          para apreciar la textura del neopreno y el acolchado de la correa.
        </p>

        {/* Color Switcher Buttons */}
        <div className="color-swatches-grid">
          {/* Option 1: Camo */}
          <button
            className={`swatch-card ${activeColor === 'camo' ? 'active' : ''}`}
            onClick={() => {
              sound.playSwitch();
              onColorChange('camo');
            }}
          >
            <div className="swatch-preview camo-bg"></div>
            <div className="swatch-meta">
              <span className="swatch-name">CAMUFLAJE GRIS</span>
              <span className="swatch-style">Ártico Militar • Más Popular</span>
            </div>
            {activeColor === 'camo' && <CheckCircle2 className="swatch-check" size={20} />}
          </button>

          {/* Option 2: Stealth Black */}
          <button
            className={`swatch-card ${activeColor === 'black' ? 'active' : ''}`}
            onClick={() => {
              sound.playSwitch();
              onColorChange('black');
            }}
          >
            <div className="swatch-preview black-bg"></div>
            <div className="swatch-meta">
              <span className="swatch-name">NEGRO STEALTH</span>
              <span className="swatch-style">Obsidian Mate • Táctico Minimal</span>
            </div>
            {activeColor === 'black' && <CheckCircle2 className="swatch-check" size={20} />}
          </button>
        </div>

        {/* 360 Rotation Controls */}
        <div className="rotation-control-box">
          <div className="rotation-header">
            <span className="control-label">ROTACIÓN 360° MANUAL:</span>
            <button
              className="reset-rot-btn"
              onClick={() => {
                sound.playClick();
                onRotate(0);
              }}
            >
              <RotateCcw size={14} />
              <span>Centrar</span>
            </button>
          </div>
          <input
            type="range"
            min="0"
            max={Math.PI * 2}
            step="0.05"
            value={manualRotation % (Math.PI * 2)}
            onChange={(e) => {
              onRotate(parseFloat(e.target.value));
            }}
            className="rot-slider"
          />
        </div>

        {/* Highlights List */}
        <ul className="config-features-list">
          <li>
            <CheckCircle2 size={16} className="feature-icon" />
            <span>Incluye correa ajustable de hombro con almohadilla de neopreno con logo.</span>
          </li>
          <li>
            <CheckCircle2 size={16} className="feature-icon" />
            <span>Capacidad exacta de 2.220 ml (74 oz) calibrada con marcadores horarios.</span>
          </li>
          <li>
            <CheckCircle2 size={16} className="feature-icon" />
            <span>Garantía de reemplazo inmediato de 30 días sin preguntas.</span>
          </li>
        </ul>

        {/* Action Button */}
        <button
          className="btn-primary buy-edition-btn"
          onClick={() => {
            sound.playSuccess();
            onBuyClick();
          }}
        >
          <span>PEDIR MODELO {activeColor === 'camo' ? 'CAMUFLAJE GRIS' : 'NEGRO STEALTH'}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}

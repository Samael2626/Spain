import React, { useState } from 'react';
import { Plus, Minus, Layers, Smartphone, Check, Droplets, MoveUpRight } from 'lucide-react';
import { sound } from '../../audio/soundFx';
import { MAX_QUANTITY, priceFor, formatPrice } from '../../data/pricing';

export default function PruebaSection({
  selectedColor = 'camo',
  onColorChange = () => {},
  onOpenPack = () => {},
}) {
  const [quantity, setQuantity] = useState(1);
  const currentPrice = priceFor(quantity);

  const currentPhoto =
    selectedColor === 'camo'
      ? '/images/studio-camo.webp'
      : '/images/studio-black.webp';

  return (
    <section className="prueba-section" id="prueba">
      <div className="prueba-grid">
        {/* Left Column: Real Photographic Studio Preview */}
        <div className="prueba-visual-card">
          <div className="visual-media-box">
            <div className="visual-img-wrapper">
              <img
                key={selectedColor}
                src={currentPhoto}
                alt={`JIMKEG 2.2L ${selectedColor === 'camo' ? 'Camuflaje Gris' : 'Negro Stealth'}`}
                className="prueba-active-img"
                loading="lazy"
              />
            </div>
            <p className="visual-caption">
              Edición {selectedColor === 'camo' ? 'Camuflaje gris' : 'Negro Stealth'} con funda, correa y bolsillo frontal.
            </p>
          </div>
        </div>

        {/* Right Column: High-Converting Buy Box (Elementra Pattern) */}
        <div className="prueba-panel">
          <span className="prueba-kicker">PRUÉBALA EN TU PRÓXIMO RETO</span>
          <h2 className="prueba-title">JIMKEG™ Tactical 2.2L</h2>
          <p className="prueba-desc">
            Una botella de 2,2 L con bolsillo frontal y correa. Mira los dos acabados y elige cuántas unidades quieres.
          </p>

          {/* Color Selection */}
          <div className="prueba-options-box">
            <label className="options-title">
              Color Seleccionado:{' '}
              <strong className="text-amber">
                {selectedColor === 'camo' ? 'Camuflaje Gris (Ártico)' : 'Negro Stealth (Obsidian Mate)'}
              </strong>
            </label>
            <div className="options-swatches">
              <button
                type="button"
                className={`swatch-btn ${selectedColor === 'camo' ? 'active' : ''}`}
                aria-pressed={selectedColor === 'camo'}
                onClick={() => {
                  sound.playSwitch();
                  onColorChange('camo');
                }}
              >
                <span className="swatch-circle swatch-camo"></span>
                <span className="swatch-label">Camuflaje Gris</span>
                {selectedColor === 'camo' && <Check size={16} className="text-amber" />}
              </button>

              <button
                type="button"
                className={`swatch-btn ${selectedColor === 'black' ? 'active' : ''}`}
                aria-pressed={selectedColor === 'black'}
                onClick={() => {
                  sound.playSwitch();
                  onColorChange('black');
                }}
              >
                <span className="swatch-circle swatch-black"></span>
                <span className="swatch-label">Negro Stealth</span>
                {selectedColor === 'black' && <Check size={16} className="text-amber" />}
              </button>
            </div>
          </div>

          {/* Pricing & Stepper Row */}
          <div className="prueba-buy-row">
            <div className="prueba-pricing">
              <span className="price-current">{formatPrice(currentPrice)}</span>
              <span className="price-save">{quantity} {quantity === 1 ? 'unidad' : 'unidades'}</span>
            </div>

            <div className="prueba-stepper">
              <button
                type="button"
                className="step-btn"
                onClick={() => {
                  sound.playClick();
                  setQuantity((q) => Math.max(1, q - 1));
                }}
                disabled={quantity <= 1}
                aria-label="Reducir cantidad"
              >
                <Minus size={16} />
              </button>
              <span className="step-val">{quantity}</span>
              <button
                type="button"
                className="step-btn"
                onClick={() => {
                  sound.playClick();
                  setQuantity((q) => Math.min(MAX_QUANTITY, q + 1));
                }}
                disabled={quantity >= MAX_QUANTITY}
                aria-label="Aumentar cantidad"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              type="button"
              className="btn-amber prueba-add-btn"
              onClick={() => {
                sound.playClick();
                onOpenPack(quantity, selectedColor);
              }}
            >
              <span>VER PACKS</span>
            </button>
          </div>

          {/* Product details visible in the approved images */}
          <ul className="prueba-features-list">
            <li>
              <Droplets size={18} className="feat-icon text-amber" />
              <div>
                <strong>Hidratación de 2.200 ml</strong>
                <span>Capacidad indicada del producto.</span>
              </div>
            </li>
            <li>
              <Layers size={18} className="feat-icon text-amber" />
              <div>
                <strong>Funda exterior</strong>
                <span>Disponible en Camuflaje gris y Negro Stealth.</span>
              </div>
            </li>
            <li>
              <Smartphone size={18} className="feat-icon text-amber" />
              <div>
                <strong>Bolsillo frontal</strong>
                <span>Espacio visible en la funda para llevar el móvil.</span>
              </div>
            </li>
            <li>
              <MoveUpRight size={18} className="feat-icon text-amber" />
              <div>
                <strong>Correa de transporte</strong>
                <span>Para llevar la botella al hombro.</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

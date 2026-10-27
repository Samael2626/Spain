import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { sound } from '../../audio/soundFx';
import { PACK_PRICES, formatPrice } from '../../data/pricing';

export default function HeroSection({
  onExploreClick = () => {},
  onBuyClick = () => {},
}) {
  return (
    <section className="hero-editorial-section" id="hero" aria-labelledby="hero-title">
      <div className="hero-backdrop-image" aria-hidden="true">
        <img
          src="/images/hero-mountain.webp"
          srcSet="/images/hero-mountain-768.webp 768w, /images/hero-mountain.webp 1376w"
          sizes="100vw"
          alt=""
          className="hero-img-cover"
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero-vignette-overlay" />
      </div>

      <div className="hero-layout">
        <div className="hero-container">
          <p className="hero-eyebrow">JIMKEG <span> / </span> BOTELLA TÁCTICA</p>
          <h1 className="hero-main-title" id="hero-title">
            <span className="hero-brand-name">JIMKEG™</span>
            <span className="hero-product-type">TACTICAL 2.2L</span>
          </h1>
          <p className="hero-editorial-desc">
            Botella de 2,2 L con funda, correa y bolsillo frontal. Disponible en Camuflaje gris y Negro Stealth.
          </p>
          <div className="hero-offer-row">
            <span className="hero-offer-label">DESDE</span>
            <strong className="hero-offer-price">{formatPrice(PACK_PRICES[1])}</strong>
            <span className="hero-offer-note">1 unidad</span>
          </div>
          <div className="hero-actions-row">
            <button
              className="btn-amber"
              onClick={() => { sound.playClick(); onBuyClick(); }}
            >
              VER OFERTAS <ArrowUpRight size={19} aria-hidden="true" />
            </button>
            <button
              className="btn-outline"
              onClick={() => { sound.playClick(); onExploreClick(); }}
            >
              EXPLORAR DETALLES <ArrowDownRight size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="hero-detail-line" aria-label="Características del producto">
            <span>2,2 L DE CAPACIDAD</span>
            <span>DOS ACABADOS</span>
            <span>FUNDA CON BOLSILLO</span>
          </div>
        </div>

      </div>
    </section>
  );
}

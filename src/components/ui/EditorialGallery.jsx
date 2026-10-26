import React, { useEffect, useState } from 'react';
import ExplodedDetailPanel from './ExplodedDetailPanel';

const images = [
  { src: '/images/studio-camo.jpg', alt: 'JIMKEG Camuflaje gris con funda y correa', label: 'CAMUFLAJE GRIS', index: '01', color: 'camo' },
  { src: '/images/studio-black.jpg', alt: 'JIMKEG Negro Stealth con bolsillo frontal', label: 'NEGRO STEALTH', index: '02', color: 'black' },
];

export default function EditorialGallery({ onSelectColor = () => {} }) {
  const [detailOpen, setDetailOpen] = useState(false);
  useEffect(() => {
    if (!detailOpen) return;
    document.getElementById('despiece')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [detailOpen]);
  const selectColor = (color) => {
    onSelectColor(color);
    document.getElementById('prueba')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="editorial-gallery" id="galeria" aria-label="Galería fotográfica JIMKEG">
      <div className="editorial-gallery-heading">
        <span>01 / GALERÍA JIMKEG</span>
        <p>Dos acabados. Funda, correa y bolsillo frontal.</p>
        <span className="gallery-swipe-hint">DESLIZA PARA VER →</span>
      </div>
      <div className="editorial-gallery-grid">
        {images.map(({ src, alt, label, index, color }) => (
          <figure className={`gallery-frame gallery-frame-${index}`} key={src}>
            <img src={src} alt={alt} loading="lazy" decoding="async" />
            <button type="button" onClick={() => selectColor(color)} aria-label={`Ver acabado ${label} en el configurador`}>
              <span>VER ACABADO ↗</span>
            </button>
            <figcaption><span>{index} / PRODUCTO</span><strong>{label}</strong></figcaption>
          </figure>
        ))}
        <div className="gallery-detail-card">
          <button type="button" className="gallery-detail-trigger" onClick={() => setDetailOpen((open) => !open)} aria-expanded={detailOpen} aria-controls="despiece">
            <img src="/images/jimkeg-exploded-concept.png" alt="" loading="lazy" decoding="async" />
            <span className="gallery-detail-copy">
              <span>03 / DESPIECE</span>
              <strong>VISTA DE<br />DETALLE</strong>
              <span className="gallery-detail-description">Cuatro piezas. Una sola botella.</span>
              <span className="gallery-detail-action">{detailOpen ? 'OCULTAR PIEZAS' : 'EXPLORAR PIEZAS'} <span aria-hidden="true">↗</span></span>
            </span>
          </button>
        </div>
      </div>
      {detailOpen && <ExplodedDetailPanel onClose={() => setDetailOpen(false)} />}
    </section>
  );
}

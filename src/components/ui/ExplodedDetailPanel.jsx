import React from 'react';
import { X } from 'lucide-react';

const parts = [
  { number: '01', name: 'Tapa', detail: 'Apertura y asa de transporte' },
  { number: '02', name: 'Botella', detail: 'Capacidad de 2,2 L' },
  { number: '03', name: 'Funda', detail: 'Bolsillo frontal' },
  { number: '04', name: 'Correa', detail: 'Transporte al hombro' },
];

export default function ExplodedDetailPanel({ onClose }) {
  return (
    <section className="exploded-panel" id="despiece" aria-labelledby="exploded-title">
      <header className="exploded-header">
        <div>
          <span>VISTA POR COMPONENTES / CAMUFLAJE GRIS</span>
          <h3 id="exploded-title">JIMKEG, POR PARTES<span>.</span></h3>
          <p>Tapa, botella, funda y correa. Explora cada elemento por separado.</p>
        </div>
        <button type="button" className="exploded-close" onClick={onClose} aria-label="Cerrar despiece"><X size={18} aria-hidden="true" /> CERRAR</button>
      </header>
      <div className="exploded-layout">
        <div className="exploded-art">
          <img src="/images/jimkeg-exploded-concept.webp" loading="lazy" decoding="async" alt="Ilustración conceptual de tapa, botella, funda de camuflaje y correa separadas" />
          <span>DESPIECE / CAMUFLAJE GRIS</span>
        </div>
        <div className="exploded-parts" aria-label="Componentes de la botella">
          {parts.map((part) => (
            <div className="exploded-part" key={part.number}>
              <span>{part.number} / 04</span>
              <div><strong>{part.name}</strong><p>{part.detail}</p></div>
            </div>
          ))}
        </div>
      </div>
      <p className="exploded-disclaimer">Esquema visual provisional. Se sustituirá por los renders finales de Blender.</p>
    </section>
  );
}

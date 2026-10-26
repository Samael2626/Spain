import React, { useEffect, useRef } from 'react';
import { ArrowUpRight, X } from 'lucide-react';

export default function PromoPreviewPopup({ onClose, onBrowseOffers }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('button')?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const buttons = [...dialogRef.current.querySelectorAll('button')];
      if (event.shiftKey && document.activeElement === buttons[0]) {
        event.preventDefault();
        buttons.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === buttons.at(-1)) {
        event.preventDefault();
        buttons[0]?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="promo-preview-backdrop" onMouseDown={onClose}>
      <div ref={dialogRef} className="promo-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="promo-preview-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="promo-preview-photo"><img src="/images/studio-camo.jpg" alt="JIMKEG Camuflaje gris con funda y correa" /></div>
        <div className="promo-preview-content">
        <button type="button" className="promo-preview-close" onClick={onClose} aria-label="Cerrar promoción de ejemplo"><X size={21} aria-hidden="true" /></button>
        <span className="promo-preview-eyebrow">PROMOCIÓN DE BIENVENIDA</span>
        <h2 id="promo-preview-title">TU JIMKEG<span>™.</span></h2>
        <p>Botella de 2,2 L con funda, bolsillo frontal y correa. Disponible en dos acabados.</p>
        <div className="promo-preview-price">Desde <strong>34,95 €</strong></div>
        <div className="promo-preview-code"><span>CÓDIGO DE DESCUENTO</span><strong>JIMKEG10</strong></div>
        <button type="button" className="promo-preview-primary" onClick={onBrowseOffers}>VER OFERTAS ACTUALES <ArrowUpRight size={18} aria-hidden="true" /></button>
        <button type="button" className="promo-preview-secondary" onClick={onClose}>Seguir mirando</button>
        <small>Código promocional de bienvenida activo para pedidos en península e islas.</small>
        </div>
      </div>
    </div>
  );
}

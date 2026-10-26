import React, { useEffect, useRef, useState } from 'react';
import { Check, LockKeyhole, X } from 'lucide-react';
import { sound } from '../../audio/soundFx';
import { PACK_PRICES, formatPrice } from '../../data/pricing';

const packs = [
  { quantity: 1, label: 'Una unidad' },
  { quantity: 2, label: 'Pack de dos' },
  { quantity: 3, label: 'Pack de tres' },
];

export default function BuyBoxModal({
  isOpen = false,
  onClose = () => {},
  selectedColor = 'camo',
  initialQuantity = 1,
  onColorChange = () => {},
}) {
  const [quantity, setQuantity] = useState(Math.min(3, Math.max(1, initialQuantity)));
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.querySelector('button')?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const focusable = [...modalRef.current.querySelectorAll('button:not([disabled])')];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const finish = selectedColor === 'camo' ? 'Camuflaje gris' : 'Negro Stealth';
  const image = selectedColor === 'camo' ? '/images/studio-camo.jpg' : '/images/studio-black.jpg';

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        ref={modalRef}
        className="buy-modal offer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close-btn" aria-label="Cerrar ofertas" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="offer-visual">
          <img src={image} alt={`JIMKEG en ${finish}`} />
          <span>JIMKEG / 2,2 L</span>
        </div>

        <div className="offer-content">
          <span className="offer-eyebrow">CONFIGURA TU JIMKEG</span>
          <h2 id="offer-title">Elige tu acabado y tu pack.</h2>
          <p className="offer-subtitle">Precios finales de cada combinación. El proceso de compra aún no está disponible.</p>

          <div className="offer-field">
            <h3>Acabado <span>{finish}</span></h3>
            <div className="offer-finish-row">
              <button
                className={`offer-finish ${selectedColor === 'camo' ? 'selected' : ''}`}
                aria-pressed={selectedColor === 'camo'}
                onClick={() => { sound.playSwitch(); onColorChange('camo'); }}
              >
                <span className="offer-swatch camo-dot" /> Camuflaje gris
              </button>
              <button
                className={`offer-finish ${selectedColor === 'black' ? 'selected' : ''}`}
                aria-pressed={selectedColor === 'black'}
                onClick={() => { sound.playSwitch(); onColorChange('black'); }}
              >
                <span className="offer-swatch black-dot" /> Negro Stealth
              </button>
            </div>
          </div>

          <div className="offer-field">
            <h3>Cantidad</h3>
            <div className="offer-pack-list">
              {packs.map(({ quantity: packQuantity, label }) => (
                <button
                  key={packQuantity}
                  className={`offer-pack ${quantity === packQuantity ? 'selected' : ''}`}
                  aria-pressed={quantity === packQuantity}
                  onClick={() => { sound.playClick(); setQuantity(packQuantity); }}
                >
                  <span className="offer-pack-title">
                    {quantity === packQuantity && <Check size={16} aria-hidden="true" />}
                    {label}
                  </span>
                  <span className="offer-pack-price">{formatPrice(PACK_PRICES[packQuantity])}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="offer-total">
            <span>PRECIO DEL PACK</span>
            <strong>{formatPrice(PACK_PRICES[quantity])}</strong>
          </div>
          <button className="offer-checkout" disabled>
            <LockKeyhole size={17} aria-hidden="true" /> Compra en preparación
          </button>
          <p className="offer-disclosure">No se cobran pagos ni se registran pedidos en esta vista previa.</p>
        </div>
      </div>
    </div>
  );
}

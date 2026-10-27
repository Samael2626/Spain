import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ArrowRight, ArrowLeft, ShieldCheck, Truck, X, Plus, Minus } from 'lucide-react';
import { sound } from '../../audio/soundFx';
import { MAX_QUANTITY, priceFor, formatPrice } from '../../data/pricing';

const packs = [
  { quantity: 1, label: 'Una unidad' },
  { quantity: 2, label: 'Pack de dos' },
  { quantity: 3, label: 'Pack de tres' },
];

const packLabel = (q) => packs.find((p) => p.quantity === q)?.label ?? `${q} unidades`;

function QuantityStepper({ quantity, onChange }) {
  return (
    <div className="offer-stepper" role="group" aria-label="Cantidad">
      <button type="button" aria-label="Reducir cantidad" disabled={quantity <= 1} onClick={() => { sound.playClick(); onChange(quantity - 1); }}>
        <Minus size={15} />
      </button>
      <span aria-live="polite">{quantity}</span>
      <button type="button" aria-label="Aumentar cantidad" disabled={quantity >= MAX_QUANTITY} onClick={() => { sound.playClick(); onChange(quantity + 1); }}>
        <Plus size={15} />
      </button>
    </div>
  );
}

export default function BuyBoxModal({
  isOpen = false,
  onClose = () => {},
  selectedColor = 'camo',
  initialQuantity = 1,
  initialStep = 'config',
  onColorChange = () => {},
}) {
  const [step, setStep] = useState(initialStep); // 'config' | 'shipping' | 'confirmed'
  const [quantity, setQuantity] = useState(Math.min(MAX_QUANTITY, Math.max(1, initialQuantity)));
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'cod',
  });
  const [orderRef, setOrderRef] = useState('');
  const modalRef = useRef(null);

  const handleClose = useCallback(() => {
    setStep('config');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.querySelector('button')?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') handleClose();
      if (event.key !== 'Tab') return;
      const focusable = [...modalRef.current.querySelectorAll('button:not([disabled]), input:not([disabled])')];
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
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const finish = selectedColor === 'camo' ? 'Camuflaje gris' : 'Negro Stealth';
  const image = selectedColor === 'camo' ? '/images/studio-camo.webp' : '/images/studio-black.webp';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirmOrder = (e) => {
    e.preventDefault();
    sound.playClick();
    const refCode = 'JIM-' + Math.floor(100000 + Math.random() * 900000);
    setOrderRef(refCode);
    setStep('confirmed');
  };

  return (
    <div className="modal-backdrop" onMouseDown={handleClose}>
      <div
        ref={modalRef}
        className="buy-modal offer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close-btn" aria-label="Cerrar modal" onClick={handleClose}>
          <X size={18} />
        </button>

        <div className="offer-visual">
          <img src={image} alt={`JIMKEG en ${finish}`} />
          <span>JIMKEG / 2,2 L</span>
        </div>

        <div className="offer-content">
          {step === 'config' && (
            <>
              <span className="offer-eyebrow">CONFIGURA TU PEDIDO</span>
              <h2 id="offer-title">Elige tu acabado y pack.</h2>
              <p className="offer-subtitle">Envío Express 24/48h a toda España · Pago Contra Reembolso disponible.</p>

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
                      <span className="offer-pack-price">{formatPrice(priceFor(packQuantity))}</span>
                    </button>
                  ))}
                </div>
                <div className="offer-more-row">
                  <span>¿Más unidades? <small>Se combinan packs de 3</small></span>
                  <QuantityStepper quantity={quantity} onChange={setQuantity} />
                </div>
              </div>

              <div className="offer-total">
                <span>PRECIO FINAL</span>
                <strong>{formatPrice(priceFor(quantity))}</strong>
              </div>

              <button
                className="offer-checkout active"
                onClick={() => { sound.playClick(); setStep('shipping'); }}
              >
                TRAMITAR PEDIDO · {formatPrice(priceFor(quantity))} <ArrowRight size={17} aria-hidden="true" />
              </button>

              <div className="offer-trust-badges">
                <span><Truck size={14} aria-hidden="true" /> Envío 24/48h</span>
                <span><ShieldCheck size={14} aria-hidden="true" /> Pago Seguro / Contra Reembolso</span>
              </div>
            </>
          )}

          {step === 'shipping' && (
            <div className="checkout-step-container">
              <button
                type="button"
                className="back-step-btn"
                onClick={() => { sound.playClick(); setStep('config'); }}
              >
                <ArrowLeft size={15} aria-hidden="true" /> Volver a opciones
              </button>

              <span className="offer-eyebrow">DATOS DE ENTREGA</span>
              <h2 id="offer-title">Dirección de Envío</h2>

              <div className="checkout-summary-pill">
                <span>{packLabel(quantity)} ({finish})</span>
                <QuantityStepper quantity={quantity} onChange={setQuantity} />
                <strong>{formatPrice(priceFor(quantity))}</strong>
              </div>

              <form onSubmit={handleConfirmOrder} className="checkout-form">
                <div className="form-group">
                  <label htmlFor="customer-name">Nombre y Apellidos</label>
                  <input
                    id="customer-name"
                    type="text"
                    name="name"
                    required
                    placeholder="Ej. Carlos García López"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="customer-phone">Teléfono móvil (aviso de reparto)</label>
                  <input
                    id="customer-phone"
                    type="tel"
                    name="phone"
                    required
                    placeholder="Ej. +34 612 345 678"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="customer-address">Dirección completa</label>
                  <input
                    id="customer-address"
                    type="text"
                    name="address"
                    required
                    placeholder="Calle, número, piso o puerta"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="customer-cp">Código Postal</label>
                    <input
                      id="customer-cp"
                      type="text"
                      name="postalCode"
                      required
                      placeholder="28001"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="customer-city">Ciudad / Provincia</label>
                    <input
                      id="customer-city"
                      type="text"
                      name="city"
                      required
                      placeholder="Madrid"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group payment-section">
                  <label>Método de Pago</label>
                  <div className="payment-options">
                    <label className={`payment-option ${formData.paymentMethod === 'cod' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={handleInputChange}
                      />
                      <div>
                        <strong>Pago Contra Reembolso</strong>
                        <small>Pagas en efectivo al repartidor al recibir tu pedido</small>
                      </div>
                    </label>

                    <label className={`payment-option ${formData.paymentMethod === 'card' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={handleInputChange}
                      />
                      <div>
                        <strong>Tarjeta de Débito / Crédito</strong>
                        <small>Pasarela 100% segura con cifrado SSL</small>
                      </div>
                    </label>
                  </div>
                </div>

                <button type="submit" className="offer-checkout active">
                  CONFIRMAR PEDIDO — {formatPrice(priceFor(quantity))}
                </button>

                <p className="offer-disclosure">
                  🔒 Garantía de entrega 24/48h. Sin pagos por adelantado si eliges contra reembolso.
                </p>
              </form>
            </div>
          )}

          {step === 'confirmed' && (
            <div className="order-confirmed-view">
              <div className="confirmed-icon-wrap" aria-hidden="true">
                <Check size={32} />
              </div>
              <span className="offer-eyebrow">¡PEDIDO CONFIRMADO CON ÉXITO!</span>
              <h2 id="offer-title">Gracias por tu compra, {formData.name || 'Atleta'}.</h2>

              <div className="order-ref-badge">
                <span>Nº DE REFERENCIA:</span>
                <strong>{orderRef}</strong>
              </div>

              <div className="order-details-box">
                <div className="order-line">
                  <span>Producto:</span>
                  <strong>{packLabel(quantity)} ({finish})</strong>
                </div>
                <div className="order-line">
                  <span>Importe total:</span>
                  <strong>{formatPrice(priceFor(quantity))}</strong>
                </div>
                <div className="order-line">
                  <span>Envío a:</span>
                  <strong>{formData.address}, {formData.postalCode} {formData.city}</strong>
                </div>
                <div className="order-line">
                  <span>Método de pago:</span>
                  <strong>{formData.paymentMethod === 'cod' ? 'Contra Reembolso (en efectivo)' : 'Tarjeta de Crédito / Débito'}</strong>
                </div>
              </div>

              <p className="order-next-steps">
                Te hemos enviado los datos y nos comunicaremos al <strong>{formData.phone}</strong> con el seguimiento del transportista.
              </p>

              <button
                className="offer-checkout active"
                onClick={() => { sound.playClick(); handleClose(); }}
              >
                VOLVER A LA TIENDA
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

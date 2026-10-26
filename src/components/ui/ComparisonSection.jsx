import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PACK_PRICES, formatPrice } from '../../data/pricing';

const packs = [
  { quantity: 1, name: 'Una botella' },
  { quantity: 2, name: 'Pack de dos' },
  { quantity: 3, name: 'Pack de tres' },
];

export default function ComparisonSection({ onSelectPack = () => {} }) {
  return (
    <section className="comparison-section pack-section" id="packs" aria-labelledby="packs-title">
      <div className="pack-section-heading">
        <span>03 / ELIGE TU PACK</span>
        <h2 id="packs-title">UN PRECIO CLARO. <em>TU ELECCIÓN.</em></h2>
        <p>Escoge la cantidad que necesitas. El acabado se selecciona en el configurador.</p>
      </div>
      <div className="pack-list">
        {packs.map(({ quantity, name }) => (
          <button className="pack-list-row" key={quantity} onClick={() => onSelectPack(quantity)}>
            <span className="pack-list-index">0{quantity}</span>
            <span className="pack-list-name">{name}</span>
            <span className="pack-list-unit">≈ {formatPrice(PACK_PRICES[quantity] / quantity)} / unidad</span>
            <strong>{formatPrice(PACK_PRICES[quantity])}</strong>
            <ArrowUpRight size={22} aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}

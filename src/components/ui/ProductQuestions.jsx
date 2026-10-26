import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { sound } from '../../audio/soundFx';

const questions = [
  {
    question: '¿Qué capacidad tiene JIMKEG?',
    answer: 'La botella tiene una capacidad indicada de 2,2 L.',
  },
  {
    question: '¿Qué acabados puedo elegir?',
    answer: 'Puedes elegir Camuflaje gris o Negro Stealth. La imagen del producto cambia al seleccionar cada acabado.',
  },
  {
    question: '¿Cómo funcionan los packs?',
    answer: 'Puedes configurar 1, 2 o 3 unidades. El precio de cada pack aparece antes de continuar.',
  },
  {
    question: '¿Puedo completar la compra ahora?',
    answer: 'Sí. Puedes tramitar tu pedido directamente desde el botón "Ver Ofertas" con envío express 24/48h a toda España y opción de pago contra reembolso al recibir el paquete.',
  },
];

export default function ProductQuestions() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="product-questions-section" id="preguntas" aria-labelledby="questions-title">
      <div className="questions-intro">
        <span className="questions-index">04 / ANTES DE ELEGIR</span>
        <h2 id="questions-title">CADA DETALLE, <span>CLARO.</span></h2>
        <p>Lo esencial para conocer el producto y elegir tu pack.</p>
      </div>
      <div className="faq-container">
        <div className="faq-list">
          {questions.map(({ question, answer }, index) => {
            const isOpen = openIndex === index;
            return (
              <div className={`faq-item ${isOpen ? 'open' : ''}`} key={question}>
                <h3>
                  <button
                    className="faq-question"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    onClick={() => {
                      sound.playClick();
                      setOpenIndex(isOpen ? null : index);
                    }}
                  >
                    <span>{question}</span>
                    <ChevronDown size={18} className="faq-chevron" aria-hidden="true" />
                  </button>
                </h3>
                {isOpen && <div className="faq-answer" id={`faq-answer-${index}`}><p>{answer}</p></div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

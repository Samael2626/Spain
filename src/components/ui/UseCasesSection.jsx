import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const scenes = [
  {
    index: '01',
    title: 'EN EL GIMNASIO',
    text: 'Bolsillo frontal para llevar el móvil junto a la botella. Correa para transportarla entre sesiones.',
    image: '/images/gym-lifestyle.jpg',
    alt: 'Botella JIMKEG negra colgada en un gimnasio',
  },
  {
    index: '02',
    title: 'EN LA MONTAÑA',
    text: 'Dos acabados y 2,2 L de capacidad en una botella con funda y correa de hombro.',
    image: '/images/hero-mountain.jpg',
    alt: 'Botellas JIMKEG Camuflaje gris y Negro Stealth en la montaña',
  },
];

export default function UseCasesSection() {
  return (
    <section className="usecases-editorial-section" id="entornos" aria-labelledby="scenes-title">
      <header className="scenes-header">
        <span>02 / ESCENARIOS</span>
        <h2 id="scenes-title">GIMNASIO <span>&</span> MONTAÑA</h2>
      </header>
      <div className="scenes-list">
        {scenes.map((scene) => (
          <article className="scene-row" key={scene.index}>
            <div className="scene-image-wrap">
              <img src={scene.image} alt={scene.alt} loading="lazy" decoding="async" />
            </div>
            <div className="scene-content">
              <span className="scene-kicker">JIMKEG EN CONTEXTO</span>
              <h3>{scene.title}</h3>
              <p>{scene.text}</p>
              <a href="#prueba">VER ACABADOS <ArrowUpRight size={18} aria-hidden="true" /></a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

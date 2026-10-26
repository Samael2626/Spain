import React from 'react';
import { Layers, Crosshair } from 'lucide-react';
import { sound } from '../../audio/soundFx';

export default function AnatomySection({
  explodedProgress = 0,
  onToggleExploded = () => {},
  activeHotspot = null,
  onSelectHotspot = () => {},
}) {
  const parts = [
    {
      id: 1,
      title: 'TAPA FLIP-LOCK ANTIFUGAS',
      subtitle: 'Apertura rápida a una mano con bloqueo',
      desc: 'Mecanismo de resorte táctico y boquilla protegida contra polvo y gérmenes. Permite beber en marcha sin derramar una sola gota.',
      tag: 'PP Reciclable Alta Densidad',
    },
    {
      id: 2,
      title: 'JUNTA ESTANCA DE SILICONA',
      subtitle: '100% Hermética y libre de toxinas',
      desc: 'Sello perimetral de silicona grado médico que soporta sacudidas bruscas, transporte en mochila y caídas sin pérdidas de presión.',
      tag: 'BPA & BPS Free',
    },
    {
      id: 3,
      title: 'CUERPO TRITÁN REFORZADO 2.2L',
      subtitle: 'Capacidad de 74 oz con escala motivacional',
      desc: 'Plástico de ingeniería un 40% más grueso que botellas convencionales. No retiene sabores ni olores tras batidos o suplementos.',
      tag: 'Resistencia Térmica hasta 90°C',
    },
    {
      id: 4,
      title: 'FUNDA NEOPRENO AISLANTE 5MM',
      subtitle: 'Aislamiento térmico y anti-condensación',
      desc: 'Evita los molestos charcos en los asientos del coche o el suelo del gym. Amortigua impactos y mantiene el agua fresca durante horas.',
      tag: 'Grosor Extra 5.0 mm',
    },
    {
      id: 5,
      title: 'BOLSILLO SMARTPHONE INTEGRADO',
      subtitle: 'Lleva móvil, llaves y pase del gimnasio',
      desc: 'Bolsillo frontal elástico diseñado para smartphones de gran formato (iPhone Pro Max / Galaxy Ultra) con clip para llaves.',
      tag: 'Compatible hasta 6.7"',
    },
  ];

  return (
    <section className="anatomy-section">
      <div className="section-header">
        <div className="section-pill">
          <Layers size={14} />
          <span>INGENIERÍA MECÁNICA & DESPIECE</span>
        </div>
        <h2 className="section-title">
          CADA COMPONENTE, <br />
          <span className="gradient-text">DISEÑADO PARA RESISTIR.</span>
        </h2>
        <p className="section-subtitle">
          Observa el despiece en tiempo real. Interactúa con los puntos clave para conocer los
          materiales y tolerancias de fabricación.
        </p>

        {/* Explosion Trigger Controller */}
        <div className="explosion-controls">
          <button
            className={`explosion-btn ${explodedProgress > 0.5 ? 'active' : ''}`}
            onClick={() => {
              sound.playSwitch();
              onToggleExploded();
            }}
          >
            <Crosshair size={18} />
            <span>
              {explodedProgress > 0.5
                ? 'REENSAMBLAR BOTELLA'
                : 'EXPLOTAR DESPIECE 3D (VER INTERIOR)'}
            </span>
          </button>
        </div>
      </div>

      {/* Anatomy Cards HUD */}
      <div className="anatomy-cards-container">
        {parts.map((p) => {
          const isSelected = activeHotspot === p.id;
          return (
            <div
              key={p.id}
              className={`anatomy-card ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                sound.playHotspot();
                onSelectHotspot(p.id);
              }}
            >
              <div className="card-top">
                <span className="card-index">0{p.id}</span>
                <span className="card-tag">{p.tag}</span>
              </div>
              <h3 className="card-title">{p.title}</h3>
              <p className="card-subtitle">{p.subtitle}</p>
              <p className="card-desc">{p.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

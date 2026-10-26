import React from 'react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-logo">JIMKEG™</span>
            <p className="footer-tagline">Botella de 2,2 L con funda, correa y bolsillo frontal. Camuflaje gris o Negro Stealth.</p>
          </div>
          <nav className="footer-links-col" aria-label="Explorar la página">
            <h2 className="footer-heading">EXPLORA</h2>
            <ul>
              <li><a href="#hero">Inicio</a></li>
              <li><a href="#prueba">Producto</a></li>
              <li><a href="#estudio">Estudio 3D</a></li>
              <li><a href="#packs">Packs y precios</a></li>
            </ul>
          </nav>
          <div className="footer-links-col">
            <h2 className="footer-heading">INFORMACIÓN</h2>
            <ul>
              <li><a href="#preguntas">Preguntas frecuentes</a></li>
              <li><span>Compra en preparación</span></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 JIMKEG™.</p>
          <p>Consulta los packs y acabados disponibles.</p>
        </div>
      </div>
    </footer>
  );
}

import React, { lazy, Suspense, useState, useEffect } from 'react';
import Lenis from 'lenis';
import Navigation from './components/ui/Navigation';
import HeroSection from './components/ui/HeroSection';
import EditorialGallery from './components/ui/EditorialGallery';
import PruebaSection from './components/ui/PruebaSection';
import UseCasesSection from './components/ui/UseCasesSection';
import ComparisonSection from './components/ui/ComparisonSection';
import ProductQuestions from './components/ui/ProductQuestions';
import StickyBar from './components/ui/StickyBar';
import Footer from './components/ui/Footer';
import { Rotate3d, ArrowRight } from 'lucide-react';
import { sound } from './audio/soundFx';

// Piezas del despiece (clave del visor, numero, nombre)
const STUDIO_PARTS = [
  ['cap', '01', 'Tapa táctica'],
  ['cord', '02', 'Paracord'],
  ['body', '03', 'Cuerpo 2,2 L'],
  ['sleeve', '04', 'Funda neopreno'],
  ['phone', '05', 'Bolsillo móvil'],
  ['strap', '06', 'Correa'],
];

const loadViewer = () => import('./components/studio/JimkegViewer');
const JimkegViewer = lazy(loadViewer);
// Precarga el chunk del visor al pasar el cursor o enfocar los CTA
const preloadViewer = () => { void loadViewer(); };
const BuyBoxModal = lazy(() => import('./components/ui/BuyBoxModal'));
const PromoPreviewPopup = lazy(() => import('./components/ui/PromoPreviewPopup'));

export default function App() {
  const [activeAct, setActiveAct] = useState('giro');
  const [activeColor, setActiveColor] = useState('black');
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerPart, setViewerPart] = useState(null);
  const openViewer = (part = null) => {
    setViewerPart(part);
    setIsViewerOpen(true);
  };
  // Paso inicial de la caja de compra: desde el visor 3D se entra directo a los datos de compra
  const [offerStep, setOfferStep] = useState('config');
  const openOffers = (step = 'config') => {
    setOfferStep(step);
    setIsOfferOpen(true);
  };
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [studioReady, setStudioReady] = useState(false);
  const [promoReady, setPromoReady] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const isPromoOpen = promoReady && !isOfferOpen && !isViewerOpen && !promoDismissed;

  useEffect(() => {
    if (sessionStorage.getItem('jimkeg-promo-preview-shown')) return;
    let due = false;
    const showWhenVisible = () => {
      if (due && !document.hidden) setPromoReady(true);
    };
    const timer = window.setTimeout(() => {
      due = true;
      showWhenVisible();
    }, 105000);
    document.addEventListener('visibilitychange', showWhenVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', showWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (isPromoOpen) sessionStorage.setItem('jimkeg-promo-preview-shown', '1');
  }, [isPromoOpen]);

  useEffect(() => {
    const target = document.getElementById('estudio');
    if (!target || !('IntersectionObserver' in window)) {
      queueMicrotask(() => setStudioReady(true));
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStudioReady(true);
        observer.disconnect();
      }
    }, { rootMargin: '80px 0px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      // Lenis maneja su propio requestAnimationFrame: sin GSAP en el bundle inicial
      autoRaf: true,
    });

    return () => lenis.destroy();
  }, []);

  const handleSelectPack = (quantity, color) => {
    setActiveColor(color);
    setSelectedQuantity(quantity);
    openOffers();
  };

  return (
    <div className="app-viewport" id="inicio">
      <Navigation
        onOpenOffers={() => openOffers()}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          setSoundEnabled(!soundEnabled);
          sound.enabled = !soundEnabled;
        }}
      />

      <main className="main-content-flow">
        <HeroSection
          onExploreClick={() => {
            const studioEl = document.getElementById('estudio');
            if (studioEl) studioEl.scrollIntoView({ behavior: 'smooth' });
          }}
          onBuyClick={() => openOffers()}
        />

        <EditorialGallery onSelectColor={setActiveColor} />

        <section className="central-studio-wrapper" id="estudio">
          <div className="studio-film-layout">
          <button
            type="button"
            className="studio-film"
            aria-label="Explorar la JIMKEG en 3D"
            onPointerEnter={preloadViewer}
            onFocus={preloadViewer}
            onClick={() => openViewer()}
          >
            {studioReady ? (
              <video
                className="studio-film-video"
                poster="/videos/jimkeg_desarme_poster.webp"
                autoPlay
                muted
                loop
                playsInline
                aria-label="Animación del despiece de la JIMKEG"
              >
                <source src="/videos/jimkeg_desarme.webm" type="video/webm" />
                <source src="/videos/jimkeg_desarme.mp4" type="video/mp4" />
              </video>
            ) : (
              <img className="studio-film-video" src="/videos/jimkeg_desarme_poster.webp" alt="JIMKEG en el estudio" loading="lazy" />
            )}
            <span className="studio-film-hover" aria-hidden="true"><Rotate3d size={26} /></span>
          </button>

          <div className="studio-film-copy">
            <span className="studio-sub-kicker">INGENIERÍA & EXPLORACIÓN 3D</span>
            <h2 className="studio-main-heading">
              <span className="studio-heading-line">CONOCE CADA DETALLE</span>
              <span className="studio-heading-line text-amber">DE TU JIMKEG™.</span>
            </h2>
            <p className="studio-sub-desc">
              Ábrela en 3D, desármala y toca cada pieza para ver para qué sirve.
            </p>
            <p className="studio-film-specs">2,2 L · Tritán sin BPA · Neopreno 5 mm</p>

            <span className="studio-parts-label">Elige una pieza y mírala en 3D</span>
            <div className="studio-parts">
              {STUDIO_PARTS.map(([key, num, name]) => (
                <button
                  key={key}
                  type="button"
                  className="studio-part"
                  onPointerEnter={preloadViewer}
                  onFocus={preloadViewer}
                  onClick={() => openViewer(key)}
                >
                  <span className="studio-part-num">{num}</span>
                  <span className="studio-part-name">{name}</span>
                </button>
              ))}
            </div>

            <div className="studio-film-ctas">
              <button
                type="button"
                className="studio-film-btn"
                onPointerEnter={preloadViewer}
                onFocus={preloadViewer}
                onClick={() => openViewer()}
              >
                <Rotate3d size={20} aria-hidden="true" />
                <span>Explorar en 3D</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button type="button" className="studio-film-buy" onClick={() => openOffers()}>
                Comprar ahora
              </button>
            </div>
          </div>
          </div>
        </section>

        <PruebaSection
          selectedColor={activeColor}
          onColorChange={setActiveColor}
          onOpenPack={handleSelectPack}
        />

        <UseCasesSection />

        <ComparisonSection onSelectPack={(quantity) => {
          setSelectedQuantity(quantity);
          openOffers();
        }} />

        <ProductQuestions />

        <Footer />
      </main>

      <StickyBar
        selectedColor={activeColor}
        onOpenOffers={() => openOffers()}
      />

      {isViewerOpen && <Suspense fallback={<div className="viewer-modal"><div className="viewer-loading" role="status">Cargando visor 3D…</div></div>}>
        <JimkegViewer
          initialPart={viewerPart}
          activeColor={activeColor}
          onColorChange={setActiveColor}
          onClose={() => setIsViewerOpen(false)}
          onBuy={() => {
            setIsViewerOpen(false);
            openOffers('shipping');
          }}
        />
      </Suspense>}
      {isOfferOpen && <Suspense fallback={null}>
        <BuyBoxModal
          isOpen={isOfferOpen}
          onClose={() => setIsOfferOpen(false)}
          selectedColor={activeColor}
          initialQuantity={selectedQuantity}
          initialStep={offerStep}
          onColorChange={setActiveColor}
        />
      </Suspense>}
      {isPromoOpen && <Suspense fallback={null}>
        <PromoPreviewPopup
          onClose={() => setPromoDismissed(true)}
          onBrowseOffers={() => {
            setPromoDismissed(true);
            openOffers();
          }}
        />
      </Suspense>}
    </div>
  );
}

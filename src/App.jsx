import React, { lazy, Suspense, useState, useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import Navigation from './components/ui/Navigation';
import HeroSection from './components/ui/HeroSection';
import EditorialGallery from './components/ui/EditorialGallery';
import PruebaSection from './components/ui/PruebaSection';
import UseCasesSection from './components/ui/UseCasesSection';
import ComparisonSection from './components/ui/ComparisonSection';
import ProductQuestions from './components/ui/ProductQuestions';
import StickyBar from './components/ui/StickyBar';
import Footer from './components/ui/Footer';
import { sound } from './audio/soundFx';

const ElementraStudio = lazy(() => import('./components/studio/ElementraStudio'));
const BuyBoxModal = lazy(() => import('./components/ui/BuyBoxModal'));
const PromoPreviewPopup = lazy(() => import('./components/ui/PromoPreviewPopup'));

export default function App() {
  const [activeAct, setActiveAct] = useState('giro');
  const [activeColor, setActiveColor] = useState('camo');
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [studioReady, setStudioReady] = useState(false);
  const [promoReady, setPromoReady] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const isPromoOpen = promoReady && !isOfferOpen && !promoDismissed;

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
    }, { rootMargin: '400px 0px' });
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
    });

    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  const handleSelectPack = (quantity, color) => {
    setActiveColor(color);
    setSelectedQuantity(quantity);
    setIsOfferOpen(true);
  };

  return (
    <div className="app-viewport" id="inicio">
      <Navigation
        onOpenOffers={() => setIsOfferOpen(true)}
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
          onBuyClick={() => setIsOfferOpen(true)}
        />

        <EditorialGallery onSelectColor={setActiveColor} />

        <section className="central-studio-wrapper" id="estudio">
          <div className="studio-intro-header">
            <span className="studio-sub-kicker">INGENIERÍA & EXPLORACIÓN 3D</span>
            <h2 className="studio-main-heading">
              CONOCE CADA DETALLE <br />
              <span className="text-amber">DE TU JIMKEG™.</span>
            </h2>
            <p className="studio-sub-desc">
              Gira el modelo, cambia de acabado y explora las vistas disponibles del estudio.
            </p>
          </div>

          {studioReady ? (
            <Suspense fallback={<div className="studio-loading" role="status">Cargando estudio 3D…</div>}>
              <ElementraStudio
                activeAct={activeAct}
                activeColor={activeColor}
                onActChange={setActiveAct}
                onColorChange={setActiveColor}
              />
            </Suspense>
          ) : <div className="studio-loading" role="status">El estudio 3D se cargará al acercarte</div>}
        </section>

        <PruebaSection
          selectedColor={activeColor}
          onColorChange={setActiveColor}
          onOpenPack={handleSelectPack}
        />

        <UseCasesSection />

        <ComparisonSection onSelectPack={(quantity) => {
          setSelectedQuantity(quantity);
          setIsOfferOpen(true);
        }} />

        <ProductQuestions />

        <Footer />
      </main>

      <StickyBar
        selectedColor={activeColor}
        onOpenOffers={() => setIsOfferOpen(true)}
      />

      {isOfferOpen && <Suspense fallback={null}>
        <BuyBoxModal
          isOpen={isOfferOpen}
          onClose={() => setIsOfferOpen(false)}
          selectedColor={activeColor}
          initialQuantity={selectedQuantity}
          onColorChange={setActiveColor}
        />
      </Suspense>}
      {isPromoOpen && <Suspense fallback={null}>
        <PromoPreviewPopup
          onClose={() => setPromoDismissed(true)}
          onBrowseOffers={() => {
            setPromoDismissed(true);
            setIsOfferOpen(true);
          }}
        />
      </Suspense>}
    </div>
  );
}

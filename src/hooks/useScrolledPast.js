import { useEffect, useState } from 'react';

// Altura de scroll a partir de la cual aparece la barra de compra inferior
export const STICKY_THRESHOLD = 400;

export default function useScrolledPast(threshold = STICKY_THRESHOLD) {
  const [past, setPast] = useState(() => typeof window !== 'undefined' && window.scrollY > threshold);
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return past;
}

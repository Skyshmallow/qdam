import { useEffect } from 'react';

/**
 * Hook для динамического обновления CSS переменной --vh
 * Использует VisualViewport API для точного определения видимой области
 * Особенно важно для iOS Safari с динамическим toolbar
 */
export function useViewportHeight() {
  useEffect(() => {
    const setVH = () => {
      const vh = window.visualViewport 
        ? window.visualViewport.height 
        : window.innerHeight;
      
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
    };

    setVH();

    // Слушаем изменения Visual Viewport (iOS Safari toolbar show/hide)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setVH);
      window.visualViewport.addEventListener('scroll', setVH);
    }
    
    // Fallback для старых браузеров
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    // Cleanup
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setVH);
        window.visualViewport.removeEventListener('scroll', setVH);
      }
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);
}
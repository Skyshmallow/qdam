// src/hooks/useViewportHeight.ts

import { useEffect } from 'react';

export function useViewportHeight() {
  useEffect(() => {
    let timeoutId: number;

    const setVH = () => {
      // Clear any pending updates
      clearTimeout(timeoutId);

      // Delay to get accurate height after iOS Safari toolbar animation
      timeoutId = setTimeout(() => {
        // Use window.innerHeight instead of visualViewport for better accuracy
        const vh = window.innerHeight;
        document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
        
        // Additional delay for iPhone Plus with tab bar
        setTimeout(() => {
          const vhFinal = window.innerHeight;
          document.documentElement.style.setProperty('--vh', `${vhFinal * 0.01}px`);
        }, 400);
      }, 50);
    };

    setVH();

    // Listeners
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setVH);
      window.visualViewport.addEventListener('scroll', setVH);
    }
    
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Force update on scroll for iOS Safari
    let lastHeight = window.innerHeight;
    const scrollHandler = () => {
      if (window.innerHeight !== lastHeight) {
        lastHeight = window.innerHeight;
        setVH();
      }
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setVH);
        window.visualViewport.removeEventListener('scroll', setVH);
      }
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
      window.removeEventListener('scroll', scrollHandler);
    };
  }, []);
}

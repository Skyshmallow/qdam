import { useEffect } from 'react';

export function useSafariToolbar() {
  useEffect(() => {
    const updateToolbarHeight = () => {
      // Detect if Safari toolbar is visible
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      if (isIOS && isSafari) {
        // Calculate actual available height
        const viewportHeight = window.innerHeight;
        const windowHeight = window.outerHeight;
        
        // Toolbar visible if viewport is significantly smaller than window
        const toolbarVisible = (windowHeight - viewportHeight) > 70;
        
        // Set CSS variable
        document.documentElement.style.setProperty(
          '--safari-toolbar-offset',
          toolbarVisible ? '80px' : '0px'
        );
      }
    };

    updateToolbarHeight();
    
    window.addEventListener('resize', updateToolbarHeight);
    window.addEventListener('scroll', updateToolbarHeight);
    
    return () => {
      window.removeEventListener('resize', updateToolbarHeight);
      window.removeEventListener('scroll', updateToolbarHeight);
    };
  }, []);
}
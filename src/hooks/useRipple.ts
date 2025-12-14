import { useCallback } from 'react';

/**
 * Hook для создания ripple эффекта при клике на кнопку
 */
export const useRipple = () => {
  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Создаем элемент ripple
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    
    // Вычисляем позицию клика относительно кнопки
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Вычисляем размер ripple (должен покрыть всю кнопку)
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;
    
    // Устанавливаем стили
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${x - radius}px`;
    ripple.style.top = `${y - radius}px`;
    
    // Удаляем старые ripple эффекты
    const existingRipples = button.querySelectorAll('.ripple-effect');
    existingRipples.forEach((r) => r.remove());
    
    // Добавляем новый ripple
    button.appendChild(ripple);
    
    // Удаляем ripple после анимации
    setTimeout(() => {
      ripple.remove();
    }, 600); // Совпадает с CSS animation duration
  }, []);

  return { createRipple };
};

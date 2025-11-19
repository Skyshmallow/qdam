/**
 * Debounce Utility
 * 
 * Задерживает выполнение функции до тех пор, пока не пройдет определенное время
 * с момента последнего вызова. Полезно для оптимизации частых событий (input, scroll, etc.)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Debounce с возможностью отмены
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounceCancelable<T extends (...args: any[]) => any>(
  func: T,
  wait: number
) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debouncedFn = function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };

  // Метод для отмены pending вызова
  debouncedFn.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  // Метод для немедленного вызова
  debouncedFn.flush = (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    func(...args);
  };

  return debouncedFn;
}

/**
 * Throttle Utility
 * 
 * Ограничивает частоту вызова функции. В отличие от debounce, throttle
 * гарантирует вызов функции не чаще чем раз в N миллисекунд.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }

    return lastResult;
  };
}

/**
 * Пример использования:
 * 
 * // Debounce (для поиска, input'ов)
 * const searchDebounced = debounce((query: string) => {
 *   fetchSearchResults(query);
 * }, 300);
 * 
 * // Throttle (для scroll, resize)
 * const onScrollThrottled = throttle(() => {
 *   updateScrollPosition();
 * }, 100);
 */

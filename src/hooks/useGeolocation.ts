// src/hooks/useGeolocation.ts
import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

/**
 * Определяет возможные состояния процесса геолокации.
 * - idle: Ничего не происходит.
 * - prompting: Ожидание ответа пользователя на запрос разрешений.
 * - locating: Активный поиск координат после получения разрешения.
 * - success: Координаты успешно получены.
 * - denied: Пользователь явно запретил доступ.
 * - error: Произошла техническая ошибка.
 */
export type GeolocationState = 'idle' | 'prompting' | 'locating' | 'success' | 'denied' | 'error';

// Описываем, что будет возвращать наш хук
interface GeolocationResult {
  geolocationState: GeolocationState;
  locateUser: () => Promise<[number, number] | null>;
  resetGeolocationState: () => void;
}

export const useGeolocation = (): GeolocationResult => {
  const [geolocationState, setGeolocationState] = useState<GeolocationState>('idle');

  const locateUser = useCallback((): Promise<[number, number] | null> => {
    // Проверяем, доступен ли Geolocation API в браузере
    if (!navigator.geolocation) {
      toast.error('Геолокация не поддерживается вашим браузером.');
      setGeolocationState('error');
      console.error('[useGeolocation] > navigator.geolocation is NOT available.');
      return Promise.resolve(null);
    }

    // Возвращаем Promise, чтобы App.tsx мог дождаться результата
    return new Promise((resolve) => {
      setGeolocationState('prompting'); // Ждем ответа пользователя
      console.log('%c[useGeolocation]', 'color: #00BCD4; font-weight: bold;', 'locateUser called. State -> prompting. Calling getCurrentPosition...');
      // Запрашиваем ОДНОКРАТНОЕ получение позиции
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          toast.success('Местоположение найдено!');
          setGeolocationState('success');
          console.log('%c[useGeolocation]', 'color: #00BCD4; font-weight: bold;', 'SUCCESS! Position received:', position.coords);
          resolve(coords); // Успешно, возвращаем координаты
        },
        (error) => {
            console.error('%c[useGeolocation]', 'color: #00BCD4; font-weight: bold;', 'ERROR received from getCurrentPosition:', error);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              toast.warn('Вы запретили доступ к геолокации.');
              setGeolocationState('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              toast.error('Информация о местоположении недоступна.');
              setGeolocationState('error');
              break;
            case error.TIMEOUT:
              toast.error('Время запроса местоположения истекло.');
              setGeolocationState('error');
              break;
            default:
              toast.error('Произошла неизвестная ошибка геолокации.');
              setGeolocationState('error');
              break;
          }
          resolve(null); // Неудача, возвращаем null
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 секунд на поиск
          maximumAge: 0, // Не использовать кэшированные данные
        }
      );
      // После вызова getCurrentPosition браузер показывает окно запроса.
      // Если пользователь долго не отвечает, сработает timeout.
      // Как только он нажмет, выполнится один из колбэков.
      // Мы можем дополнительно переключить состояние в 'locating', 
      // но 'prompting' уже хорошо описывает ожидание.
    });
  }, []);
  
  const resetGeolocationState = useCallback(() => {
    setGeolocationState('idle');
  }, []);

  return { geolocationState, locateUser, resetGeolocationState };
};
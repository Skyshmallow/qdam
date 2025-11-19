/**
 * Abortable Request Utility
 * 
 * Обертка для fetch запросов с автоматической отменой предыдущих запросов.
 * Решает race condition когда быстрые запросы могут прийти в неправильном порядке.
 */

export class AbortableRequest<T> {
  private abortController: AbortController | null = null;
  private requestCount = 0;

  /**
   * Выполнить запрос с автоматической отменой предыдущего
   */
  async execute(
    fetcher: (signal: AbortSignal) => Promise<T>
  ): Promise<T | null> {
    // Отменить предыдущий запрос если он еще выполняется
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    this.requestCount++;

    try {
      const result = await fetcher(this.abortController.signal);
      return result;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Запрос был отменен - это нормально
        return null;
      }
      // Другая ошибка - пробрасываем
      throw error;
    }
  }

  /**
   * Отменить текущий запрос
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Проверить, выполняется ли запрос
   */
  isPending(): boolean {
    return this.abortController !== null;
  }

  /**
   * Получить количество выполненных запросов
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * Сбросить счетчик
   */
  reset(): void {
    this.abort();
    this.requestCount = 0;
  }
}

/**
 * Пример использования:
 * 
 * const mapboxRequest = new AbortableRequest<RouteData>();
 * 
 * // При каждом клике - отменяет предыдущий запрос
 * const route = await mapboxRequest.execute(async (signal) => {
 *   const response = await fetch(url, { signal });
 *   return response.json();
 * });
 */

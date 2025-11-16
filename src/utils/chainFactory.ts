import { nanoid } from 'nanoid';
import type { Node, Chain } from '../types';

/**
 * Результат создания цепочки
 */
interface ChainCreationResult {
  nodeA: Node;
  nodeB: Node;
  chain: Chain;
}

/**
 * Создать цепочку из пути
 * 
 * Эта функция используется КАК реальным походом, ТАК и симуляцией.
 * Единственное отличие - флаг isTemporary.
 * 
 * @param startCoords - Координаты начальной точки
 * @param endCoords - Координаты конечной точки
 * @param path - Массив координат пути (должен содержать ровно 2 точки для реальных цепей)
 * @param isTemporary - true = симуляция (не сохранять), false = реальный поход
 * @returns Объект с nodeA, nodeB и chain
 */
export function createChainFromPath(
  startCoords: [number, number],
  endCoords: [number, number],
  path: number[][],
  isTemporary: boolean = false
): ChainCreationResult {
  const now = Date.now();

  // Для реальных цепей проверяем, что path содержит ровно 2 точки
  if (!isTemporary && path.length !== 2) {
    console.warn(`[ChainFactory] Path should have exactly 2 points, got ${path.length}. Reducing...`);
    path = [path[0], path[path.length - 1]];
  }

  // Создаем узел A (начало)
  const nodeA: Node = {
    id: nanoid(),
    coordinates: startCoords,
    createdAt: now,
    status: 'established',
    isTemporary,
  };

  // Создаем узел B (конец)
  const nodeB: Node = {
    id: nanoid(),
    coordinates: endCoords,
    createdAt: now,
    status: 'established',
    isTemporary,
  };

  // Создаем цепочку
  const chain: Chain = {
    id: nanoid(),
    nodeA_id: nodeA.id,
    nodeB_id: nodeB.id,
    path,
    createdAt: now,
    isTemporary,
  };

  console.log(`[ChainFactory] Created ${isTemporary ? 'TEMPORARY' : 'PERMANENT'} chain`, {
    chainId: chain.id,
    pathLength: path.length,
  });

  return { nodeA, nodeB, chain };
}

/**
 * Преобразовать pending node в established после завершения похода
 */
export function finalizeNode(
  pendingNode: Node,
  isTemporary: boolean = false
): Node {
  return {
    ...pendingNode,
    status: 'established',
    isTemporary,
  };
}
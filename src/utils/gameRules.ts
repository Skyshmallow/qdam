import * as turf from '@turf/turf';
import type { Node, Chain } from '../types';

/**
 * Радиус сферы влияния в километрах
 */
const SPHERE_RADIUS_KM = parseFloat(import.meta.env.VITE_SPHERE_RADIUS_KM || '0.5');

/**
 * Максимальное количество цепочек в день
 */
const MAX_CHAINS_PER_DAY = 2;

/**
 * Минимальная длина пути (количество точек)
 */
const MIN_PATH_LENGTH = 2;

/**
 * Результат проверки возможности создания цепочки
 */
interface ChainValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Проверить, может ли игрок создать новую цепочку сегодня
 */
export function canCreateChainToday(
  chainsCreatedToday: number,
  isSimulationMode: boolean
): boolean {
  if (isSimulationMode) {
    console.log('[SIMULATION] Skipping daily limit check');
    return true;
  }
  
  const allowed = chainsCreatedToday < MAX_CHAINS_PER_DAY;
  
  if (!allowed) {
    console.log(`[GameRules] Daily limit reached: ${chainsCreatedToday}/${MAX_CHAINS_PER_DAY}`);
  }
  
  return allowed;
}

/**
 * Проверить, находится ли точка внутри сферы влияния
 */
export function isInsideSphereOfInfluence(
  coordinates: [number, number],
  nodes: Node[],
  radiusKm: number = SPHERE_RADIUS_KM
): boolean {
  if (nodes.length === 0) return false;

  const clickPoint = turf.point(coordinates);

  return nodes.some(node => {
    const nodePoint = turf.point(node.coordinates);
    const distance = turf.distance(clickPoint, nodePoint, { units: 'kilometers' });
    return distance <= radiusKm;
  });
}

/**
 * Проверить, может ли игрок начать новую цепочку в указанной точке
 * 
 * Правила:
 * 1. Первую цепочку можно создать где угодно
 * 2. Последующие цепочки должны начинаться внутри сферы влияния
 * 3. В режиме симуляции проверяются только временные узлы
 */
export function canStartChain(
  coordinates: [number, number],
  nodes: Node[],
  chains: Chain[],
  isSimulationMode: boolean
): ChainValidationResult {
  // Первая цепочка - всегда можно
  if (chains.length === 0) {
    console.log('[GameRules] First chain - allowed anywhere');
    return { allowed: true };
  }

  // Определяем, какие узлы проверять
  const nodesToCheck = isSimulationMode
    ? nodes.filter(n => n.isTemporary) // В тесте: только временные
    : nodes.filter(n => !n.isTemporary); // В реале: только постоянные

  console.log(`[GameRules] Checking sphere rules (${isSimulationMode ? 'temporary' : 'permanent'} nodes: ${nodesToCheck.length})`);

  // Если нет узлов для проверки (например, первая симуляция)
  if (nodesToCheck.length === 0) {
    console.log('[GameRules] No nodes to check - allowed');
    return { allowed: true };
  }

  // Проверяем сферу влияния
  const isInside = isInsideSphereOfInfluence(coordinates, nodesToCheck, SPHERE_RADIUS_KM);

  if (!isInside) {
    console.log('[GameRules] Outside sphere of influence - blocked');
    return {
      allowed: false,
      reason: 'Для начала трекинга нужно находиться внутри Сферы Влияния!',
    };
  }

  console.log('[GameRules] Inside sphere of influence - allowed');
  return { allowed: true };
}

/**
 * Проверить, валиден ли путь для создания цепочки
 */
export function isValidPath(path: number[][]): ChainValidationResult {
  if (path.length < MIN_PATH_LENGTH) {
    return {
      allowed: false,
      reason: `Путь слишком короткий (минимум ${MIN_PATH_LENGTH} точки)`,
    };
  }

  return { allowed: true };
}

/**
 * Экспорт констант для использования в других модулях
 */
export const GAME_CONSTANTS = {
  SPHERE_RADIUS_KM,
  MAX_CHAINS_PER_DAY,
  MIN_PATH_LENGTH,
} as const;
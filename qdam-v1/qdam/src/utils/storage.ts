import type { Node, Chain } from '../types';

const NODES_KEY = 'qdam_nodes';
const CHAINS_KEY = 'qdam_chains';

/**
 * Сохранить узлы в localStorage
 * В режиме симуляции ничего не сохраняет
 */
export function saveNodes(nodes: Node[], isSimulationMode: boolean): void {
  if (isSimulationMode) {
    console.log('[SIMULATION] Skipping localStorage save for nodes');
    return;
  }

  try {
    // Фильтруем: сохраняем только постоянные узлы
    const permanentNodes = nodes.filter(n => !n.isTemporary);
    
    if (permanentNodes.length > 0) {
      localStorage.setItem(NODES_KEY, JSON.stringify(permanentNodes));
      console.log(`[Storage] Saved ${permanentNodes.length} permanent nodes`);
    } else {
      localStorage.removeItem(NODES_KEY);
      console.log('[Storage] No permanent nodes to save, removed from localStorage');
    }
  } catch (error) {
    console.error('[Storage] Failed to save nodes:', error);
  }
}

/**
 * Загрузить узлы из localStorage
 */
export function loadNodes(): Node[] {
  try {
    const saved = localStorage.getItem(NODES_KEY);
    if (!saved) return [];
    
    const nodes: Node[] = JSON.parse(saved);
    console.log(`[Storage] Loaded ${nodes.length} nodes from localStorage`);
    return nodes;
  } catch (error) {
    console.error('[Storage] Failed to load nodes:', error);
    return [];
  }
}

/**
 * Сохранить цепочки в localStorage
 * В режиме симуляции ничего не сохраняет
 */
export function saveChains(chains: Chain[], isSimulationMode: boolean): void {
  if (isSimulationMode) {
    console.log('[SIMULATION] Skipping localStorage save for chains');
    return;
  }

  try {
    // Фильтруем: сохраняем только постоянные цепочки
    const permanentChains = chains.filter(c => !c.isTemporary);
    
    if (permanentChains.length > 0) {
      const serialized = JSON.stringify(permanentChains);
      localStorage.setItem(CHAINS_KEY, serialized);
      console.log(`[Storage] Saved ${permanentChains.length} permanent chains`);
      console.log('[Storage] Sample chain:', permanentChains[0]);
    } else {
      localStorage.removeItem(CHAINS_KEY);
      console.log('[Storage] No permanent chains to save, removed from localStorage');
    }
  } catch (error) {
    console.error('[Storage] Failed to save chains:', error);
  }
}

/**
 * Загрузить цепочки из localStorage
 */
export function loadChains(): Chain[] {
  try {
    const saved = localStorage.getItem(CHAINS_KEY);
    if (!saved) return [];
    
    const chains: Chain[] = JSON.parse(saved);
    console.log(`[Storage] Loaded ${chains.length} chains from localStorage`);
    return chains;
  } catch (error) {
    console.error('[Storage] Failed to load chains:', error);
    return [];
  }
}

/**
 * Очистить все данные из localStorage (для отладки)
 */
export function clearAllStorage(): void {
  localStorage.removeItem(NODES_KEY);
  localStorage.removeItem(CHAINS_KEY);
  console.log('[Storage] Cleared all game data from localStorage');
}
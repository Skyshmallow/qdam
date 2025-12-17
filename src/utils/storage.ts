import type { Node, Chain } from '../types';
import * as IDB from '@shared/storage/indexedDB';

/**
 * Сохранить узлы в IndexedDB
 * В режиме симуляции ничего не сохраняет
 */
export async function saveNodes(nodes: Node[], isSimulationMode: boolean): Promise<void> {
  if (isSimulationMode) {
    console.log('[SIMULATION] Skipping storage save for nodes');
    return;
  }

  try {
    // Фильтруем: сохраняем только постоянные узлы
    const permanentNodes = nodes.filter(n => !n.isTemporary);
    
    if (permanentNodes.length > 0) {
      await IDB.saveNodes(permanentNodes);
      console.log(`[Storage] Saved ${permanentNodes.length} permanent nodes to IndexedDB`);
    } else {
      await IDB.saveNodes([]);
      console.log('[Storage] No permanent nodes to save');
    }
  } catch (error) {
    console.error('[Storage] Failed to save nodes:', error);
  }
}

/**
 * Загрузить узлы из IndexedDB
 */
export async function loadNodes(): Promise<Node[]> {
  try {
    const nodes = await IDB.loadNodes();
    console.log(`[Storage] Loaded ${nodes.length} nodes from IndexedDB`);
    return nodes;
  } catch (error) {
    console.error('[Storage] Failed to load nodes:', error);
    return [];
  }
}

/**
 * Сохранить цепочки в IndexedDB
 * В режиме симуляции ничего не сохраняет
 */
export async function saveChains(chains: Chain[], isSimulationMode: boolean): Promise<void> {
  if (isSimulationMode) {
    console.log('[SIMULATION] Skipping storage save for chains');
    return;
  }

  try {
    // Фильтруем: сохраняем только постоянные цепочки
    const permanentChains = chains.filter(c => !c.isTemporary);
    
    if (permanentChains.length > 0) {
      await IDB.saveChains(permanentChains);
      console.log(`[Storage] Saved ${permanentChains.length} permanent chains to IndexedDB`);
      console.log('[Storage] Sample chain:', permanentChains[0]);
    } else {
      await IDB.saveChains([]);
      console.log('[Storage] No permanent chains to save');
    }
  } catch (error) {
    console.error('[Storage] Failed to save chains:', error);
  }
}

/**
 * Загрузить цепочки из IndexedDB
 */
export async function loadChains(): Promise<Chain[]> {
  try {
    const chains = await IDB.loadChains();
    console.log(`[Storage] Loaded ${chains.length} chains from IndexedDB`);
    return chains;
  } catch (error) {
    console.error('[Storage] Failed to load chains:', error);
    return [];
  }
}

/**
 * Очистить все данные из IndexedDB (для отладки)
 */
export async function clearAllStorage(): Promise<void> {
  await IDB.clearDatabase();
  console.log('[Storage] Cleared all game data from IndexedDB');
}
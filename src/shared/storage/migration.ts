/**
 * Migration from localStorage to IndexedDB
 * 
 * Переносит данные из localStorage в IndexedDB при первом запуске.
 * После успешной миграции удаляет данные из localStorage.
 */

import { saveNodes, saveChains, getStorageStats } from './indexedDB';
import type { Node, Chain } from '../../types';

const MIGRATION_KEY = 'qdam-migrated-to-indexeddb';
const NODES_KEY = 'qdam-nodes';
const CHAINS_KEY = 'qdam-chains';

/**
 * Проверить, была ли выполнена миграция
 */
function isMigrated(): boolean {
  return localStorage.getItem(MIGRATION_KEY) === 'true';
}

/**
 * Отметить миграцию как выполненную
 */
function markAsMigrated(): void {
  localStorage.setItem(MIGRATION_KEY, 'true');
}

/**
 * Загрузить данные из localStorage
 */
function loadFromLocalStorage(): { nodes: Node[]; chains: Chain[] } {
  try {
    const nodesJson = localStorage.getItem(NODES_KEY);
    const chainsJson = localStorage.getItem(CHAINS_KEY);
    
    const nodes = nodesJson ? JSON.parse(nodesJson) : [];
    const chains = chainsJson ? JSON.parse(chainsJson) : [];
    
    return { nodes, chains };
  } catch (error) {
    console.error('[Migration] Error loading from localStorage:', error);
    return { nodes: [], chains: [] };
  }
}

/**
 * Удалить данные из localStorage после миграции
 */
function cleanupLocalStorage(): void {
  localStorage.removeItem(NODES_KEY);
  localStorage.removeItem(CHAINS_KEY);
  console.log('[Migration] Cleaned up localStorage');
}

/**
 * Выполнить миграцию
 */
export async function migrateToIndexedDB(): Promise<void> {
  // Проверить, нужна ли миграция
  if (isMigrated()) {
    console.log('[Migration] Already migrated to IndexedDB');
    return;
  }
  
  console.log('[Migration] Starting migration from localStorage to IndexedDB...');
  
  try {
    // 1. Загрузить из localStorage
    const { nodes, chains } = loadFromLocalStorage();
    console.log(`[Migration] Found ${nodes.length} nodes and ${chains.length} chains in localStorage`);
    
    // 2. Сохранить в IndexedDB
    if (nodes.length > 0) {
      await saveNodes(nodes);
    }
    if (chains.length > 0) {
      await saveChains(chains);
    }
    
    // 3. Проверить успешность
    const stats = await getStorageStats();
    console.log(`[Migration] Saved to IndexedDB:`, stats);
    
    // 4. Удалить из localStorage
    cleanupLocalStorage();
    
    // 5. Отметить миграцию как завершённую
    markAsMigrated();
    
    console.log('[Migration] ✅ Migration completed successfully');
  } catch (error) {
    console.error('[Migration] ❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Сбросить флаг миграции (для тестирования)
 */
export function resetMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_KEY);
  console.log('[Migration] Migration flag reset');
}

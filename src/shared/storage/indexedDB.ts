/**
 * IndexedDB Storage for Nodes and Chains
 * 
 * Заменяет localStorage для хранения больших объемов данных.
 * Преимущества:
 * - Асинхронный (не блокирует UI)
 * - Больше места (~50MB+ vs 5-10MB)
 * - Структурированные данные
 * - Индексы для быстрого поиска
 */

import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Node, Chain } from '../../types';

// Схема БД
interface GameDB extends DBSchema {
  nodes: {
    key: string;
    value: Node;
    indexes: { 'by-status': string };
  };
  chains: {
    key: string;
    value: Chain;
    indexes: { 'by-status': string };
  };
}

const DB_NAME = 'qdam-game';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<GameDB> | null = null;

/**
 * Инициализация БД (создание объектных хранилищ и индексов)
 */
async function initDB(): Promise<IDBPDatabase<GameDB>> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB<GameDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Nodes store
      if (!db.objectStoreNames.contains('nodes')) {
        const nodeStore = db.createObjectStore('nodes', { keyPath: 'id' });
        nodeStore.createIndex('by-status', 'status');
      }
      
      // Chains store
      if (!db.objectStoreNames.contains('chains')) {
        const chainStore = db.createObjectStore('chains', { keyPath: 'id' });
        chainStore.createIndex('by-status', 'status');
      }
      
      console.log('[IndexedDB] Database initialized');
    },
  });
  
  return dbInstance;
}

// ========================================
// NODES
// ========================================

/**
 * Сохранить все узлы (перезаписывает существующие)
 */
export async function saveNodes(nodes: Node[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('nodes', 'readwrite');
  
  // Очистить старые данные
  await tx.store.clear();
  
  // Записать новые
  await Promise.all(nodes.map(node => tx.store.put(node)));
  await tx.done;
  
  console.log(`[IndexedDB] Saved ${nodes.length} nodes`);
}

/**
 * Загрузить все узлы
 */
export async function loadNodes(): Promise<Node[]> {
  const db = await initDB();
  const nodes = await db.getAll('nodes');
  console.log(`[IndexedDB] Loaded ${nodes.length} nodes`);
  return nodes;
}

/**
 * Добавить или обновить узел
 */
export async function saveNode(node: Node): Promise<void> {
  const db = await initDB();
  await db.put('nodes', node);
}

/**
 * Удалить узел
 */
export async function deleteNode(nodeId: string): Promise<void> {
  const db = await initDB();
  await db.delete('nodes', nodeId);
}

/**
 * Получить узлы по статусу (используя индекс)
 */
export async function getNodesByStatus(status: string): Promise<Node[]> {
  const db = await initDB();
  return db.getAllFromIndex('nodes', 'by-status', status);
}

// ========================================
// CHAINS
// ========================================

/**
 * Сохранить все цепи (перезаписывает существующие)
 */
export async function saveChains(chains: Chain[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('chains', 'readwrite');
  
  await tx.store.clear();
  await Promise.all(chains.map(chain => tx.store.put(chain)));
  await tx.done;
  
  console.log(`[IndexedDB] Saved ${chains.length} chains`);
}

/**
 * Загрузить все цепи
 */
export async function loadChains(): Promise<Chain[]> {
  const db = await initDB();
  const chains = await db.getAll('chains');
  console.log(`[IndexedDB] Loaded ${chains.length} chains`);
  return chains;
}

/**
 * Добавить или обновить цепь
 */
export async function saveChain(chain: Chain): Promise<void> {
  const db = await initDB();
  await db.put('chains', chain);
}

/**
 * Удалить цепь
 */
export async function deleteChain(chainId: string): Promise<void> {
  const db = await initDB();
  await db.delete('chains', chainId);
}

/**
 * Получить цепи по статусу
 */
export async function getChainsByStatus(status: string): Promise<Chain[]> {
  const db = await initDB();
  return db.getAllFromIndex('chains', 'by-status', status);
}

// ========================================
// UTILITY
// ========================================

/**
 * Очистить всю БД
 */
export async function clearDatabase(): Promise<void> {
  const db = await initDB();
  await db.clear('nodes');
  await db.clear('chains');
  console.log('[IndexedDB] Database cleared');
}

/**
 * Получить статистику хранилища
 */
export async function getStorageStats(): Promise<{
  nodesCount: number;
  chainsCount: number;
}> {
  const db = await initDB();
  const [nodesCount, chainsCount] = await Promise.all([
    db.count('nodes'),
    db.count('chains'),
  ]);
  
  return { nodesCount, chainsCount };
}

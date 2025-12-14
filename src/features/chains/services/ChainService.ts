/**
 * ChainService - Business logic for Chain management
 * 
 * Отделяет бизнес-логику цепей от UI компонентов.
 * Все операции с цепями проходят через этот сервис.
 */

import type { Chain, Node } from '../../../types';
import * as storage from '../../../utils/storage';
import { v4 as uuidv4 } from 'uuid';

export class ChainService {
  /**
   * Создать новую цепь
   */
  static createChain(
    nodeA: Node,
    nodeB: Node,
    options: {
      isTemporary?: boolean;
      path?: number[][];
    } = {}
  ): Chain {
    const chain: Chain = {
      id: uuidv4(),
      nodeA_id: nodeA.id,
      nodeB_id: nodeB.id,
      createdAt: Date.now(),
      path: options.path || [],
      isTemporary: options.isTemporary || false,
    };
    
    return chain;
  }
  
  /**
   * Проверить, является ли цепь временной
   */
  static isTemporary(chain: Chain): boolean {
    return chain.isTemporary === true;
  }
  
  /**
   * Проверить, является ли цепь постоянной
   */
  static isPermanent(chain: Chain): boolean {
    return !chain.isTemporary;
  }
  
  /**
   * Получить все постоянные цепи
   */
  static getPermanentChains(chains: Chain[]): Chain[] {
    return chains.filter(c => !c.isTemporary);
  }
  
  /**
   * Получить все временные цепи
   */
  static getTemporaryChains(chains: Chain[]): Chain[] {
    return chains.filter(c => c.isTemporary);
  }
  
  /**
   * Найти цепь по ID
   */
  static findById(chains: Chain[], id: string): Chain | undefined {
    return chains.find(c => c.id === id);
  }
  
  /**
   * Найти все цепи для узла
   */
  static findChainsForNode(chains: Chain[], nodeId: string): Chain[] {
    return chains.filter(c => c.nodeA_id === nodeId || c.nodeB_id === nodeId);
  }
  
  /**
   * Найти цепь между двумя узлами
   */
  static findChainBetweenNodes(
    chains: Chain[],
    nodeAId: string,
    nodeBId: string
  ): Chain | undefined {
    return chains.find(
      c =>
        (c.nodeA_id === nodeAId && c.nodeB_id === nodeBId) ||
        (c.nodeA_id === nodeBId && c.nodeB_id === nodeAId)
    );
  }
  
  /**
   * Проверить, существует ли цепь между узлами
   */
  static existsChainBetween(
    chains: Chain[],
    nodeAId: string,
    nodeBId: string
  ): boolean {
    return this.findChainBetweenNodes(chains, nodeAId, nodeBId) !== undefined;
  }
  
  /**
   * Получить узлы, связанные с узлом через цепи
   */
  static getConnectedNodeIds(chains: Chain[], nodeId: string): string[] {
    return chains
      .filter(c => c.nodeA_id === nodeId || c.nodeB_id === nodeId)
      .map(c => (c.nodeA_id === nodeId ? c.nodeB_id : c.nodeA_id));
  }
  
  /**
   * Сохранить цепи в storage
   */
  static async saveChains(chains: Chain[], isSimulationMode: boolean): Promise<void> {
    await storage.saveChains(chains, isSimulationMode);
  }
  
  /**
   * Загрузить цепи из storage
   */
  static async loadChains(): Promise<Chain[]> {
    return await storage.loadChains();
  }
  
  /**
   * Добавить цепь в список
   */
  static addChain(chains: Chain[], newChain: Chain): Chain[] {
    return [...chains, newChain];
  }
  
  /**
   * Удалить цепь из списка
   */
  static removeChain(chains: Chain[], chainId: string): Chain[] {
    return chains.filter(c => c.id !== chainId);
  }
  
  /**
   * Обновить цепь в списке
   */
  static updateChain(chains: Chain[], updatedChain: Chain): Chain[] {
    return chains.map(c => (c.id === updatedChain.id ? updatedChain : c));
  }
  
  /**
   * Заменить все цепи
   */
  static replaceChains(chains: Chain[]): Chain[] {
    return [...chains];
  }
  
  /**
   * Получить статистику цепей
   */
  static getStats(chains: Chain[]) {
    return {
      total: chains.length,
      permanent: this.getPermanentChains(chains).length,
      temporary: this.getTemporaryChains(chains).length,
    };
  }
  
  /**
   * Проверить, валидна ли цепь (оба узла существуют)
   */
  static isValid(chain: Chain, nodes: Node[]): boolean {
    const nodeA = nodes.find(n => n.id === chain.nodeA_id);
    const nodeB = nodes.find(n => n.id === chain.nodeB_id);
    return nodeA !== undefined && nodeB !== undefined;
  }
  
  /**
   * Удалить невалидные цепи (у которых удалены узлы)
   */
  static removeInvalidChains(chains: Chain[], nodes: Node[]): Chain[] {
    return chains.filter(c => this.isValid(c, nodes));
  }
}

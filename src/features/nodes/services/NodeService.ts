/**
 * NodeService - Business logic for Node management
 * 
 * Отделяет бизнес-логику от UI компонентов.
 * Все операции с узлами проходят через этот сервис.
 */

import type { Node } from '../../../types';
import * as storage from '../../../utils/storage';
import { nodeSpatialIndex } from '@shared/spatial/spatialIndex';
import { v4 as uuidv4 } from 'uuid';

export class NodeService {
  /**
   * Создать новый узел
   */
  static createNode(
    coordinates: [number, number],
    options: {
      status?: Node['status'];
      isTemporary?: boolean;
    } = {}
  ): Node {
    const node: Node = {
      id: uuidv4(),
      coordinates,
      createdAt: Date.now(),
      status: options.status || 'pending',
      isTemporary: options.isTemporary || false,
    };
    
    return node;
  }
  
  /**
   * Обновить статус узла
   */
  static updateNodeStatus(node: Node, status: Node['status']): Node {
    return {
      ...node,
      status,
    };
  }
  
  /**
   * Проверить, является ли узел временным
   */
  static isTemporary(node: Node): boolean {
    return node.isTemporary === true;
  }
  
  /**
   * Проверить, является ли узел постоянным
   */
  static isPermanent(node: Node): boolean {
    return !node.isTemporary;
  }
  
  /**
   * Получить все постоянные узлы
   */
  static getPermanentNodes(nodes: Node[]): Node[] {
    return nodes.filter(n => !n.isTemporary);
  }
  
  /**
   * Получить все временные узлы
   */
  static getTemporaryNodes(nodes: Node[]): Node[] {
    return nodes.filter(n => n.isTemporary);
  }
  
  /**
   * Получить узлы по статусу
   */
  static getNodesByStatus(nodes: Node[], status: Node['status']): Node[] {
    return nodes.filter(n => n.status === status);
  }
  
  /**
   * Получить установленные узлы (established)
   */
  static getEstablishedNodes(nodes: Node[]): Node[] {
    return nodes.filter(n => n.status === 'established');
  }
  
  /**
   * Найти узел по ID
   */
  static findById(nodes: Node[], id: string): Node | undefined {
    return nodes.find(n => n.id === id);
  }
  
  /**
   * Сохранить узлы в storage
   */
  static async saveNodes(nodes: Node[], isSimulationMode: boolean): Promise<void> {
    await storage.saveNodes(nodes, isSimulationMode);
  }
  
  /**
   * Загрузить узлы из storage
   */
  static async loadNodes(): Promise<Node[]> {
    return await storage.loadNodes();
  }
  
  /**
   * Обновить spatial index
   */
  static updateSpatialIndex(nodes: Node[]): void {
    nodeSpatialIndex.buildIndex(nodes);
  }
  
  /**
   * Найти ближайший узел к точке
   */
  static findNearestNode(
    coordinates: [number, number],
    _nodes: Node[], // Не используется, spatial index уже содержит данные
    maxResults: number = 1
  ): Node[] {
    // Используем spatial index для быстрого поиска
    return nodeSpatialIndex.findNearest(coordinates, maxResults);
  }
  
  /**
   * Найти узлы в радиусе от точки
   */
  static findNodesInRadius(
    coordinates: [number, number],
    _nodes: Node[] // Не используется, spatial index уже содержит данные
  ): Node[] {
    return nodeSpatialIndex.searchRadius(coordinates);
  }
  
  /**
   * Проверить, можно ли создать узел в точке (не в сфере влияния других)
   */
  static canCreateNodeAt(
    coordinates: [number, number],
    existingNodes: Node[]
  ): boolean {
    const nodesInRadius = this.findNodesInRadius(coordinates, existingNodes);
    return nodesInRadius.length === 0;
  }
  
  /**
   * Добавить узел в список
   */
  static addNode(nodes: Node[], newNode: Node): Node[] {
    return [...nodes, newNode];
  }
  
  /**
   * Удалить узел из списка
   */
  static removeNode(nodes: Node[], nodeId: string): Node[] {
    return nodes.filter(n => n.id !== nodeId);
  }
  
  /**
   * Обновить узел в списке
   */
  static updateNode(nodes: Node[], updatedNode: Node): Node[] {
    return nodes.map(n => n.id === updatedNode.id ? updatedNode : n);
  }
  
  /**
   * Заменить все узлы
   */
  static replaceNodes(nodes: Node[]): Node[] {
    return [...nodes];
  }
  
  /**
   * Подсчитать количество узлов по статусу
   */
  static countByStatus(nodes: Node[]): Record<Node['status'], number> {
    return nodes.reduce((acc, node) => {
      acc[node.status] = (acc[node.status] || 0) + 1;
      return acc;
    }, {} as Record<Node['status'], number>);
  }
  
  /**
   * Получить статистику узлов
   */
  static getStats(nodes: Node[]) {
    return {
      total: nodes.length,
      permanent: this.getPermanentNodes(nodes).length,
      temporary: this.getTemporaryNodes(nodes).length,
      byStatus: this.countByStatus(nodes),
    };
  }
}

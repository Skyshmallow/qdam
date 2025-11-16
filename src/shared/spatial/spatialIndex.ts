/**
 * Spatial Index for Nodes using R-tree (rbush)
 * 
 * Оптимизирует поиск ближайших узлов и проверку пересечений.
 * Вместо O(n) перебора всех узлов, используем O(log n) поиск по индексу.
 * 
 * Применение:
 * - isInsideSphereOfInfluence (проверка, находится ли точка в радиусе узлов)
 * - Collision detection (проверка пересечений сфер влияния)
 * - Nearest neighbor search (поиск ближайшего узла)
 */

import RBush from 'rbush';
import type { Node } from '../../types';

// Тип элемента в R-tree
export interface SpatialNode {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  node: Node; // Ссылка на оригинальный узел
}

/**
 * Singleton Spatial Index для узлов
 */
class NodeSpatialIndex {
  private static instance: NodeSpatialIndex;
  private tree: RBush<SpatialNode>;
  private radiusKm: number;
  
  private constructor(radiusKm: number = 3.0) {
    this.tree = new RBush<SpatialNode>();
    this.radiusKm = radiusKm;
    console.log(`[SpatialIndex] Initialized with radius ${radiusKm}km`);
  }
  
  static getInstance(radiusKm?: number): NodeSpatialIndex {
    if (!this.instance) {
      this.instance = new NodeSpatialIndex(radiusKm);
    }
    return this.instance;
  }
  
  /**
   * Конвертировать Node в SpatialNode с bounding box
   */
  private nodeToSpatial(node: Node): SpatialNode {
    const [lng, lat] = node.coordinates;
    
    // Приблизительное вычисление bbox в градусах
    // 1 градус широты ≈ 111 км
    // 1 градус долготы зависит от широты: ≈ 111 * cos(lat)
    const latDelta = this.radiusKm / 111;
    const lngDelta = this.radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
    
    return {
      minX: lng - lngDelta,
      minY: lat - latDelta,
      maxX: lng + lngDelta,
      maxY: lat + latDelta,
      node,
    };
  }
  
  /**
   * Построить индекс из массива узлов
   */
  buildIndex(nodes: Node[]): void {
    this.tree.clear();
    const spatialNodes = nodes.map(n => this.nodeToSpatial(n));
    this.tree.load(spatialNodes);
    console.log(`[SpatialIndex] Built index with ${nodes.length} nodes`);
  }
  
  /**
   * Добавить узел в индекс
   */
  insert(node: Node): void {
    const spatial = this.nodeToSpatial(node);
    this.tree.insert(spatial);
  }
  
  /**
   * Удалить узел из индекса
   */
  remove(node: Node): void {
    const spatial = this.nodeToSpatial(node);
    this.tree.remove(spatial, (a: SpatialNode, b: SpatialNode) => a.node.id === b.node.id);
  }
  
  /**
   * Обновить узел в индексе (удалить + добавить)
   */
  update(oldNode: Node, newNode: Node): void {
    this.remove(oldNode);
    this.insert(newNode);
  }
  
  /**
   * Найти все узлы в радиусе от точки (быстрая проверка bbox)
   * Требует дополнительной проверки точного расстояния!
   */
  searchRadius(coordinates: [number, number]): Node[] {
    const [lng, lat] = coordinates;
    
    const latDelta = this.radiusKm / 111;
    const lngDelta = this.radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
    
    const bbox = {
      minX: lng - lngDelta,
      minY: lat - latDelta,
      maxX: lng + lngDelta,
      maxY: lat + latDelta,
    };
    
    const results = this.tree.search(bbox);
    return results.map((r: SpatialNode) => r.node);
  }
  
  /**
   * Найти все узлы, чьи сферы пересекаются с заданной областью
   */
  searchBBox(bbox: { minX: number; minY: number; maxX: number; maxY: number }): Node[] {
    const results = this.tree.search(bbox);
    return results.map((r: SpatialNode) => r.node);
  }
  
  /**
   * Найти ближайший узел к точке
   */
  findNearest(coordinates: [number, number], maxResults: number = 1): Node[] {
    const candidates = this.searchRadius(coordinates);
    
    // Сортируем по расстоянию
    const [targetLng, targetLat] = coordinates;
    const sorted = candidates.sort((a, b) => {
      const distA = this.getDistance(a.coordinates, [targetLng, targetLat]);
      const distB = this.getDistance(b.coordinates, [targetLng, targetLat]);
      return distA - distB;
    });
    
    return sorted.slice(0, maxResults);
  }
  
  /**
   * Быстрое вычисление расстояния (Haversine formula)
   */
  private getDistance(coord1: [number, number], coord2: [number, number]): number {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    
    const R = 6371; // Радиус Земли в км
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  /**
   * Очистить индекс
   */
  clear(): void {
    this.tree.clear();
    console.log('[SpatialIndex] Index cleared');
  }
  
  /**
   * Получить количество элементов в индексе
   */
  size(): number {
    return this.tree.all().length;
  }
  
  /**
   * Получить статистику индекса
   */
  getStats() {
    return {
      size: this.size(),
      radiusKm: this.radiusKm,
    };
  }
}

// Singleton export
export const nodeSpatialIndex = NodeSpatialIndex.getInstance(3.0);

// Export class for testing
export { NodeSpatialIndex };

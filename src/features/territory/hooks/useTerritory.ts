/**
 * useTerritory - Hook for territory calculation
 * 
 * Вычисляет территорию игрока на основе установленных узлов.
 * Использует convex hull алгоритм для построения выпуклой оболочки.
 */

import { useState, useEffect } from 'react';
import type { Feature, Polygon } from 'geojson';
import type { Node } from '../../../types';
import { featureCollection, point } from '@turf/helpers';
import convex from '@turf/convex';
import simplify from '@turf/simplify';

export function useTerritory(nodes: Node[]) {
  const [territory, setTerritory] = useState<Feature<Polygon> | null>(null);
  
  useEffect(() => {
    const allEstablishedNodes = nodes.filter(node => node.status === 'established');

    if (allEstablishedNodes.length < 3) {
      setTerritory(null);
      return;
    }

    try {
      // ✅ CONVEX HULL: Создаём выпуклую оболочку вокруг замков
      const points = featureCollection(
        allEstablishedNodes.map(n => point(n.coordinates))
      );
      
      const hull = convex(points);
      
      if (!hull) {
        setTerritory(null);
        return;
      }
      
      // ✅ SIMPLIFY: Упрощаем полигон для производительности
      const simplified = simplify(hull, { tolerance: 0.0001, highQuality: false });
      
      const territoryPolygon = simplified as Feature<Polygon>;
      
      setTerritory(territoryPolygon);
      
      console.log('[useTerritory] Territory updated', {
        nodes: allEstablishedNodes.length,
        coordinates: territoryPolygon.geometry.coordinates[0].length
      });
    } catch (error) {
      console.error('[useTerritory] Error calculating territory:', error);
      setTerritory(null);
    }
  }, [nodes]);
  
  return territory;
}

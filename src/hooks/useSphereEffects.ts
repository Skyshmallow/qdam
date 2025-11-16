// src/hooks/useSphereEffects.ts
import { useState, useEffect } from 'react';
import { featureCollection, point } from '@turf/helpers';
import buffer from '@turf/buffer';
import type { Feature, Polygon, MultiPolygon, GeoJsonProperties } from 'geojson';

interface UseSphereEffectsProps {
  chains: any[];
  nodes: any[];
  map: any;
}

/**
 * Hook для управления сферами влияния и их анимацией
 * Извлечен из App.tsx для уменьшения размера компонента
 */
export const useSphereEffects = ({ chains, nodes, map }: UseSphereEffectsProps) => {
  const [spheres, setSpheres] = useState<any>(featureCollection([]));

  // === SPHERE GENERATION (Enhanced with rings) ===
  useEffect(() => {
    if (chains.length > 0) {
      const radius = parseFloat(import.meta.env.VITE_SPHERE_RADIUS_KM || '0.5');
      const sphereFeatures: Feature<Polygon | MultiPolygon, GeoJsonProperties>[] = [];
      
      chains.forEach((chain, chainIndex) => {
        const nodeA = nodes.find((n: any) => n.id === chain.nodeA_id);
        const nodeB = nodes.find((n: any) => n.id === chain.nodeB_id);
        
        if (!nodeA || !nodeB) return;
        
        [nodeA.coordinates, nodeB.coordinates].forEach((coords, pointIndex) => {
          const centerPt = point(coords);
          const baseId = `${chain.id}-${pointIndex === 0 ? 'start' : 'end'}`;
          
          // Outer ring
          const outerRing = buffer(centerPt, radius * 1.2, { units: 'kilometers', steps: 64 });
          if (outerRing) {
            outerRing.properties = {
              ...outerRing.properties,
              id: `${baseId}-outer`,
              ring: 'outer',
              chainIndex,
              pointIndex,
              'pulse-width': 1,
              'pulse-opacity': 0.15,
              'fill-opacity': 0.05,
            };
            sphereFeatures.push(outerRing);
          }
          
          // Middle ring
          const middleRing = buffer(centerPt, radius * 0.8, { units: 'kilometers', steps: 64 });
          if (middleRing) {
            middleRing.properties = {
              ...middleRing.properties,
              id: `${baseId}-middle`,
              ring: 'middle',
              chainIndex,
              pointIndex,
              'pulse-width': 2,
              'pulse-opacity': 0.3,
              'fill-opacity': 0.08,
            };
            sphereFeatures.push(middleRing);
          }
          
          // Inner ring
          const innerRing = buffer(centerPt, radius * 0.5, { units: 'kilometers', steps: 64 });
          if (innerRing) {
            innerRing.properties = {
              ...innerRing.properties,
              id: `${baseId}-inner`,
              ring: 'inner',
              chainIndex,
              pointIndex,
              'pulse-width': 3,
              'pulse-opacity': 0.6,
              'fill-opacity': 0.15,
            };
            sphereFeatures.push(innerRing);
          }
        });
      });
      
      setSpheres(featureCollection(sphereFeatures));
    } else {
      setSpheres(featureCollection([]));
    }
  }, [chains, nodes]);

  // === SPHERE PULSE ANIMATION ===
  useEffect(() => {
    if (!map || spheres.features.length === 0) return;

    let animationFrameId: number;
    const source = map.getSource('spheres') as mapboxgl.GeoJSONSource;

    const animate = (timestamp: number) => {
      const time = timestamp / 1000;

      const updatedFeatures = spheres.features.map((feature: any) => {
        const ring = feature.properties.ring;
        const chainIndex = feature.properties.chainIndex || 0;
        const pointIndex = feature.properties.pointIndex || 0;
        
        let phaseOffset = 0;
        if (ring === 'outer') phaseOffset = 0;
        if (ring === 'middle') phaseOffset = Math.PI * 0.66;
        if (ring === 'inner') phaseOffset = Math.PI * 1.33;
        
        const totalOffset = phaseOffset + (chainIndex * 0.5) + (pointIndex * 0.25);
        const pulseValue = Math.sin(time * 2 + totalOffset);
        const normalizedPulse = (pulseValue + 1) / 2;

        let minWidth = 1, maxWidth = 3;
        let minOpacity = 0.2, maxOpacity = 0.8;
        let minFillOpacity = 0.05, maxFillOpacity = 0.2;
        
        if (ring === 'outer') {
          maxWidth = 2;
          maxOpacity = 0.4;
          maxFillOpacity = 0.1;
        } else if (ring === 'middle') {
          maxWidth = 3;
          maxOpacity = 0.6;
          maxFillOpacity = 0.15;
        } else if (ring === 'inner') {
          maxWidth = 4;
          maxOpacity = 1.0;
          maxFillOpacity = 0.25;
        }

        const currentWidth = minWidth + (maxWidth - minWidth) * normalizedPulse;
        const currentOpacity = minOpacity + (maxOpacity - minOpacity) * normalizedPulse;
        const currentFillOpacity = minFillOpacity + (maxFillOpacity - minFillOpacity) * normalizedPulse;

        return {
          ...feature,
          properties: {
            ...feature.properties,
            'pulse-width': currentWidth,
            'pulse-opacity': currentOpacity,
            'fill-opacity': currentFillOpacity,
          }
        };
      });

      const updatedSpheres = featureCollection(updatedFeatures);
      if (source) source.setData(updatedSpheres);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [map, spheres]);

  return spheres;
};

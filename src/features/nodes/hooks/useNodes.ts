/**
 * useNodes - Hook for managing game nodes
 * 
 * Централизует логику работы с узлами:
 * - Загрузка/сохранение из IndexedDB
 * - Spatial index синхронизация
 * - CRUD операции
 */

import { useState, useEffect, useCallback } from 'react';
import type { Node } from '../../../types';
import { NodeService } from '@features/nodes';

interface UseNodesOptions {
  isSimulationMode?: boolean;
  onLoadComplete?: () => void;
}

export function useNodes(options: UseNodesOptions = {}) {
  const { isSimulationMode = false, onLoadComplete } = options;

  const [nodes, setNodes] = useState<Node[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Load nodes from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedNodes = await NodeService.loadNodes();

        if (savedNodes.length > 0) {
          setNodes(savedNodes);
          NodeService.updateSpatialIndex(savedNodes);
          console.log(`[useNodes] Loaded ${savedNodes.length} nodes`);
        }

        setIsLoading(false);
        onLoadComplete?.();
      } catch (error) {
        console.error('[useNodes] Failed to load nodes:', error);
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ FIX: Run only once on mount (onLoadComplete stable callback)

  // ✅ Auto-save nodes when they change
  useEffect(() => {
    if (isLoading) return; // Skip initial load

    NodeService.saveNodes(nodes, isSimulationMode);
  }, [nodes, isSimulationMode, isLoading]);

  // ✅ Update spatial index when nodes change
  useEffect(() => {
    NodeService.updateSpatialIndex(nodes);
  }, [nodes]);

  // CRUD Operations
  const addNode = useCallback((node: Node) => {
    setNodes(prev => NodeService.addNode(prev, node));
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setNodes(prev => NodeService.removeNode(prev, nodeId));
  }, []);

  const updateNode = useCallback((updatedNode: Node) => {
    setNodes(prev => NodeService.updateNode(prev, updatedNode));
  }, []);

  const replaceAllNodes = useCallback((newNodes: Node[]) => {
    setNodes(NodeService.replaceNodes(newNodes));
  }, []);

  // Queries
  const getPermanentNodes = useCallback(() => {
    return NodeService.getPermanentNodes(nodes);
  }, [nodes]);

  const getEstablishedNodes = useCallback(() => {
    return NodeService.getEstablishedNodes(nodes);
  }, [nodes]);

  const findNodeById = useCallback((id: string) => {
    return NodeService.findById(nodes, id);
  }, [nodes]);

  const findNodesInRadius = useCallback((coordinates: [number, number]) => {
    return NodeService.findNodesInRadius(coordinates);
  }, []);

  const canCreateNodeAt = useCallback((coordinates: [number, number]) => {
    return NodeService.canCreateNodeAt(coordinates);
  }, []);

  const getStats = useCallback(() => {
    return NodeService.getStats(nodes);
  }, [nodes]);

  return {
    // State
    nodes,
    isLoading,

    // CRUD
    addNode,
    removeNode,
    updateNode,
    replaceAllNodes,

    // Queries
    getPermanentNodes,
    getEstablishedNodes,
    findNodeById,
    findNodesInRadius,
    canCreateNodeAt,
    getStats,
  };
}

// Export return type for external usage
export type UseNodesReturn = ReturnType<typeof useNodes>;

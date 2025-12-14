/**
 * useChains - Hook for managing game chains
 * 
 * Централизует логику работы с цепями:
 * - Загрузка/сохранение из IndexedDB
 * - CRUD операции
 * - Валидация
 */

import { useState, useEffect, useCallback } from 'react';
import type { Chain, Node } from '../../../types';
import { ChainService } from '@features/chains';

interface UseChainsOptions {
  isSimulationMode?: boolean;
  onLoadComplete?: () => void;
}

export function useChains(options: UseChainsOptions = {}) {
  const { isSimulationMode = false, onLoadComplete } = options;
  
  const [chains, setChains] = useState<Chain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // ✅ Load chains from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedChains = await ChainService.loadChains();
        
        if (savedChains.length > 0) {
          setChains(savedChains);
          console.log(`[useChains] Loaded ${savedChains.length} chains`);
        }
        
        setIsLoading(false);
        onLoadComplete?.();
      } catch (error) {
        console.error('[useChains] Failed to load chains:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ FIX: Run only once on mount (onLoadComplete stable callback)
  
  // ✅ Auto-save chains when they change
  useEffect(() => {
    if (isLoading) return; // Skip initial load
    
    ChainService.saveChains(chains, isSimulationMode);
  }, [chains, isSimulationMode, isLoading]);
  
  // CRUD Operations
  const addChain = useCallback((chain: Chain) => {
    setChains(prev => ChainService.addChain(prev, chain));
  }, []);
  
  const removeChain = useCallback((chainId: string) => {
    setChains(prev => ChainService.removeChain(prev, chainId));
  }, []);
  
  const updateChain = useCallback((updatedChain: Chain) => {
    setChains(prev => ChainService.updateChain(prev, updatedChain));
  }, []);
  
  const replaceAllChains = useCallback((newChains: Chain[]) => {
    setChains(ChainService.replaceChains(newChains));
  }, []);
  
  // Validation
  const removeInvalidChains = useCallback((nodes: Node[]) => {
    setChains(prev => ChainService.removeInvalidChains(prev, nodes));
  }, []);
  
  // Queries
  const getPermanentChains = useCallback(() => {
    return ChainService.getPermanentChains(chains);
  }, [chains]);
  
  const findChainById = useCallback((id: string) => {
    return ChainService.findById(chains, id);
  }, [chains]);
  
  const findChainsForNode = useCallback((nodeId: string) => {
    return ChainService.findChainsForNode(chains, nodeId);
  }, [chains]);
  
  const findChainBetweenNodes = useCallback((nodeAId: string, nodeBId: string) => {
    return ChainService.findChainBetweenNodes(chains, nodeAId, nodeBId);
  }, [chains]);
  
  const existsChainBetween = useCallback((nodeAId: string, nodeBId: string) => {
    return ChainService.existsChainBetween(chains, nodeAId, nodeBId);
  }, [chains]);
  
  const getConnectedNodeIds = useCallback((nodeId: string) => {
    return ChainService.getConnectedNodeIds(chains, nodeId);
  }, [chains]);
  
  const isChainValid = useCallback((chain: Chain, nodes: Node[]) => {
    return ChainService.isValid(chain, nodes);
  }, []);
  
  const getStats = useCallback(() => {
    return ChainService.getStats(chains);
  }, [chains]);
  
  return {
    // State
    chains,
    isLoading,
    
    // CRUD
    addChain,
    removeChain,
    updateChain,
    replaceAllChains,
    
    // Validation
    removeInvalidChains,
    
    // Queries
    getPermanentChains,
    findChainById,
    findChainsForNode,
    findChainBetweenNodes,
    existsChainBetween,
    getConnectedNodeIds,
    isChainValid,
    getStats,
  };
}

// Export return type for external usage
export type UseChainsReturn = ReturnType<typeof useChains>;

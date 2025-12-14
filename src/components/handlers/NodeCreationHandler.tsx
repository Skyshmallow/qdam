// src/components/handlers/NodeCreationHandler.tsx
import { useCallback } from 'react';
import type { UseNodesReturn } from '@features/nodes';
import type { UseChainsReturn } from '@features/chains';
import { createChainFromPath } from '@utils/chainFactory';
import { isValidPath } from '@utils/gameRules';
import type { Node } from '../../types';

interface NodeCreationHandlerProps {
    nodesHook: UseNodesReturn;
    chainsHook: UseChainsReturn;
    isSimulationMode: boolean;
    onSuccess: (message: string) => void;
    onWarning: (message: string) => void;
}

interface FinishChainResult {
    success: boolean;
    chain?: ReturnType<typeof createChainFromPath>['chain'];
    nodeA?: Node;
    nodeB?: Node;
}

/**
 * Hook для обработки создания узлов и цепочек
 */
export const useNodeCreationHandler = ({
                                           nodesHook,
                                           chainsHook,
                                           isSimulationMode,
                                           onSuccess,
                                           onWarning,
                                       }: NodeCreationHandlerProps) => {

    const handleSuccessMessage = useCallback((baseMessage: string) => {
        const message = isSimulationMode
            ? `${baseMessage} (временные данные)`
            : baseMessage;
        onSuccess(message);
    }, [isSimulationMode, onSuccess]);

    /**
     * Общая функция создания цепи и обновления состояния
     */
    const addChainAndNodes = useCallback((
        nodeA: Node,
        nodeB: Node,
        chain: ReturnType<typeof createChainFromPath>['chain'],
        removeOldNode?: boolean
    ) => {
        if (removeOldNode) {
            nodesHook.removeNode(nodeA.id);
        }
        nodesHook.addNode(nodeA);
        nodesHook.addNode(nodeB);
        chainsHook.addChain(chain);
    }, [nodesHook, chainsHook]);

    /**
     * Создать цепь из пути для симуляции
     */
    const createChainFromSimulation = useCallback((
        startCoords: [number, number],
        endCoords: [number, number],
        path: number[][]
    ) => {
        const { nodeA, nodeB, chain } = createChainFromPath(startCoords, endCoords, path, isSimulationMode);
        addChainAndNodes(nodeA, nodeB, chain);
        handleSuccessMessage('Симуляция завершена! Замки созданы');
    }, [addChainAndNodes, handleSuccessMessage, isSimulationMode]);

    /**
     * Завершить создание цепи из активной попытки
     */
    const finishChainCreation = useCallback((
        nodeA: Node,
        endCoords: [number, number],
        path: number[][]
    ): FinishChainResult => {
        const validation = isValidPath(path);
        if (!validation.allowed) {
            onWarning(validation.reason ?? 'Путь слишком короткий для создания цепочки');
            return { success: false };
        }

        const startCoords = nodeA.coordinates as [number, number];
        const { nodeA: newNodeA, nodeB, chain } = createChainFromPath(startCoords, endCoords, path, isSimulationMode);

        addChainAndNodes(newNodeA, nodeB, chain, true);
        handleSuccessMessage('Цепочка успешно создана!');

        return { success: true, chain, nodeA: newNodeA, nodeB };
    }, [addChainAndNodes, handleSuccessMessage, isSimulationMode, onWarning]);

    return {
        createChainFromSimulation,
        finishChainCreation,
    };
};

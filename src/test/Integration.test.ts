import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NodeService } from '../features/nodes/services/NodeService';
import { useMapPlanner } from '../hooks/useMapPlanner';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
vi.mock('../api/mapboxAPI', () => ({
    fetchRoute: vi.fn().mockResolvedValue([[10, 10], [11, 11]]),
}));

vi.mock('@shared/spatial/spatialIndex', () => ({
    nodeSpatialIndex: {
        buildIndex: vi.fn(),
        findNearest: vi.fn(),
        searchRadius: vi.fn().mockReturnValue([]), // No conflicts by default
    },
}));

describe('Integration Flow: User Session', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should simulate a complete user flow: Plan -> Walk -> Create Node', async () => {
        // 1. User starts planning
        const { result: planner } = renderHook(() => useMapPlanner());

        act(() => {
            planner.current.setIsDrawingMode(true);
        });
        expect(planner.current.isDrawingMode).toBe(true);

        // 2. User adds waypoints (Planning)
        await act(async () => {
            await planner.current.addWaypoint([10, 10]);
        });
        expect(planner.current.routeWaypoints).toHaveLength(1);

        // 3. User "walks" to the location (Simulated by checking creation ability)
        const userLocation: [number, number] = [10, 10];
        const canCreate = NodeService.canCreateNodeAt(userLocation);
        expect(canCreate).toBe(true);

        // 4. User creates a node (Execution)
        const newNode = NodeService.createNode(userLocation, { status: 'established' });
        expect(newNode.coordinates).toEqual(userLocation);
        expect(newNode.status).toBe('established');

        // 5. Verify node is "stored" (in memory for this test)
        const nodes = [newNode];
        const establishedNodes = NodeService.getEstablishedNodes(nodes);
        expect(establishedNodes).toHaveLength(1);
        expect(establishedNodes[0].id).toBe(newNode.id);
    });
});

import { describe, it, expect, vi, type Mock } from 'vitest';
import { NodeService } from '../NodeService';
import { nodeSpatialIndex } from '@shared/spatial/spatialIndex';

// Mock spatial index
vi.mock('@shared/spatial/spatialIndex', () => ({
    nodeSpatialIndex: {
        buildIndex: vi.fn(),
        findNearest: vi.fn(),
        searchRadius: vi.fn(),
    },
}));

describe('NodeService', () => {
    it('should create a new node with correct defaults', () => {
        const coords: [number, number] = [10, 20];
        const node = NodeService.createNode(coords);

        expect(node.coordinates).toEqual(coords);
        expect(node.status).toBe('pending');
        expect(node.isTemporary).toBe(false);
        expect(node.id).toBeDefined();
    });

    it('should create a temporary node', () => {
        const coords: [number, number] = [10, 20];
        const node = NodeService.createNode(coords, { isTemporary: true });

        expect(node.isTemporary).toBe(true);
    });

    it('should update node status', () => {
        const node = NodeService.createNode([10, 20]);
        const updated = NodeService.updateNodeStatus(node, 'established');

        expect(updated.status).toBe('established');
        expect(updated.id).toBe(node.id);
    });

    it('should filter nodes by status', () => {
        const nodes = [
            NodeService.createNode([10, 20], { status: 'pending' }),
            NodeService.createNode([30, 40], { status: 'established' }),
        ];

        const pending = NodeService.getNodesByStatus(nodes, 'pending');
        const established = NodeService.getEstablishedNodes(nodes);

        expect(pending).toHaveLength(1);
        expect(established).toHaveLength(1);
    });

    it('should check if node creation is allowed', () => {
        // Mock spatial index to return empty array (no conflicts)
        (nodeSpatialIndex.searchRadius as Mock).mockReturnValue([]);

        const allowed = NodeService.canCreateNodeAt([10, 20]);
        expect(allowed).toBe(true);

        // Mock spatial index to return existing nodes (conflict)
        (nodeSpatialIndex.searchRadius as Mock).mockReturnValue([{}]);

        const denied = NodeService.canCreateNodeAt([10, 20]);
        expect(denied).toBe(false);
    });
});

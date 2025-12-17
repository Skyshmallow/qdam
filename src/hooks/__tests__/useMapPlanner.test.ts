import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useMapPlanner } from '../useMapPlanner';
import { fetchRoute } from '../../api/mapboxAPI';

// Mock API
vi.mock('../../api/mapboxAPI', () => ({
    fetchRoute: vi.fn(),
}));

describe('useMapPlanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useMapPlanner());

        expect(result.current.isDrawingMode).toBe(false);
        expect(result.current.routeWaypoints).toEqual([]);
        expect(result.current.simulatableRoute).toBeNull();
    });

    it('should toggle drawing mode', () => {
        const { result } = renderHook(() => useMapPlanner());

        act(() => {
            result.current.setIsDrawingMode(true);
        });

        expect(result.current.isDrawingMode).toBe(true);
    });

    it('should add waypoints and fetch route', async () => {
        const mockRoute = [[10, 10], [11, 11]];
        (fetchRoute as Mock).mockResolvedValue(mockRoute);

        const { result } = renderHook(() => useMapPlanner());

        await act(async () => {
            await result.current.addWaypoint([10, 10]);
        });

        expect(result.current.routeWaypoints).toEqual([[10, 10]]);
        expect(fetchRoute).toHaveBeenCalled();
    });

    it('should reset planner', () => {
        const { result } = renderHook(() => useMapPlanner());

        act(() => {
            result.current.setIsDrawingMode(true);
            result.current.updateWaypoints([[10, 10]]);
        });

        act(() => {
            result.current.resetPlanner();
        });

        expect(result.current.isDrawingMode).toBe(false);
        expect(result.current.routeWaypoints).toEqual([]);
        expect(result.current.simulatableRoute).toBeNull();
    });
});

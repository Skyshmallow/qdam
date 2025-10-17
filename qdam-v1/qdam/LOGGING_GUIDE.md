# Logging Guide - Debug Your App

This document describes the comprehensive logging system added to help you debug the application.

## Log Format

All logs follow a consistent format:
```
[HH:MM:SS.mmm][Component] Message { optional: details }
```

Example:
```
[14:23:45.123][App] Starting tracking mode
```

## Components with Logging

### 1. **ThreeLayer** (`src/utils/ThreeLayer.ts`)
Tracks 3D model rendering and positioning.

**Logs:**
- ✅ Initialized - Constructor with scale info
- ✅ onAdd - Layer added to map, renderer setup
- ✅ Model loading start/success/error
- ✅ First render only (no spam)
- ✅ Every 100th render with instance count
- ✅ setData - Feature processing summary
- ✅ First instance details (coordinates, position calculations)
- ✅ Instance add/remove operations
- ✅ onRemove - Cleanup stats

**Anti-spam:** Render logs limited to first + every 100th frame.

---

### 2. **App Component** (`src/App.tsx`)
Main application orchestrator.

**Logs:**
- ✅ Map loaded and 3D layer initialization
- ✅ Activity state changes (idle → tracking → simulating)
- ✅ Bases updates (count and data)
- ✅ handleStart - Tracking start validation
- ✅ handleStop - Stop operations with state
- ✅ handleStartSimulation - Route simulation start/complete
- ✅ Updating 3D layer with bases

**Anti-spam:** State change logs only, no render loops.

---

### 3. **useMapbox** (`src/hooks/useMapbox.ts`)
Map initialization and setup.

**Logs:**
- ✅ Initialization start/skip
- ✅ Map load event
- ✅ Castle icon loading
- ✅ onMapLoad callback execution
- ✅ Cleanup on unmount
- ✅ Map errors

**Anti-spam:** One-time initialization logs only.

---

### 4. **useTracking** (`src/hooks/useTracking.ts`)
Path tracking state management.

**Logs:**
- ✅ startTracking - State → recording
- ✅ pauseTracking - State → paused
- ✅ resumeTracking - State → recording
- ✅ stopTracking - State → idle

**Anti-spam:** State transition logs only.

---

### 5. **useGeolocation** (`src/hooks/useGeolocation.ts`)
GPS location requests.

**Logs:**
- ✅ locateUser called, state → prompting
- ✅ Success with coordinates
- ✅ Errors (denied, unavailable, timeout)

**Anti-spam:** Single operation logs only.

---

### 6. **usePositionWatcher** (`src/hooks/usePositionWatcher.ts`)
Continuous position tracking.

**Logs:**
- ✅ Starting/stopping position watch
- ✅ First position update
- ✅ Every 5th position (with count, coords, accuracy)
- ✅ Total positions on stop
- ✅ Errors

**Anti-spam:** Only 1st + every 5th position logged.

---

### 7. **useSimulator** (`src/hooks/useSimulator.ts`)
Route simulation engine.

**Logs:**
- ✅ Starting simulation (route length)
- ✅ Cannot start (reasons)
- ✅ Reached end of route
- ✅ Stop simulation

**Anti-spam:** Key lifecycle events only, no per-frame logs.

---

### 8. **useMapPlanner** (`src/hooks/useMapPlanner.ts`)
Route planning and waypoint management.

**Logs:**
- ✅ Adding waypoint (coordinates, count)
- ✅ Fetching route from API
- ✅ Route fetched successfully (point count)
- ✅ Failed to fetch route
- ✅ Resetting planner
- ✅ Updating waypoints

**Anti-spam:** Operation-based logs only.

---

## How to Use Logs for Debugging

### 1. **Check Initialization Flow**
Look for this sequence:
```
[useMapbox] STARTING initialization...
[useMapbox] EVENT: "load" fired
[useMapbox] Custom castle icon loaded
[App] Map loaded, initializing 3D layer
[ThreeLayer:castles] Initialized
[ThreeLayer:castles] onAdd:start
[ThreeLayer:castles] onAdd:modelLoading:start
[ThreeLayer:castles] onAdd:modelLoading:success
```

### 2. **Track Position Updates**
```
[usePositionWatcher] Starting position watch
[usePositionWatcher] Position update { count: 1, coords: [...] }
[usePositionWatcher] Position update { count: 5, coords: [...] }
```

### 3. **Monitor 3D Model Placement**
```
[App] Updating 3D layer with bases { count: 2 }
[ThreeLayer:castles] setData:start { features: 2 }
[ThreeLayer:castles] setData - First instance details { 
  id: ..., 
  coords: { lng: ..., lat: ... },
  positionMeters: { x: ..., y: ... }
}
```

### 4. **Debug Simulation**
```
[App] Starting simulation { routeLength: 150 }
[useSimulator] Starting simulation { routePoints: 150 }
[ThreeLayer:castles] render - First render
[useSimulator] Simulation reached end of route
[App] Simulation completed
```

### 5. **Find Errors**
All errors use `console.error` with context:
```
[ThreeLayer:castles] ERROR: onAdd:modelLoading:error
[usePositionWatcher] Error watching position { code: 1, message: "..." }
```

## Browser Console Filters

Use these filters in DevTools to focus on specific components:

- `[App]` - Main app logic
- `[ThreeLayer]` - 3D rendering
- `[useMapbox]` - Map setup
- `[useSimulator]` - Simulation
- `[usePositionWatcher]` - GPS tracking
- `[useMapPlanner]` - Route planning

## Performance Impact

✅ **Minimal** - Logs are:
- Limited to state changes
- Anti-spam measures on frequent events
- Use simple string formatting
- No heavy computations in log calls

## Disable Logs in Production

To disable all debug logs in production, add to `vite.config.ts`:

```typescript
define: {
  'console.log': 'void',
  'console.debug': 'void'
}
```

Or use a logging library with log levels.

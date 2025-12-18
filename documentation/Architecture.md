# System Architecture

## 1. Architecture Style
- **Client–backend with BaaS**: React SPA + Supabase (PostgreSQL/PostGIS, Auth, Realtime) with Mapbox/Three.js on the client.
- **Offline-first**: client caches data in IndexedDB, queues mutations, and syncs when online.
- **Evented realtime**: Supabase Realtime channels broadcast territory/node/chain updates (~2s debounce on writes).

## 2. System Components
- **Web Client (React + Vite + TS)**: UI, gameplay logic, map rendering (Mapbox GL JS), 3D effects (Three.js), offline queue, and sync orchestration.
- **Supabase Auth**: Google OAuth, session tokens, and RLS enforcement.
- **Supabase DB (PostgreSQL + PostGIS)**: persistent storage for profiles, nodes, chains, territories, stats.
- **Supabase Realtime**: broadcast changes to nodes/chains/territories to connected clients.
- **Mapbox APIs**: maps/tiles; optional directions/geometry utilities.
- **IndexedDB (browser)**: local cache for offline-first gameplay (nodes, chains, territories, sync queue).

## 3. Component Diagram (textual)
- Browser (React SPA) ↔ Supabase Auth (token issuance)
- Browser (React SPA) ↔ Supabase DB/REST (CRUD for profiles, nodes, chains, territories, stats)
- Browser (React SPA) ↔ Supabase Realtime (subscribe to changes)
- Browser (React SPA) ↔ Mapbox (tiles/styles; optional routing)
- Browser (React SPA) ↔ IndexedDB (local cache/queue)

## 4. Data Flow
1. User signs in with Google via Supabase Auth → receives session token.
2. Gameplay:
   - Start/Stop creates node pairs (start/end) and a chain; territory recomputed locally.
   - Mutations are persisted locally (IndexedDB) and queued for sync.
3. Sync:
   - Online: queued nodes/chains/territory are sent to Supabase REST/RPC; debounce ~2s to batch.
   - Offline: queue grows; on reconnect, pending mutations are replayed; conflicts resolved last-write-wins.
4. Realtime:
   - Supabase Realtime broadcasts node/chain/territory changes; clients update map layers live.
5. Map rendering:
   - Mapbox provides tiles/styles; Three.js renders castles, spheres, grass over the map.

## 5. Database Schema (conceptual)
- **user_profiles**(id, email, username, display_name, avatar_url, territory_area_km2, is_developer, created_at, updated_at)
- **nodes**(id, user_id, coordinates: geometry(Point, 4326), created_at)
- **chains**(id, user_id, node_a_id, node_b_id, path: geometry(LineString, 4326) or point pair array, distance_km, created_at)
- **territories**(id, user_id, polygon: geometry(Polygon, 4326), area_km2, updated_at)
- **player_stats**(user_id, total_chains, total_distance_km, territory_km2, score, updated_at)
- RLS: rows owned by `auth.uid()` except readable public fields (profiles, territory outlines).

## 6. Technology Decisions
- **React + TS + Vite**: fast SPA build, type safety.
- **Mapbox GL JS**: performant vector maps and custom layers for 3D overlays.
- **Three.js**: GPU-accelerated 3D effects (castles, spheres, animated grass).
- **Supabase**: managed Postgres with Auth + Realtime + REST, reduces backend ops.
- **PostGIS**: native geo queries and area/distance calculations.
- **IndexedDB**: durable offline cache for nodes/chains/territories and sync queue.
- **TailwindCSS**: rapid UI styling.

## 7. Frontend–Backend Interaction
- **Auth**: Supabase OAuth; client stores session and attaches JWT to REST/RPC calls.
- **Data ops**: client calls Supabase REST/RPC for nodes/chains/territories/profiles/stats.
- **Realtime**: client subscribes to territory/node/chain channels; applies updates to map layers.
- **Sync**: client batches/queues writes; retries with backoff on failure.

## 8. Potential Future Extensions
- Territory battles and conflict resolution mechanics.
- Leaderboards, achievements, and seasonal events.
- Push notifications for territory changes.
- AR overlays for on-street visualization.
- Web workers for heavier geo/mesh computations.
- Edge caching/CDN for tiles and assets.


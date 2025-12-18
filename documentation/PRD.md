# Product Requirements Document (PRD)

## 1. Product Goal
Deliver a privacy-first, offline-capable GPS territory conquest game where players capture real-world areas through movement, with real-time multiplayer and minimal shared personal data.

## 2. Problem Statement
Urban walks feel repetitive and lack engaging goals; existing location games often expose sensitive routes, depend on constant connectivity, and provide limited territorial competition.

## 3. Target Audience
- Urban walkers and commuters seeking gamified movement
- Casual mobile gamers who enjoy location-based mechanics
- Tech-savvy explorers who value privacy and offline capability
- Competitive players who like territory control and real-time multiplayer

## 4. User Roles
- **Player**: signs in, creates routes and territories, views own stats.
- **Opponent (other players)**: visible to others through territories only (no routes).
- **Developer/Tester**: uses simulation mode for QA and demos (gated by config).

## 5. User Scenarios
- Player signs in with Google, grants location, starts/stops a walk, forms nodes and chains, and sees a territory polygon appear after enough nodes.
- Player opens the map and sees colored territories of other users with periodic updates.
- Player plays offline; progress is cached locally and syncs when back online.
- Player uses simulation mode (with allowed email) to plot routes by clicking for testing without publishing to production data.

## 6. Functional Requirements (MVP)
1. Authentication via Google OAuth (sign-in/out).
2. Location capture: record start/finish GPS points for each route; do not store full tracks in cloud.
3. Node creation: create nodes at route start/end; enforce influence radius (500m) for subsequent starts.
4. Chain creation: create a chain (route) between two nodes; store distance.
5. Territory generation: create/update a polygon when minimum nodes exist (≥4 nodes / 2 routes); calculate area.
6. Multiplayer visibility: display other players' territories on the map with periodic (~2s) updates; do not expose their routes.
7. Offline-first behavior: allow play offline; queue/sync nodes, chains, and territory when online; use IndexedDB for caching.
8. Map visualization: render Mapbox map with 3D elements (castles for nodes, spheres, grass for territories).
9. Privacy controls: expose only territory outline and basic profile (avatar, nickname); keep exact routes private.
10. Developer simulation mode: allow whitelisted emails to create simulated routes without syncing to production.

## 7. Non-Functional Requirements
- **Performance**: map interactions render within 100ms on modern mobile/desktop; sync operations debounce to ~2s to reduce load.
- **Reliability**: queued offline actions persist across app restarts; failed sync retries with backoff.
- **Security**: use Supabase Auth with RLS so users can only modify their own data; store secrets in env files only.
- **Usability**: start/stop flow is obvious; show clear status for GPS permission and sync state.
- **Scalability**: support hundreds of concurrent players in a city with real-time territory updates via Supabase realtime channels.
- **Privacy**: cloud stores only start/finish points and territory polygons; full GPS tracks remain on device.

## 8. MVP Scope (v0.1)
- Google OAuth sign-in/out.
- Node and chain creation with 500m influence rule.
- Territory polygon creation/update and area calculation.
- Offline-first data capture with sync to Supabase.
- Display of other players' territories with ~2s updates.
- Map UI with 3D visualization (castles, spheres, grass).

## 9. Out-of-Scope (Backlog)
- In-game chat or messaging.
- Territory battles/attacks or scoring beyond area stats.
- Leaderboards and achievements.
- Push notifications.
- Monetization and in-app purchases.
- Detailed route playback or sharing.
- AR overlays.

## 10. Acceptance Criteria
- **Authentication**: User can sign in with Google and see session active; sign-out clears session.
- **Location capture**: Starting/stopping a route creates two GPS points; only start/finish are sent to cloud.
- **Node creation**: First route can start anywhere; subsequent starts are blocked unless inside 500m influence; node records persist locally and in cloud after sync.
- **Chain creation**: Each route creates a chain linking its two nodes with stored distance; chains appear on next map refresh without page reload.
- **Territory generation**: After ≥4 nodes (≥2 routes), a territory polygon is created/updated and area is displayed.
- **Multiplayer visibility**: Other players’ territories render in distinct colors; updates reflect within ~2s of changes.
- **Offline-first**: With no network, user can start/stop routes; data is stored locally; when network returns, queued nodes/chains/territory sync automatically without data loss.
- **Map visualization**: Nodes render as 3D castles; influence spheres display; territory polygons show animated grass.
- **Privacy**: Other players cannot see exact nodes or routes—only territory outlines and public profile fields.
- **Developer simulation mode**: Whitelisted email can enter simulation, create routes by clicking, and test data does not sync to production.


# 🎮 QDAM - GPS Territory Conquest Game

**QDAM** is a real-world multiplayer GPS game. Walk your city, capture territory, and compete with other players.

> 🌍 **Turn your city into a game board** — every walk becomes a strategic mission to expand your territory.

## Problem Statement
Urban walks feel repetitive and lack engaging goals; location-based games often expose sensitive routes and are not built for offline use.

## Proposed Solution
Provide a privacy-first, offline-capable GPS conquest game where players capture territory through real-world movement, with real-time multiplayer and minimal shared data.

## Target Users
- Urban walkers and commuters who want gamified movement
- Casual mobile gamers who enjoy location-based mechanics
- Tech-savvy explorers who value privacy and offline capability
- Competitive players who like territory control and real-time multiplayer

---

## ✨ Features

- 🗺️ **Real GPS coordinates** — every step in the real world is reflected in the game
- 👥 **Real-time multiplayer** — see other players' territories with ~2s updates
- 🏰 **3D visualization** — castles, spheres of influence, animated grass on territories
- 💾 **Offline-first** — works without internet, syncs when online
- 🔐 **Google Auth** — secure login via Google account
- 🎨 **Privacy-friendly** — other players see only territory outlines, not exact routes

---

## How to Run Locally

Follow the Quick Start steps below. System requirements: Node.js 18+, npm 9+, Mapbox API token, and a Supabase project (PostgreSQL with PostGIS).

## 🚀 Quick Start

### Requirements
- Node.js 18+
- npm 9+
- Mapbox API token ([get it](https://www.mapbox.com/))
- Supabase project ([create it](https://supabase.com/))

### Installation

```bash
# Clone
git clone https://github.com/Skyshmallow/qdam.git
cd qdam

# Install dependencies
npm install

# Environment configuration
cp .env.example .env.local
# Edit .env.local with your API keys

# Apply database schema
# Supabase Dashboard > SQL Editor > paste supabase/schema.sql > Execute

# Run dev server
npm run dev
```

Open http://localhost:5173 to start playing.

### Configuration (.env.local)

```env
# Mapbox (maps)
VITE_MAPBOX_TOKEN=your_token

# Supabase (backend)
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key

# Game settings
VITE_SPHERE_RADIUS_KM=0.5        # Influence sphere radius (km)
VITE_MAX_CHAINS_PER_DAY=2        # Route limit per day

# Developer mode (for testing)
VITE_DEV_EMAIL=your-email@example.com
```

---

## 🎮 How to Play

### First steps

1. **Sign in** with Google
2. **Enable GPS** — the app shows your position with a blue avatar
3. **Press START** — begin your first route
4. **Walk** 100–200 meters (or more)
5. **Press STOP** — route created, castles appear on the map
6. **Create more routes** — after 2 routes a territory forms

### Core rules

- 🏁 **First route** can start anywhere
- 🔵 **Next routes** must start within the Influence Sphere (500m radius from nodes)
- 🟢 **Territory forms** with at least 4 nodes (2 routes)
- 🎯 **Strategy** — expand territory in different directions
- 👥 **Multiplayer** — see other players' territories (colored zones)

---

## 🎯 Game Elements

### Nodes
**Points on the map** — created automatically at the start and end of each route. Visualized as 🏰 3D castles.

### Chains (Routes)
**Connection between two nodes** — your real path from point A to point B. Only start and finish coordinates are stored for privacy.

### Influence Sphere
**500m radius around each node** — area where you can start a new route. After the first route, all subsequent routes must start inside an existing sphere.

### Territory
**Your game area** — formed from all your nodes (minimum 4). Displayed as a green polygon with animated 3D grass. Area is calculated automatically.

### Multiplayer
**Other players' territories** — visible on the map in different colors (red, blue, yellow, etc.). Opponents' exact routes remain hidden. Real-time updates every ~2 seconds.

---

## 🛠️ Tech Stack

### Frontend
- **React 19**
- **TypeScript**
- **Vite**
- **TailwindCSS**

### Maps & Visualization
- **Mapbox GL JS** — interactive maps
- **Three.js** — 3D graphics (castles, spheres, grass)
- **Turf.js** — geospatial calculations

### Backend & Database
- **Supabase** — PostgreSQL + Auth + Realtime
- **PostGIS** — geospatial data in PostgreSQL
- **Row Level Security (RLS)** — data protection

### Data Storage
- **IndexedDB** — local storage (offline-first)
- **Supabase PostgreSQL** — cloud sync

### Architecture
- **Offline-first** — works offline
- **Auto-sync** — sync every ~2 seconds
- **Real-time updates** — Supabase subscriptions
- **Privacy by design** — minimal data exposed to others

---

## 📁 Project Structure

```
qdam/
├── src/
│   ├── components/              # React components
│   │   ├── Map.tsx              # Main Mapbox map
│   │   ├── TrackingControls.tsx # Start/Stop controls
│   │   └── handlers/            # Map and tracking handlers
│   │
│   ├── contexts/                # React contexts
│   │   └── AuthContext.tsx      # Google Auth + session
│   │
│   ├── services/                # Business logic & API
│   │   ├── NodesService.ts
│   │   ├── ChainsService.ts
│   │   ├── TerritoriesService.ts
│   │   └── ProfileService.ts
│   │
│   ├── features/                # Feature modules
│   │   ├── nodes/               # Node operations
│   │   ├── chains/              # Route operations
│   │   └── territory/           # Territory polygons
│   │
│   ├── hooks/                   # React hooks (auth, GPS, sync)
│   ├── effects/                 # 3D effects (Three.js)
│   ├── ui/                      # UI components
│   ├── store/                   # Zustand stores
│   ├── utils/                   # Utilities
│   ├── shared/                  # Shared modules
│   ├── types/                   # Type definitions
│   ├── simulation/              # Simulation mode
│   ├── api/                     # External API clients
│   └── lib/                     # External libraries
│
├── supabase/                    # Database schema & migrations
├── public/                      # Static assets
└── Config files                 # Vite, TS, Tailwind, env
```

---

## 🔒 Security & Privacy

### What other players see
- ✅ Your nickname and avatar
- ✅ Territory outline (polygon) and area
- ❌ Exact node coordinates
- ❌ Detailed routes (only start/finish stored)

### Privacy mechanism
1. **Locally** the full GPS track is stored only on your device
2. **Cloud** receives only 2 points: start and finish
3. Other players see only your territory boundaries

### Row Level Security (RLS)
- Everyone can read profiles
- Only the owner can modify their profile
- Nodes and routes are bound to the user via `auth.uid()`

---

## 🎮 Game Modes

### Regular mode
Real gameplay with GPS tracking. Data syncs to the cloud and is visible to others.

### Simulation mode (Developer Mode)
- Only for developers (configured via `VITE_DEV_EMAIL`)
- Plan routes by clicking on the map
- Test data is not synced to the server
- Auto cleanup after exit

---

## 📊 Database

### Main tables

**user_profiles** — player profiles  
- username, display_name, avatar_url  
- territory_area_km2  
- is_developer  

**nodes** — map nodes  
- coordinates (PostGIS geometry)  
- user_id, created_at  

**chains** — routes between nodes  
- path (array of 2 points: [start, end])  
- node_a_id, node_b_id  
- distance_km  

**player_stats** — player statistics  
- total_chains, total_distance  
- territory_km2, score  

---

## 🚧 Development

### Useful commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
```

## 🧪 Tests

Run the automated test suite:

```bash
npm run test
# or
npm run vitest -- run
```

Ensure required environment variables are present in `.env.local` before running integration tests.

### Debugging

Logging is off by default. To enable, add to `.env.local`:

```env
VITE_DEBUG_SPHERES=true           # Influence sphere logs
VITE_DEBUG_THREE_LAYER=true       # 3D rendering logs
```

### Multiplayer testing

1. Open the app in 2 browsers (normal + incognito)
2. Sign in with different Google accounts
3. Create territories in both
4. See each other's territories on the map

---

## 📑 Additional Documents

Links to repository documents:
- [Product Requirements Document (PRD)](./PRD.md)
- [Architecture](./Architecture.md)
- [API specification](./API.md)
- [User Stories](./User_Stories.md)

---

## 📝 Changelog

### v2.0 (Week 2) - Multiplayer Release
- ✅ Real-time multiplayer
- ✅ Node and route sync to cloud
- ✅ Other players' territories on the map
- ✅ Privacy: only territory outlines exposed
- ✅ Optimization: chains store 2 points instead of full track
- ✅ 2s debounce for fast updates
- ✅ Colored 3D grass for territories

### v1.0 (Week 1) - Auth & Profile
- ✅ Google OAuth integration
- ✅ Editable player profiles
- ✅ Auto-sync territory to cloud
- ✅ Offline-first architecture

### v0.1 - Core Mechanics
- ✅ GPS route tracking
- ✅ Influence spheres (500m radius)
- ✅ Territory polygons
- ✅ 3D visualization (castles, spheres)
- ✅ Animated grass on territory

---

## 🤝 Contributing

Contributions are welcome:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under MIT. See `LICENSE` for details.

---

## 🌟 Authors

Built with ❤️ by the QDAM team  
**GitHub**: [@Nurdaulet-no](https://github.com/Nurdaulet-no)  
**GitHub**: [@Skyshmallow](https://github.com/Skyshmallow)  
**GitHub**: [@alanauezkhanov](https://github.com/alanauezkhanov)
**GitHub**: [@Nagyzback](https://github.com/Nagyzback)
---

**Enjoy the game! 🎮🌍**


-- ============================================================================
-- QDAM - Supabase Database Schema
-- ============================================================================
-- Version: 1.0.0
-- Description: Complete database schema for QDAM territorial game
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geospatial queries

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Users table (automatically created by Supabase Auth)
-- This table is managed by Supabase, we just reference it
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- Nodes table
-- Stores individual GPS points that players create
-- ----------------------------------------------------------------------------
CREATE TABLE nodes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- GPS coordinates [lng, lat]
  coordinates jsonb NOT NULL,
  
  -- Geographic point for spatial queries (PostGIS)
  location geography(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(
      ST_Point(
        (coordinates->0)::float,
        (coordinates->1)::float
      ),
      4326
    )::geography
  ) STORED,
  
  -- Metadata
  is_temporary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_coordinates CHECK (
    jsonb_typeof(coordinates) = 'array' AND
    jsonb_array_length(coordinates) = 2
  )
);

-- ----------------------------------------------------------------------------
-- Chains table
-- Stores connections between nodes (player journeys)
-- ----------------------------------------------------------------------------
CREATE TABLE chains (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Connected nodes
  node_a_id uuid REFERENCES nodes(id) ON DELETE CASCADE NOT NULL,
  node_b_id uuid REFERENCES nodes(id) ON DELETE CASCADE NOT NULL,
  
  -- Full path taken by player (detailed route)
  -- Array of [lng, lat] coordinates
  path jsonb NOT NULL,
  
  -- Simplified path for rendering other players' territories
  -- (privacy: detailed path only visible to owner)
  simplified_path jsonb GENERATED ALWAYS AS (
    -- Take every 10th point for simplified version
    (
      SELECT jsonb_agg(value)
      FROM jsonb_array_elements(path) WITH ORDINALITY AS t(value, idx)
      WHERE idx % 10 = 0 OR idx = 1 OR idx = jsonb_array_length(path)
    )
  ) STORED,
  
  -- Geographic line for spatial queries (PostGIS)
  route_line geography(LINESTRING, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(
      ST_MakeLine(
        ARRAY(
          SELECT ST_Point(
            (value->0)::float,
            (value->1)::float
          )
          FROM jsonb_array_elements(path) AS value
        )
      ),
      4326
    )::geography
  ) STORED,
  
  -- Calculated fields
  distance_km numeric GENERATED ALWAYS AS (
    ST_Length(
      ST_SetSRID(
        ST_MakeLine(
          ARRAY(
            SELECT ST_Point(
              (value->0)::float,
              (value->1)::float
            )
            FROM jsonb_array_elements(path) AS value
          )
        ),
        4326
      )::geography
    ) / 1000.0
  ) STORED,
  
  -- Metadata
  is_temporary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT different_nodes CHECK (node_a_id != node_b_id),
  CONSTRAINT valid_path CHECK (
    jsonb_typeof(path) = 'array' AND
    jsonb_array_length(path) >= 2
  )
);

-- ----------------------------------------------------------------------------
-- Territories table
-- Stores calculated territory polygons for each user
-- ----------------------------------------------------------------------------
CREATE TABLE territories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Territory polygon (GeoJSON)
  polygon jsonb NOT NULL,
  
  -- Geographic polygon for spatial queries (PostGIS)
  area geography(POLYGON, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(
      ST_GeomFromGeoJSON(polygon::text),
      4326
    )::geography
  ) STORED,
  
  -- Calculated area in square kilometers
  area_km2 numeric GENERATED ALWAYS AS (
    ST_Area(
      ST_SetSRID(
        ST_GeomFromGeoJSON(polygon::text),
        4326
      )::geography
    ) / 1000000.0
  ) STORED,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- One territory per user (updated when chains change)
  CONSTRAINT one_territory_per_user UNIQUE (user_id)
);

-- ----------------------------------------------------------------------------
-- Player Stats table
-- Stores game statistics for each player
-- ----------------------------------------------------------------------------
CREATE TABLE player_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Daily limits
  chains_created_today integer DEFAULT 0 CHECK (chains_created_today >= 0),
  last_chain_date date,
  
  -- All-time statistics
  total_chains integer DEFAULT 0 CHECK (total_chains >= 0),
  total_nodes integer DEFAULT 0 CHECK (total_nodes >= 0),
  total_distance_km numeric DEFAULT 0 CHECK (total_distance_km >= 0),
  
  -- Territory statistics
  current_territory_km2 numeric DEFAULT 0 CHECK (current_territory_km2 >= 0),
  max_territory_km2 numeric DEFAULT 0 CHECK (max_territory_km2 >= 0),
  
  -- Chain records
  longest_chain_km numeric DEFAULT 0 CHECK (longest_chain_km >= 0),
  
  -- Ranking
  rank integer,
  score integer DEFAULT 0 CHECK (score >= 0),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- User Profiles table
-- Extended user information (username, avatar, preferences)
-- ----------------------------------------------------------------------------
CREATE TABLE user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Public information
  username text UNIQUE,
  display_name text,
  avatar_url text,
  
  -- Player color (for territory rendering)
  territory_color text DEFAULT '#10b981',
  
  -- Privacy settings
  show_live_position boolean DEFAULT false,
  show_detailed_routes boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_username CHECK (
    username ~ '^[a-zA-Z0-9_]{3,20}$'
  ),
  CONSTRAINT valid_color CHECK (
    territory_color ~ '^#[0-9a-fA-F]{6}$'
  )
);

-- ----------------------------------------------------------------------------
-- Achievements table (for future leaderboard)
-- ----------------------------------------------------------------------------
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon_url text,
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- User Achievements (junction table)
-- ----------------------------------------------------------------------------
CREATE TABLE user_achievements (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (user_id, achievement_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Nodes indexes
CREATE INDEX idx_nodes_user_id ON nodes(user_id);
CREATE INDEX idx_nodes_created_at ON nodes(created_at DESC);
CREATE INDEX idx_nodes_location ON nodes USING GIST(location);

-- Chains indexes
CREATE INDEX idx_chains_user_id ON chains(user_id);
CREATE INDEX idx_chains_created_at ON chains(created_at DESC);
CREATE INDEX idx_chains_nodes ON chains(node_a_id, node_b_id);
CREATE INDEX idx_chains_route_line ON chains USING GIST(route_line);
CREATE INDEX idx_chains_distance ON chains(distance_km DESC);

-- Territories indexes
CREATE INDEX idx_territories_user_id ON territories(user_id);
CREATE INDEX idx_territories_area ON territories USING GIST(area);
CREATE INDEX idx_territories_area_km2 ON territories(area_km2 DESC);

-- Player stats indexes
CREATE INDEX idx_player_stats_score ON player_stats(score DESC);
CREATE INDEX idx_player_stats_rank ON player_stats(rank ASC);
CREATE INDEX idx_player_stats_territory ON player_stats(current_territory_km2 DESC);

-- User profiles indexes
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Nodes policies
-- ----------------------------------------------------------------------------

-- Anyone can view all nodes (for multiplayer map rendering)
CREATE POLICY "nodes_select_all"
  ON nodes FOR SELECT
  USING (true);

-- Users can insert only their own nodes
CREATE POLICY "nodes_insert_own"
  ON nodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own nodes
CREATE POLICY "nodes_update_own"
  ON nodes FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete only their own nodes
CREATE POLICY "nodes_delete_own"
  ON nodes FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Chains policies
-- ----------------------------------------------------------------------------

-- Anyone can view all chains (but detailed path only for owner)
CREATE POLICY "chains_select_all"
  ON chains FOR SELECT
  USING (true);
  -- Note: 'path' field will be filtered in application logic
  -- Other users will only see 'simplified_path'

-- Users can insert only their own chains
CREATE POLICY "chains_insert_own"
  ON chains FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own chains
CREATE POLICY "chains_update_own"
  ON chains FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete only their own chains
CREATE POLICY "chains_delete_own"
  ON chains FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Territories policies
-- ----------------------------------------------------------------------------

-- Anyone can view all territories
CREATE POLICY "territories_select_all"
  ON territories FOR SELECT
  USING (true);

-- Users can insert only their own territory
CREATE POLICY "territories_insert_own"
  ON territories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own territory
CREATE POLICY "territories_update_own"
  ON territories FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete only their own territory
CREATE POLICY "territories_delete_own"
  ON territories FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Player Stats policies
-- ----------------------------------------------------------------------------

-- Anyone can view all stats (for leaderboard)
CREATE POLICY "player_stats_select_all"
  ON player_stats FOR SELECT
  USING (true);

-- Users can insert only their own stats
CREATE POLICY "player_stats_insert_own"
  ON player_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own stats
CREATE POLICY "player_stats_update_own"
  ON player_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- User Profiles policies
-- ----------------------------------------------------------------------------

-- Anyone can view all profiles (for multiplayer)
CREATE POLICY "user_profiles_select_all"
  ON user_profiles FOR SELECT
  USING (true);

-- Users can insert only their own profile
CREATE POLICY "user_profiles_insert_own"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own profile
CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- User Achievements policies
-- ----------------------------------------------------------------------------

-- Anyone can view all achievements
CREATE POLICY "achievements_select_all"
  ON achievements FOR SELECT
  USING (true);

-- Anyone can view user achievements
CREATE POLICY "user_achievements_select_all"
  ON user_achievements FOR SELECT
  USING (true);

-- Users can insert only their own achievements (via backend function)
CREATE POLICY "user_achievements_insert_own"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Update player stats after chain creation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_player_stats_after_chain()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update player stats
  INSERT INTO player_stats (
    user_id,
    chains_created_today,
    last_chain_date,
    total_chains,
    total_distance_km,
    longest_chain_km
  )
  VALUES (
    NEW.user_id,
    CASE 
      WHEN CURRENT_DATE = (SELECT last_chain_date FROM player_stats WHERE user_id = NEW.user_id)
      THEN COALESCE((SELECT chains_created_today FROM player_stats WHERE user_id = NEW.user_id), 0) + 1
      ELSE 1
    END,
    CURRENT_DATE,
    1,
    NEW.distance_km,
    NEW.distance_km
  )
  ON CONFLICT (user_id) DO UPDATE SET
    chains_created_today = CASE
      WHEN player_stats.last_chain_date = CURRENT_DATE
      THEN player_stats.chains_created_today + 1
      ELSE 1
    END,
    last_chain_date = CURRENT_DATE,
    total_chains = player_stats.total_chains + 1,
    total_distance_km = player_stats.total_distance_km + NEW.distance_km,
    longest_chain_km = GREATEST(player_stats.longest_chain_km, NEW.distance_km),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Update player stats after node creation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_player_stats_after_node()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO player_stats (user_id, total_nodes)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    total_nodes = player_stats.total_nodes + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Auto-create user profile after signup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    'player_' || substr(NEW.id::text, 1, 8),
    COALESCE(NEW.raw_user_meta_data->>'name', 'Player')
  );
  
  INSERT INTO player_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Calculate leaderboard scores
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_scores()
RETURNS void AS $$
BEGIN
  UPDATE player_stats SET
    score = (
      (current_territory_km2 * 100)::integer +
      (total_chains * 10) +
      (total_distance_km * 5)::integer
    ),
    rank = subquery.new_rank
  FROM (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (
        ORDER BY 
          (current_territory_km2 * 100)::integer +
          (total_chains * 10) +
          (total_distance_km * 5)::integer DESC
      ) as new_rank
    FROM player_stats
  ) AS subquery
  WHERE player_stats.user_id = subquery.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update stats after chain creation
CREATE TRIGGER trigger_update_stats_after_chain
  AFTER INSERT ON chains
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_after_chain();

-- Trigger: Update stats after node creation
CREATE TRIGGER trigger_update_stats_after_node
  AFTER INSERT ON nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_after_node();

-- Trigger: Create user profile after signup
CREATE TRIGGER trigger_create_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_nodes_updated_at
  BEFORE UPDATE ON nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_chains_updated_at
  BEFORE UPDATE ON chains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_territories_updated_at
  BEFORE UPDATE ON territories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_player_stats_updated_at
  BEFORE UPDATE ON player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- VIEWS (for easier querying)
-- ============================================================================

-- Leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  ps.rank,
  ps.user_id,
  up.username,
  up.display_name,
  up.avatar_url,
  up.territory_color,
  ps.score,
  ps.total_chains,
  ps.total_distance_km,
  ps.current_territory_km2,
  ps.longest_chain_km
FROM player_stats ps
JOIN user_profiles up ON up.user_id = ps.user_id
ORDER BY ps.rank ASC;

-- Active players view (created chain in last 7 days)
CREATE OR REPLACE VIEW active_players AS
SELECT 
  up.user_id,
  up.username,
  up.display_name,
  up.avatar_url,
  ps.total_chains,
  ps.current_territory_km2,
  COUNT(c.id) as chains_last_week
FROM user_profiles up
JOIN player_stats ps ON ps.user_id = up.user_id
LEFT JOIN chains c ON c.user_id = up.user_id 
  AND c.created_at > now() - interval '7 days'
GROUP BY up.user_id, up.username, up.display_name, up.avatar_url, 
         ps.total_chains, ps.current_territory_km2
HAVING COUNT(c.id) > 0
ORDER BY chains_last_week DESC;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Sample achievements
INSERT INTO achievements (code, name, description, points) VALUES
  ('first_chain', 'First Steps', 'Create your first chain', 10),
  ('chains_10', 'Explorer', 'Create 10 chains', 50),
  ('chains_50', 'Adventurer', 'Create 50 chains', 100),
  ('chains_100', 'Master Explorer', 'Create 100 chains', 250),
  ('distance_10km', 'Long Walker', 'Walk 10km total', 50),
  ('distance_50km', 'Marathon Runner', 'Walk 50km total', 150),
  ('territory_1km2', 'Land Owner', 'Control 1 km² territory', 100),
  ('territory_5km2', 'Baron', 'Control 5 km² territory', 300),
  ('chain_5km', 'Long Journey', 'Create a single 5km chain', 100)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- COMMENTS (for documentation)
-- ============================================================================

COMMENT ON TABLE nodes IS 'GPS points created by players';
COMMENT ON TABLE chains IS 'Connections between nodes representing player journeys';
COMMENT ON TABLE territories IS 'Calculated territory polygons for each player';
COMMENT ON TABLE player_stats IS 'Game statistics and rankings for players';
COMMENT ON TABLE user_profiles IS 'Extended user information and preferences';
COMMENT ON TABLE achievements IS 'Available achievements in the game';
COMMENT ON TABLE user_achievements IS 'Achievements earned by users';

COMMENT ON COLUMN chains.path IS 'Full detailed route (visible only to owner)';
COMMENT ON COLUMN chains.simplified_path IS 'Simplified route (visible to all players)';
COMMENT ON COLUMN player_stats.chains_created_today IS 'Number of chains created today (resets daily)';
COMMENT ON COLUMN user_profiles.show_live_position IS 'Whether to show real-time position to other players';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
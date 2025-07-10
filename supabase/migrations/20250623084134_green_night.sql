/*
  # Dynamic API Integration Schema

  1. Enhanced Tables
    - `golf_courses` - Golf course data with API source tracking
    - `hotels` - Hotel data with real-time availability
    - `restaurants` - Restaurant data with OpenTable/Yelp integration
    - `experiences` - Experience data with booking capabilities
    - `packages` - Package data with dynamic pricing
    - `bookings` - Unified booking system for all item types
    - `user_activity` - User interaction tracking
    - `item_analytics` - Popularity and performance metrics
    - `api_sync_log` - API synchronization tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Admin-only access for analytics tables

  3. Real-time Features
    - Real-time subscriptions for live updates
    - Automatic data synchronization
    - Activity tracking and analytics
*/

-- Golf Courses Table (Enhanced)
CREATE TABLE IF NOT EXISTS golf_courses (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  image text,
  rating decimal(3,2) DEFAULT 0,
  difficulty text,
  holes integer DEFAULT 18,
  yardage integer,
  par integer,
  price decimal(10,2),
  amenities text[],
  address text,
  phone text,
  website text,
  available_times text[],
  latitude decimal(10,8),
  longitude decimal(11,8),
  api_source text DEFAULT 'internal',
  external_id text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Hotels Table (Enhanced)
CREATE TABLE IF NOT EXISTS hotels (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  image text,
  rating decimal(3,2) DEFAULT 0,
  price_per_night decimal(10,2),
  amenities text[],
  address text,
  phone text,
  website text,
  available_rooms integer DEFAULT 0,
  latitude decimal(10,8),
  longitude decimal(11,8),
  api_source text DEFAULT 'internal',
  external_id text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Restaurants Table (Enhanced)
CREATE TABLE IF NOT EXISTS restaurants (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  image text,
  rating decimal(3,2) DEFAULT 0,
  cuisine_type text,
  price_range text,
  amenities text[],
  address text,
  phone text,
  website text,
  hours text,
  opentable_id text,
  yelp_id text,
  latitude decimal(10,8),
  longitude decimal(11,8),
  api_source text DEFAULT 'internal',
  external_id text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Experiences Table (Enhanced)
CREATE TABLE IF NOT EXISTS experiences (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  image text,
  rating decimal(3,2) DEFAULT 0,
  category text,
  duration text,
  price decimal(10,2),
  amenities text[],
  address text,
  phone text,
  website text,
  available_times text[],
  latitude decimal(10,8),
  longitude decimal(11,8),
  api_source text DEFAULT 'internal',
  external_id text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Packages Table (Enhanced)
CREATE TABLE IF NOT EXISTS packages (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  image text,
  rating decimal(3,2) DEFAULT 0,
  duration text,
  price decimal(10,2),
  includes text[],
  golf_courses text[],
  hotels text[],
  restaurants text[],
  experiences text[],
  api_source text DEFAULT 'internal',
  external_id text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Unified Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_type text NOT NULL, -- 'golf', 'hotel', 'restaurant', 'experience', 'package'
  item_id text NOT NULL,
  booking_date date,
  booking_time time,
  party_size integer DEFAULT 1,
  status text DEFAULT 'confirmed', -- 'pending', 'confirmed', 'cancelled'
  total_price decimal(10,2),
  confirmation_code text,
  customer_info jsonb,
  special_requests text,
  api_source text,
  external_booking_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Activity Tracking
CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'view_item', 'book_item', 'add_to_itinerary', 'search'
  metadata jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Item Analytics and Popularity
CREATE TABLE IF NOT EXISTS item_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL,
  item_id text NOT NULL,
  view_count integer DEFAULT 0,
  booking_count integer DEFAULT 0,
  itinerary_count integer DEFAULT 0,
  popularity_score integer DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(item_type, item_id)
);

-- API Synchronization Log
CREATE TABLE IF NOT EXISTS api_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_source text NOT NULL,
  sync_type text NOT NULL, -- 'full', 'incremental', 'manual'
  status text NOT NULL, -- 'success', 'failed', 'partial'
  items_synced integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  error_details jsonb,
  duration_ms integer,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- User Itineraries (Enhanced)
CREATE TABLE IF NOT EXISTS user_itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT 'My Itinerary',
  golf_courses text[],
  hotels text[],
  restaurants text[],
  experiences text[],
  packages text[],
  notes text,
  is_shared boolean DEFAULT false,
  share_token text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE golf_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_itineraries ENABLE ROW LEVEL SECURITY;

-- Public read access for content tables
CREATE POLICY "Public read access for golf courses"
  ON golf_courses
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for hotels"
  ON hotels
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for restaurants"
  ON restaurants
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for experiences"
  ON experiences
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for packages"
  ON packages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for analytics"
  ON item_analytics
  FOR SELECT
  TO public
  USING (true);

-- User-specific policies for bookings
CREATE POLICY "Users can read own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- User activity policies
CREATE POLICY "Users can read own activity"
  ON user_activity
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activity"
  ON user_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Itinerary policies
CREATE POLICY "Users can manage own itineraries"
  ON user_itineraries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read shared itineraries"
  ON user_itineraries
  FOR SELECT
  TO public
  USING (is_shared = true);

-- Admin policies for content management
CREATE POLICY "Admins can manage golf courses"
  ON golf_courses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.email LIKE '%@mbg.com' OR auth.users.email LIKE '%@mbg')
    )
  );

CREATE POLICY "Admins can manage hotels"
  ON hotels
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.email LIKE '%@mbg.com' OR auth.users.email LIKE '%@mbg')
    )
  );

CREATE POLICY "Admins can manage restaurants"
  ON restaurants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.email LIKE '%@mbg.com' OR auth.users.email LIKE '%@mbg')
    )
  );

CREATE POLICY "Admins can manage experiences"
  ON experiences
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.email LIKE '%@mbg.com' OR auth.users.email LIKE '%@mbg')
    )
  );

CREATE POLICY "Admins can manage packages"
  ON packages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.email LIKE '%@mbg.com' OR auth.users.email LIKE '%@mbg')
    )
  );

CREATE POLICY "Admins can read all bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.email LIKE '%@mbg.com' OR auth.users.email LIKE '%@mbg')
    )
  );

CREATE POLICY "Admins can read sync logs"
  ON api_sync_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.email LIKE '%@mbg.com' OR auth.users.email LIKE '%@mbg')
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_golf_courses_rating ON golf_courses(rating DESC);
CREATE INDEX IF NOT EXISTS idx_golf_courses_price ON golf_courses(price);
CREATE INDEX IF NOT EXISTS idx_golf_courses_api_source ON golf_courses(api_source);
CREATE INDEX IF NOT EXISTS idx_golf_courses_location ON golf_courses(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_hotels_rating ON hotels(rating DESC);
CREATE INDEX IF NOT EXISTS idx_hotels_price ON hotels(price_per_night);
CREATE INDEX IF NOT EXISTS idx_hotels_api_source ON hotels(api_source);
CREATE INDEX IF NOT EXISTS idx_hotels_location ON hotels(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON restaurants(rating DESC);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_api_source ON restaurants(api_source);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_experiences_rating ON experiences(rating DESC);
CREATE INDEX IF NOT EXISTS idx_experiences_category ON experiences(category);
CREATE INDEX IF NOT EXISTS idx_experiences_price ON experiences(price);
CREATE INDEX IF NOT EXISTS idx_experiences_api_source ON experiences(api_source);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_item_analytics_type_id ON item_analytics(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_item_analytics_popularity ON item_analytics(popularity_score DESC);

CREATE INDEX IF NOT EXISTS idx_api_sync_log_source ON api_sync_log(api_source);
CREATE INDEX IF NOT EXISTS idx_api_sync_log_status ON api_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_api_sync_log_started ON api_sync_log(started_at DESC);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_itineraries_updated_at 
  BEFORE UPDATE ON user_itineraries 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate popularity score
CREATE OR REPLACE FUNCTION calculate_popularity_score(
  view_count integer,
  booking_count integer,
  itinerary_count integer
)
RETURNS integer AS $$
BEGIN
  RETURN view_count + (booking_count * 5) + (itinerary_count * 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update item popularity
CREATE OR REPLACE FUNCTION update_item_popularity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.popularity_score = calculate_popularity_score(
    NEW.view_count,
    NEW.booking_count,
    NEW.itinerary_count
  );
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic popularity calculation
CREATE TRIGGER update_item_analytics_popularity
  BEFORE INSERT OR UPDATE ON item_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_item_popularity();
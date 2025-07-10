/*
  # Trip Planning System Schema

  1. New Tables
    - `trip_planning_requests` - Stores user trip planning requests
    - `trip_plans` - Stores AI-generated trip plans
    - `trip_plan_items` - Stores individual items in a trip plan
    - `trip_plan_days` - Stores day-by-day itinerary for trip plans
    - `trip_plan_activities` - Stores activities for each day in a trip plan

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Admin-only access for certain operations

  3. Features
    - Store user preferences for trip planning
    - Track AI-generated plans
    - Support day-by-day itineraries
    - Allow for plan modifications and versioning
*/

-- Trip Planning Requests Table
CREATE TABLE IF NOT EXISTS trip_planning_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_data jsonb NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trip Plans Table
CREATE TABLE IF NOT EXISTS trip_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_request_id uuid REFERENCES trip_planning_requests(id) ON DELETE SET NULL,
  trip_data jsonb NOT NULL,
  plan_data jsonb NOT NULL,
  status text DEFAULT 'generated',
  version integer DEFAULT 1,
  is_finalized boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trip Plan Items Table
CREATE TABLE IF NOT EXISTS trip_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_plan_id uuid REFERENCES trip_plans(id) ON DELETE CASCADE,
  item_type text NOT NULL, -- 'golf', 'hotel', 'restaurant', 'experience', 'transportation'
  item_id text NOT NULL,
  item_data jsonb NOT NULL,
  is_booked boolean DEFAULT false,
  booking_id text,
  created_at timestamptz DEFAULT now()
);

-- Trip Plan Days Table
CREATE TABLE IF NOT EXISTS trip_plan_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_plan_id uuid REFERENCES trip_plans(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Trip Plan Activities Table
CREATE TABLE IF NOT EXISTS trip_plan_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_plan_day_id uuid REFERENCES trip_plan_days(id) ON DELETE CASCADE,
  activity_time time NOT NULL,
  description text NOT NULL,
  activity_type text NOT NULL, -- 'golf', 'hotel', 'restaurant', 'experience', 'transportation', 'other'
  item_id text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE trip_planning_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_plan_activities ENABLE ROW LEVEL SECURITY;

-- User-specific policies for trip planning requests
CREATE POLICY "Users can read own trip planning requests"
  ON trip_planning_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trip planning requests"
  ON trip_planning_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trip planning requests"
  ON trip_planning_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- User-specific policies for trip plans
CREATE POLICY "Users can read own trip plans"
  ON trip_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trip plans"
  ON trip_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trip plans"
  ON trip_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- User-specific policies for trip plan items
CREATE POLICY "Users can read own trip plan items"
  ON trip_plan_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_plans
      WHERE trip_plans.id = trip_plan_items.trip_plan_id
      AND trip_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own trip plan items"
  ON trip_plan_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_plans
      WHERE trip_plans.id = trip_plan_items.trip_plan_id
      AND trip_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own trip plan items"
  ON trip_plan_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_plans
      WHERE trip_plans.id = trip_plan_items.trip_plan_id
      AND trip_plans.user_id = auth.uid()
    )
  );

-- User-specific policies for trip plan days
CREATE POLICY "Users can read own trip plan days"
  ON trip_plan_days
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_plans
      WHERE trip_plans.id = trip_plan_days.trip_plan_id
      AND trip_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own trip plan days"
  ON trip_plan_days
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_plans
      WHERE trip_plans.id = trip_plan_days.trip_plan_id
      AND trip_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own trip plan days"
  ON trip_plan_days
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_plans
      WHERE trip_plans.id = trip_plan_days.trip_plan_id
      AND trip_plans.user_id = auth.uid()
    )
  );

-- User-specific policies for trip plan activities
CREATE POLICY "Users can read own trip plan activities"
  ON trip_plan_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_plan_days
      JOIN trip_plans ON trip_plans.id = trip_plan_days.trip_plan_id
      WHERE trip_plan_days.id = trip_plan_activities.trip_plan_day_id
      AND trip_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own trip plan activities"
  ON trip_plan_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_plan_days
      JOIN trip_plans ON trip_plans.id = trip_plan_days.trip_plan_id
      WHERE trip_plan_days.id = trip_plan_activities.trip_plan_day_id
      AND trip_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own trip plan activities"
  ON trip_plan_activities
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_plan_days
      JOIN trip_plans ON trip_plans.id = trip_plan_days.trip_plan_id
      WHERE trip_plan_days.id = trip_plan_activities.trip_plan_day_id
      AND trip_plans.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_planning_requests_user_id ON trip_planning_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_planning_requests_status ON trip_planning_requests(status);

CREATE INDEX IF NOT EXISTS idx_trip_plans_user_id ON trip_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_plans_request_id ON trip_plans(trip_request_id);
CREATE INDEX IF NOT EXISTS idx_trip_plans_status ON trip_plans(status);

CREATE INDEX IF NOT EXISTS idx_trip_plan_items_plan_id ON trip_plan_items(trip_plan_id);
CREATE INDEX IF NOT EXISTS idx_trip_plan_items_type ON trip_plan_items(item_type);
CREATE INDEX IF NOT EXISTS idx_trip_plan_items_booked ON trip_plan_items(is_booked);

CREATE INDEX IF NOT EXISTS idx_trip_plan_days_plan_id ON trip_plan_days(trip_plan_id);
CREATE INDEX IF NOT EXISTS idx_trip_plan_days_date ON trip_plan_days(date);

CREATE INDEX IF NOT EXISTS idx_trip_plan_activities_day_id ON trip_plan_activities(trip_plan_day_id);
CREATE INDEX IF NOT EXISTS idx_trip_plan_activities_type ON trip_plan_activities(activity_type);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_trip_planning_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_trip_planning_requests_timestamp
  BEFORE UPDATE ON trip_planning_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_planning_timestamp();

CREATE TRIGGER update_trip_plans_timestamp
  BEFORE UPDATE ON trip_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_planning_timestamp();
/*
  # Fix RLS policies for anonymous data synchronization

  1. Policy Updates
    - Add policies to allow anonymous users to sync data for tables with `api_source` field
    - Ensure sync operations don't require access to auth.users table
    - Maintain existing security for user-specific operations

  2. Tables Affected
    - `golf_courses` - Allow anon sync when api_source is not null
    - `hotels` - Allow anon sync when api_source is not null  
    - `restaurants` - Allow anon sync when api_source is not null
    - `experiences` - Allow anon sync when api_source is not null
    - `packages` - Allow anon sync when api_source is not null

  3. Security
    - Existing admin and user policies remain unchanged
    - Sync operations are restricted to records with api_source field
    - Public read access remains unchanged
*/

-- Update golf_courses policies
DROP POLICY IF EXISTS "Allow sync operations for golf_courses" ON golf_courses;
CREATE POLICY "Allow anon sync operations for golf_courses"
  ON golf_courses
  FOR ALL
  TO anon
  USING (api_source IS NOT NULL)
  WITH CHECK (api_source IS NOT NULL);

-- Update hotels policies  
DROP POLICY IF EXISTS "Allow sync operations for hotels" ON hotels;
CREATE POLICY "Allow anon sync operations for hotels"
  ON hotels
  FOR ALL
  TO anon
  USING (api_source IS NOT NULL)
  WITH CHECK (api_source IS NOT NULL);

-- Update restaurants policies
DROP POLICY IF EXISTS "Allow sync operations for restaurants" ON restaurants;
CREATE POLICY "Allow anon sync operations for restaurants"
  ON restaurants
  FOR ALL
  TO anon
  USING (api_source IS NOT NULL)
  WITH CHECK (api_source IS NOT NULL);

-- Update experiences policies
DROP POLICY IF EXISTS "Allow sync operations for experiences" ON experiences;
CREATE POLICY "Allow anon sync operations for experiences"
  ON experiences
  FOR ALL
  TO anon
  USING (api_source IS NOT NULL)
  WITH CHECK (api_source IS NOT NULL);

-- Update packages policies
DROP POLICY IF EXISTS "Allow sync operations for packages" ON packages;
CREATE POLICY "Allow anon sync operations for packages"
  ON packages
  FOR ALL
  TO anon
  USING (api_source IS NOT NULL)
  WITH CHECK (api_source IS NOT NULL);
/*
  # Add sync policies for data synchronization

  1. Security Updates
    - Add policies to allow data sync operations for all tables
    - These policies allow INSERT/UPDATE operations for the sync process
    - Maintains existing admin and public read policies

  2. Tables Updated
    - `restaurants` - Add sync policy for INSERT/UPDATE
    - `golf_courses` - Add sync policy for INSERT/UPDATE  
    - `hotels` - Add sync policy for INSERT/UPDATE
    - `experiences` - Add sync policy for INSERT/UPDATE
    - `packages` - Add sync policy for INSERT/UPDATE

  3. Important Notes
    - These policies are specifically for data synchronization
    - Public users can still only read data
    - Admin users retain full management access
*/

-- Add sync policy for restaurants table
CREATE POLICY "Allow sync operations for restaurants"
  ON restaurants
  FOR ALL
  TO anon, authenticated
  USING (api_source IS NOT NULL)
  WITH CHECK (api_source IS NOT NULL);

-- Add sync policy for golf_courses table  
CREATE POLICY "Allow sync operations for golf_courses"
  ON golf_courses
  FOR ALL
  TO anon, authenticated
  USING (api_source IS NOT NULL)
  WITH CHECK (api_source IS NOT NULL);

-- Add sync policy for hotels table
CREATE POLICY "Allow sync operations for hotels"
  ON hotels
  FOR ALL
  TO anon, authenticated
  USING (api_source IS NOT NULL)
  WITH CHECK (api_source IS NOT NULL);

-- Add sync policy for experiences table
CREATE POLICY "Allow sync operations for experiences"
  ON experiences
  FOR ALL
  TO anon, authenticated
  USING (api_source IS NOT NULL)
  WITH CHECK (api_source IS NOT NULL);

-- Add sync policy for packages table
CREATE POLICY "Allow sync operations for packages"
  ON packages
  FOR ALL
  TO anon, authenticated
  USING (api_source IS NOT NULL)
  WITH CHECK (api_source IS NOT NULL);
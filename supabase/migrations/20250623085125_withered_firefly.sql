/*
  # Setup Demo Admin User

  1. Purpose
    - Creates the users table if it doesn't exist
    - Sets up proper structure for demo admin user
    - Note: The actual user creation should be done through Supabase Auth UI or API

  2. Instructions
    - After running this migration, manually create a user with email 'admin@mbg.com' 
      and password 'password' in your Supabase Dashboard under Authentication > Users
    - Or use the Supabase client to sign up the user programmatically

  3. Tables
    - Ensures users table exists with proper structure
    - Sets up foreign key relationship with auth.users
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: To create the demo admin user, run this in your Supabase SQL editor
-- or use the Auth API:
/*
SELECT auth.signup(
  email := 'admin@mbg.com',
  password := 'password',
  user_metadata := '{"name": "Demo Admin"}'::jsonb
);
*/
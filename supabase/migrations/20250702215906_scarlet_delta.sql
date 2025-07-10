/*
  # Fix item_analytics table column names

  1. Changes
    - Rename 'add_to_itinerary_count' to 'itinerary_count' to match the schema
    - This fixes the error: "Could not find the 'add_to_itinerary_count' column of 'item_analytics' in the schema cache"

  2. Tables Affected
    - `item_analytics` - Update column name for consistency

  3. Security
    - No changes to security policies
*/

-- Check if the column exists with the wrong name and rename it if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'item_analytics' 
    AND column_name = 'add_to_itinerary_count'
  ) THEN
    ALTER TABLE item_analytics RENAME COLUMN add_to_itinerary_count TO itinerary_count;
  END IF;
END $$;

-- Make sure the correct column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'item_analytics' 
    AND column_name = 'itinerary_count'
  ) THEN
    ALTER TABLE item_analytics ADD COLUMN itinerary_count integer DEFAULT 0;
  END IF;
END $$;

-- Update the function to calculate popularity score
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

-- Update the trigger function to use the correct column name
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
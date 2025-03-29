/*
  # Initial Schema for College Event Planning System

  1. New Tables
    - `profiles`
      - Extends auth.users with role and profile info
      - Stores user role (super_admin, admin, user)
      - Links to auth.users via foreign key
    
    - `communities`
      - Stores different college communities/groups
      - Managed by super_admin
    
    - `events`
      - Stores event details
      - Managed by admins
      - Links to communities
    
    - `event_participants`
      - Junction table for users participating in events
      - Tracks registration status

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
*/

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'user');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'user',
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create communities table
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  max_participants INTEGER,
  community_id UUID REFERENCES communities(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create event participants table
CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES profiles(id),
  registration_status TEXT DEFAULT 'pending',
  registered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Communities policies
CREATE POLICY "Communities are viewable by everyone"
  ON communities FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage communities"
  ON communities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Events policies
CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage events"
  ON events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'super_admin')
    )
  );

-- Event participants policies
CREATE POLICY "Users can view their participations"
  ON event_participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register for events"
  ON event_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);
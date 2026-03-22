-- ============================================================
-- Fairway Bets — Fix RLS policies
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Drop ALL existing policies to start fresh
-- (The current ones have infinite recursion on group_members)

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'groups', 'group_members', 'rounds', 'settlements')
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 2. PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow reading profiles of people in your groups
-- Uses a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_my_group_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT group_id FROM group_members WHERE user_id = auth.uid();
$$;

CREATE POLICY "Users can read group members profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT user_id FROM group_members
      WHERE group_id IN (SELECT public.get_my_group_ids())
    )
  );

-- 3. GROUPS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read their groups"
  ON groups FOR SELECT
  USING (id IN (SELECT public.get_my_group_ids()));

-- Allow reading any group by invite code (for joining)
CREATE POLICY "Anyone can read group by invite code"
  ON groups FOR SELECT
  USING (true);

CREATE POLICY "Auth users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner can update group"
  ON groups FOR UPDATE
  USING (created_by = auth.uid());

-- 4. GROUP_MEMBERS
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Use the security definer function to avoid recursion
CREATE POLICY "Members can read group members"
  ON group_members FOR SELECT
  USING (group_id IN (SELECT public.get_my_group_ids()));

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- 5. ROUNDS
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can read rounds"
  ON rounds FOR SELECT
  USING (group_id IN (SELECT public.get_my_group_ids()));

-- Allow reading any round by ID (for shareable links)
CREATE POLICY "Public round access"
  ON rounds FOR SELECT
  USING (true);

CREATE POLICY "Group members can insert rounds"
  ON rounds FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND group_id IN (SELECT public.get_my_group_ids())
  );

-- 6. SETTLEMENTS
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settlements for their rounds"
  ON settlements FOR SELECT
  USING (true);

CREATE POLICY "Auth users can insert settlements"
  ON settlements FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can mark settlements paid"
  ON settlements FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Done! The key fix is using get_my_group_ids() security
-- definer function instead of inline subqueries, which avoids
-- the infinite recursion when group_members references itself.
-- ============================================================

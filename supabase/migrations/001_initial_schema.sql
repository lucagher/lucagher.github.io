-- Supabase Database Schema for Data Challenge Leaderboard
-- This migration creates the necessary tables for storing actual values, submissions, and leaderboard data

-- Table to store actual values (ground truth) - only accessible by admin
CREATE TABLE IF NOT EXISTS actual_values (
  id SERIAL PRIMARY KEY,
  values_array REAL[] NOT NULL, -- Array of actual values
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to store all submissions
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL,
  predictions REAL[] NOT NULL, -- Array of predictions
  rmse REAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for leaderboard (aggregated view per team)
CREATE TABLE IF NOT EXISTS leaderboard (
  team_id TEXT PRIMARY KEY,
  score REAL, -- Best (lowest) RMSE score
  entries INTEGER DEFAULT 0, -- Number of submissions
  last_submission TIMESTAMPTZ, -- Timestamp of last submission
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_team_id ON submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score ASC NULLS LAST);

-- Function to calculate RMSE
CREATE OR REPLACE FUNCTION calculate_rmse(actual_values REAL[], predictions REAL[])
RETURNS REAL AS $$
DECLARE
  mse REAL;
  rmse REAL;
  i INTEGER;
  n INTEGER;
BEGIN
  -- Validate arrays have same length
  IF array_length(actual_values, 1) != array_length(predictions, 1) THEN
    RAISE EXCEPTION 'Arrays must have the same length. Actual: %, Predictions: %', 
      array_length(actual_values, 1), array_length(predictions, 1);
  END IF;
  
  n := array_length(actual_values, 1);
  IF n IS NULL OR n = 0 THEN
    RAISE EXCEPTION 'Arrays cannot be empty';
  END IF;
  
  -- Calculate MSE (Mean Squared Error)
  mse := 0.0;
  FOR i IN 1..n LOOP
    mse := mse + POWER(actual_values[i] - predictions[i], 2);
  END LOOP;
  mse := mse / n;
  
  -- Calculate RMSE (Root Mean Squared Error)
  rmse := SQRT(mse);
  
  RETURN rmse;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to submit predictions and update leaderboard
CREATE OR REPLACE FUNCTION submit_predictions(
  p_team_id TEXT,
  p_predictions REAL[]
)
RETURNS JSON AS $$
DECLARE
  v_actual_values REAL[];
  v_rmse REAL;
  v_old_score REAL;
  v_old_entries INTEGER;
  v_result JSON;
BEGIN
  -- Get actual values (should only be one row)
  SELECT values_array INTO v_actual_values
  FROM actual_values
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_actual_values IS NULL THEN
    RAISE EXCEPTION 'Actual values not configured. Please contact administrator.';
  END IF;
  
  -- Calculate RMSE
  v_rmse := calculate_rmse(v_actual_values, p_predictions);
  
  -- Insert submission
  INSERT INTO submissions (team_id, predictions, rmse)
  VALUES (p_team_id, p_predictions, v_rmse);
  
  -- Get current leaderboard entry
  SELECT score, entries INTO v_old_score, v_old_entries
  FROM leaderboard
  WHERE team_id = p_team_id;
  
  -- Update or insert leaderboard entry
  IF v_old_score IS NULL THEN
    -- New team entry
    INSERT INTO leaderboard (team_id, score, entries, last_submission)
    VALUES (p_team_id, v_rmse, 1, NOW())
    ON CONFLICT (team_id) DO UPDATE SET
      score = v_rmse,
      entries = leaderboard.entries + 1,
      last_submission = NOW(),
      updated_at = NOW();
  ELSE
    -- Update existing entry
    UPDATE leaderboard
    SET 
      score = v_rmse, -- Always update with latest RMSE
      entries = entries + 1,
      last_submission = NOW(),
      updated_at = NOW()
    WHERE team_id = p_team_id;
  END IF;
  
  -- Return result
  SELECT json_build_object(
    'success', true,
    'rmse', v_rmse,
    'entries', (SELECT entries FROM leaderboard WHERE team_id = p_team_id),
    'last_submission', (SELECT last_submission FROM leaderboard WHERE team_id = p_team_id)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard data
CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_object_agg(
    team_id,
    json_build_object(
      'score', score,
      'entries', entries,
      'lastSubmission', last_submission
    )
  ) INTO v_result
  FROM leaderboard
  ORDER BY score ASC NULLS LAST;
  
  RETURN COALESCE(v_result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset leaderboard (admin only)
CREATE OR REPLACE FUNCTION reset_leaderboard()
RETURNS JSON AS $$
BEGIN
  -- Delete all submissions
  DELETE FROM submissions;
  
  -- Reset all leaderboard entries
  UPDATE leaderboard
  SET 
    score = NULL,
    entries = 0,
    last_submission = NULL,
    updated_at = NOW();
  
  RETURN json_build_object('success', true, 'message', 'Leaderboard reset');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE actual_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policy: actual_values - only service role can read/write
CREATE POLICY "Service role can manage actual_values"
  ON actual_values
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: submissions - anyone can insert, but only service role can read
CREATE POLICY "Anyone can submit predictions"
  ON submissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can read submissions"
  ON submissions
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Policy: leaderboard - anyone can read, service role can update
CREATE POLICY "Anyone can read leaderboard"
  ON leaderboard
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can update leaderboard"
  ON leaderboard
  FOR ALL
  USING (auth.role() = 'service_role');


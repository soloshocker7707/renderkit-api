-- Create profiles table for API keys, tiers, and user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  api_key TEXT UNIQUE,
  tier TEXT DEFAULT 'Free',
  display_name TEXT,
  company TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create usage_logs table for tracking API requests
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT,
  status_code INTEGER,
  duration_ms INTEGER,
  ip_address TEXT,
  method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create api_keys table for multiple API keys per user
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  key_value TEXT UNIQUE NOT NULL,
  label TEXT DEFAULT 'Primary',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS users_can_view_own_profile ON public.profiles;
CREATE POLICY users_can_view_own_profile ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS users_can_update_own_profile ON public.profiles;
CREATE POLICY users_can_update_own_profile ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for usage_logs
DROP POLICY IF EXISTS users_can_view_own_logs ON public.usage_logs;
CREATE POLICY users_can_view_own_logs ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS users_can_insert_own_logs ON public.usage_logs;
CREATE POLICY users_can_insert_own_logs ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for api_keys
DROP POLICY IF EXISTS users_can_view_own_keys ON public.api_keys;
CREATE POLICY users_can_view_own_keys ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS users_can_insert_own_keys ON public.api_keys;
CREATE POLICY users_can_insert_own_keys ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS users_can_update_own_keys ON public.api_keys;
CREATE POLICY users_can_update_own_keys ON public.api_keys
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS users_can_delete_own_keys ON public.api_keys;
CREATE POLICY users_can_delete_own_keys ON public.api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_value ON public.api_keys(key_value);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_api_key TEXT;
BEGIN
  new_api_key := 'rk_' || 'dev_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 32);
  
  INSERT INTO public.profiles (id, email, api_key)
  VALUES (NEW.id, NEW.email, new_api_key);
  
  INSERT INTO public.api_keys (user_id, key_value, label)
  VALUES (NEW.id, new_api_key, 'Primary');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
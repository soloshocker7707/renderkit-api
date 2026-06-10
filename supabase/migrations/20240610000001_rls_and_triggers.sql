-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
DROP POLICY IF EXISTS users_can_view_own_profile ON public.profiles;
CREATE POLICY users_can_view_own_profile ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS users_can_update_own_profile ON public.profiles;
CREATE POLICY users_can_update_own_profile ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Usage logs RLS
DROP POLICY IF EXISTS users_can_view_own_logs ON public.usage_logs;
CREATE POLICY users_can_view_own_logs ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS users_can_insert_own_logs ON public.usage_logs;
CREATE POLICY users_can_insert_own_logs ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- API Keys RLS
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_value ON public.api_keys(key_value);

-- Auto-create profile + API key on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_api_key TEXT;
BEGIN
  new_api_key := 'rk_' || 'dev_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 32);
  
  INSERT INTO public.profiles (id, email, api_key, tier)
  VALUES (NEW.id, NEW.email, new_api_key, 'Free');
  
  INSERT INTO public.api_keys (user_id, key_value, label)
  VALUES (NEW.id, new_api_key, 'Primary');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
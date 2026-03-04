-- 003_auth_trigger.sql
-- Auto-create profile row on user signup with default values:
-- target_riwayah = 'hafs', daily_goal_minutes = 15, daily_goal_ayahs = 5

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, target_riwayah, daily_goal_minutes, daily_goal_ayahs)
  VALUES (NEW.id, 'hafs', 15, 5);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

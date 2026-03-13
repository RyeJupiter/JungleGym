-- ============================================================
-- JungleGym – Development Seed Data
-- ============================================================
-- Run AFTER migrations. Fixed UUIDs, dev only.
-- Users must be pre-created in auth.users (use Supabase CLI or service-role client).

-- ── Creators ────────────────────────────────────────────────
INSERT INTO public.users (id, email, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'alex@junglegym.dev', 'creator'),
  ('00000000-0000-0000-0000-000000000002', 'maya@junglegym.dev', 'creator')
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (user_id, display_name, username, bio, tagline, location, tags) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Alex Rivera', 'alexrivera',
    'Strength coach and movement teacher. I believe every body is capable of more than it thinks.',
    'Strength & play for every body',
    'Los Angeles, CA',
    ARRAY['strength', 'mobility', 'kettlebell', 'bodyweight']
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Maya Chen', 'mayachen',
    'Yoga teacher & breathwork guide. My sessions are a blend of flow, stillness, and laughter.',
    'Flow, breathe, arrive',
    'Portland, OR',
    ARRAY['yoga', 'breathwork', 'meditation', 'flexibility']
  )
ON CONFLICT DO NOTHING;

-- ── Learner ─────────────────────────────────────────────────
INSERT INTO public.users (id, email, role) VALUES
  ('00000000-0000-0000-0000-000000000003', 'jordan@junglegym.dev', 'learner')
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (user_id, display_name, username, bio, tags) VALUES
  (
    '00000000-0000-0000-0000-000000000003',
    'Jordan Lee', 'jordanlee',
    'Curious mover. Here to learn, grow, and have fun.',
    ARRAY['strength', 'yoga']
  )
ON CONFLICT DO NOTHING;

-- ── Sample videos ────────────────────────────────────────────
INSERT INTO public.videos (creator_id, title, description, duration_seconds, is_free, tags, published) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '5-Minute Hip Opener', 'A quick daily ritual to unlock tight hips. Perfect before any workout.',
    300, true, ARRAY['mobility', 'hips', 'warmup'], true
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Kettlebell Swing Masterclass',
    'Break down the swing from the ground up — hinge, hike, float. Plant this seed and watch it grow.',
    1080, false, ARRAY['strength', 'kettlebell'], true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Morning Breath & Flow',
    'A free 8-minute wake-up sequence combining breathwork and gentle movement.',
    480, true, ARRAY['yoga', 'breathwork', 'morning'], true
  )
ON CONFLICT DO NOTHING;

-- Set fun prices on the paid video (3-min × $1/$2/$3 per min ≈ $3.33 / $6.66 / $9.99 for 3 min;
-- this is ~18 min so: $18 → $18.88 / $36 → $36.66 / $54 → $55.55)
UPDATE public.videos
SET price_supported = 18.88, price_community = 36.66, price_abundance = 55.55
WHERE title = 'Kettlebell Swing Masterclass';

-- ── Sample live session ──────────────────────────────────────
INSERT INTO public.live_sessions (creator_id, title, description, scheduled_at, duration_minutes) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Open Movement Lab',
    'Drop in, ask questions, work on whatever you''re training. All levels welcome.',
    NOW() + INTERVAL '3 days', 60
  )
ON CONFLICT DO NOTHING;

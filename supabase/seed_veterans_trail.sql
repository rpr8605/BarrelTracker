-- Veterans Whiskey Trail seed data
WITH trail AS (
  INSERT INTO trails (name, description)
  VALUES (
    'Veterans Whiskey Trail',
    'A journey through veteran-owned and veteran-supporting American craft distilleries.'
  )
  RETURNING id
)
INSERT INTO trail_stops (trail_id, stop_number, name, location, experience_type, experience_config)
SELECT
  trail.id,
  stops.stop_number,
  stops.name,
  stops.location,
  stops.experience_type,
  stops.experience_config
FROM trail,
(VALUES
  (
    1,
    '10th Mountain Whiskey & Spirit Co.',
    'Vail, CO',
    'veteran_story',
    '{"prompt":"Share what service means to you","story_title":"Mountain Division Legacy"}'::jsonb
  ),
  (
    2,
    'Willie''s Distillery',
    'Ennis, MT',
    'tasting_challenge',
    '{"challenge":"Identify the grain bill","answer_options":["Wheat","Rye","Corn","Barley"],"correct":"Wheat"}'::jsonb
  ),
  (
    3,
    'Larrikin Bourbon',
    'Bardstown, KY',
    'barrel_scan',
    '{"hint":"Find the oldest barrel in the rickhouse"}'::jsonb
  ),
  (
    4,
    'BHAWK Distillery',
    'Statesville, NC',
    'cocktail_reveal',
    '{"cocktail_name":"Black Hawk Old Fashioned","recipe":"2oz BHAWK bourbon, 1 sugar cube, 2 dashes Angostura, orange peel"}'::jsonb
  ),
  (
    5,
    'Desert Door Sotol',
    'Driftwood, TX',
    'tasting_challenge',
    '{"challenge":"Name the plant sotol is distilled from","answer_options":["Agave","Dasylirion","Yucca","Saguaro"],"correct":"Dasylirion"}'::jsonb
  )
) AS stops(stop_number, name, location, experience_type, experience_config);

-- Badges
INSERT INTO badges (slug, name, description, category, criteria) VALUES
  (
    'trail_veterans_complete',
    'Trail Complete',
    'Completed the full Veterans Whiskey Trail',
    'trail',
    '{"trail":"Veterans Whiskey Trail","stops_required":5}'
  ),
  (
    'trail_veterans_halfway',
    'Halfway There',
    'Completed 3 stops on the Veterans Whiskey Trail',
    'trail',
    '{"trail":"Veterans Whiskey Trail","stops_required":3}'
  ),
  (
    'first_checkin',
    'First Step',
    'Completed your first trail stop check-in',
    'milestone',
    '{"checkins":1}'
  ),
  (
    'tasting_5',
    'Tasting Apprentice',
    'Submitted 5 tasting notes',
    'tasting',
    '{"tasting_notes":5}'
  ),
  (
    'tasting_25',
    'Tasting Expert',
    'Submitted 25 tasting notes',
    'tasting',
    '{"tasting_notes":25}'
  ),
  (
    'follow_3',
    'Community Member',
    'Following 3 or more distilleries',
    'community',
    '{"follows":3}'
  ),
  (
    'adoption_first',
    'Barrel Patron',
    'Adopted your first barrel',
    'distillery',
    '{"adoptions":1}'
  )
ON CONFLICT (slug) DO NOTHING;

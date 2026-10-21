-- =============================================================================
-- Migration: 20261019000004_seed_initial_categories.sql
-- Description: Seeds the core newsroom categories for Azaad Samachar
-- Idempotent: Uses ON CONFLICT (slug) DO NOTHING
-- =============================================================================

INSERT INTO public.categories (
  name,
  slug,
  english_name,
  description,
  color,
  display_order,
  is_active,
  show_in_navigation,
  is_primary
) VALUES
  ('ताज़ा खबरें', 'latest', 'Latest News', 'दिन भर की ताज़ा, त्वरित और लाइव ब्रेकिंग खबरें', '#DA251D', 1, true, true, true),
  ('राष्ट्रीय', 'national', 'National', 'देश भर की प्रमुख राष्ट्रीय खबरें, नीतियां एवं घटनाक्रम', '#c8102e', 2, true, true, true),
  ('राजनीति', 'politics', 'Politics', 'संसद, चुनाव, राजनीतिक दल और प्रशासनिक निर्णय', '#10264B', 3, true, true, true),
  ('उत्तर प्रदेश', 'uttar-pradesh', 'Uttar Pradesh', 'लखनऊ, वाराणसी, प्रयागराज, कानपुर सहित यूपी के सभी 75 जिलों की खबरें', '#DA251D', 4, true, true, true),
  ('दुनिया', 'world', 'World', 'अंतरराष्ट्रीय संबंध, कूटनीति, वैश्विक राजनीति और हलचल', '#2b580c', 5, true, true, true),
  ('बिज़नेस', 'business', 'Business', 'शेयर बाजार, अर्थव्यवस्था, उद्योग, स्टार्टअप्स और बजट विश्लेषण', '#0d7377', 6, true, true, true),
  ('खेल', 'sports', 'Sports', 'क्रिकेट, आईपीएल, ओलंपिक, हॉकी और खेल जगत के रोमांचक पल', '#e27802', 7, true, true, true),
  ('मनोरंजन', 'entertainment', 'Entertainment', 'बॉलीवुड, ओटीटी, सिनेमा समीक्षा और सेलिब्रिटी गपशप', '#8b008b', 8, true, true, true),
  ('टेक्नोलॉजी', 'technology', 'Technology', 'स्मार्टफोन, एआई, साइबर सुरक्षा, गैजेट्स और डिजिटल क्रांति', '#1e3d59', 9, true, true, true),
  ('शिक्षा', 'education', 'Education', 'सीबीएसई, बोर्ड परीक्षाएं, विश्वविद्यालय और उच्च शिक्षा समाचार', '#434d5f', 10, true, true, true),
  ('नौकरी', 'jobs', 'Jobs', 'सरकारी भर्ती, यूपीएससी, एसएससी, बैंक और रोजगार समाचार', '#2d3748', 11, true, true, true),
  ('लाइफस्टाइल', 'lifestyle', 'Lifestyle', 'स्वास्थ्य, योग, खान-पान, पर्यटन और जीवनशैली', '#557571', 12, true, true, false),
  ('धर्म/अध्यात्म', 'spirituality', 'Spirituality', 'पर्व-त्योहार, ज्योतिष, राशिफल, मंदिर दर्शन और सांस्कृतिक धरोहर', '#c06c84', 13, true, true, false),
  ('शिक्षा व नौकरी', 'education-jobs', 'Education & Jobs', 'सरकारी भर्ती, प्रतियोगी परीक्षाएं, परिणाम और करियर मार्गदर्शन', '#434d5f', 14, true, true, false)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  english_name = EXCLUDED.english_name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  show_in_navigation = EXCLUDED.show_in_navigation,
  is_primary = EXCLUDED.is_primary,
  updated_at = NOW();

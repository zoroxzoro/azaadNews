/**
 * WordPress Taxonomy to Supabase Categories & Tags Mapper
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Preserves the कानपुर (Kanpur) taxonomy as a primary distinct category (slug: 'kanpur')
 * alongside Uttar Pradesh and National.
 * Handles multi-category assignments and tags.
 */

export const CATEGORY_MAP = {
  // 1. Kanpur Local & Regional News (8,522 articles) -> Retained as 'kanpur'
  '9': {
    slug: 'kanpur',
    nameHindi: 'कानपुर',
    nameEnglish: 'Kanpur',
    isPrimary: true,
  },
  'कानपुर': {
    slug: 'kanpur',
    nameHindi: 'कानपुर',
    nameEnglish: 'Kanpur',
    isPrimary: true,
  },

  // Kanpur Dehat sub-beat (6 articles) -> maps to 'kanpur' with extra tag
  '1265': {
    slug: 'kanpur',
    nameHindi: 'कानपुर देहात',
    nameEnglish: 'Kanpur Dehat',
    extraTag: 'कानपुर देहात',
    isPrimary: true,
  },

  // 2. Bharat / National (2,308 articles)
  '3': {
    slug: 'national',
    nameHindi: 'राष्ट्रीय',
    nameEnglish: 'National',
    isPrimary: true,
  },
  'भारत': {
    slug: 'national',
    nameHindi: 'राष्ट्रीय',
    nameEnglish: 'National',
    isPrimary: true,
  },

  // 3. Uttar Pradesh State News (423 articles)
  '7': {
    slug: 'uttar-pradesh',
    nameHindi: 'उत्तर प्रदेश',
    nameEnglish: 'Uttar Pradesh',
    isPrimary: true,
  },
  'उत्तर-प्रदेश': {
    slug: 'uttar-pradesh',
    nameHindi: 'उत्तर प्रदेश',
    nameEnglish: 'Uttar Pradesh',
    isPrimary: true,
  },

  // Regional districts mapped to uttar-pradesh + tag
  '10': {
    slug: 'uttar-pradesh',
    nameHindi: 'उन्नाव',
    nameEnglish: 'Unnao',
    extraTag: 'उन्नाव',
    isPrimary: false,
  },
  '11': {
    slug: 'uttar-pradesh',
    nameHindi: 'लखनऊ',
    nameEnglish: 'Lucknow',
    extraTag: 'लखनऊ',
    isPrimary: false,
  },
  '1266': {
    slug: 'uttar-pradesh',
    nameHindi: 'औरैया',
    nameEnglish: 'Auraiya',
    extraTag: 'औरैया',
    isPrimary: false,
  },

  // 4. World / Desh-Videsh (325 articles)
  '4': {
    slug: 'world',
    nameHindi: 'दुनिया',
    nameEnglish: 'World',
    isPrimary: true,
  },
  'देश-विदेश': {
    slug: 'world',
    nameHindi: 'दुनिया',
    nameEnglish: 'World',
    isPrimary: true,
  },

  // 5. Sports / Khel (104 articles)
  '8': {
    slug: 'sports',
    nameHindi: 'खेल',
    nameEnglish: 'Sports',
    isPrimary: true,
  },
  'खेल': {
    slug: 'sports',
    nameHindi: 'खेल',
    nameEnglish: 'Sports',
    isPrimary: true,
  },

  // 6. Literature / Opinion / Poems (17 articles)
  '41': {
    slug: 'opinion',
    nameHindi: 'विचार / कविताएं',
    nameEnglish: 'Opinion',
    extraTag: 'कविताएं',
    isPrimary: true,
  },

  // 7. Spirituality & Culture (Ayodhya, Satya Sanatan, Dussehra)
  '69': {
    slug: 'spirituality',
    nameHindi: 'धर्म/अध्यात्म',
    nameEnglish: 'Spirituality',
    extraTag: 'श्री राम अयोध्या',
    isPrimary: true,
  },
  '1259': {
    slug: 'spirituality',
    nameHindi: 'धर्म/अध्यात्म',
    nameEnglish: 'Spirituality',
    extraTag: 'सत्य सनातन',
    isPrimary: true,
  },
  '1262': {
    slug: 'spirituality',
    nameHindi: 'धर्म/अध्यात्म',
    nameEnglish: 'Spirituality',
    extraTag: 'दशहरा',
    isPrimary: false,
  },

  // 8. Other States (Madhya Pradesh, Rajasthan)
  '6': {
    slug: 'national',
    nameHindi: 'राष्ट्रीय',
    nameEnglish: 'National',
    extraTag: 'मध्य प्रदेश',
    isPrimary: false,
  },
  '5': {
    slug: 'national',
    nameHindi: 'राष्ट्रीय',
    nameEnglish: 'National',
    extraTag: 'राजस्थान',
    isPrimary: false,
  },

  // 9. Editorial Flags
  '62': {
    flag: 'is_featured',
    note: 'Home Slider',
  },
  '63': {
    flag: 'is_trending',
    note: 'Trending News',
  },
};

/**
 * Resolves WordPress category term IDs into Supabase categories, tags, and flags
 */
export function resolveTaxonomies(termIds = [], termTaxonomies = new Map()) {
  const categories = [];
  const tags = [];
  let isFeatured = false;
  let isTrending = false;
  let primaryCategorySlug = 'latest';

  for (const termId of termIds) {
    const mapping = CATEGORY_MAP[String(termId)];
    if (mapping) {
      if (mapping.flag === 'is_featured') {
        isFeatured = true;
      } else if (mapping.flag === 'is_trending') {
        isTrending = true;
      } else if (mapping.slug) {
        if (!categories.some((c) => c.slug === mapping.slug)) {
          categories.push({
            slug: mapping.slug,
            name: mapping.nameHindi,
            englishName: mapping.nameEnglish,
            isPrimary: mapping.isPrimary && primaryCategorySlug === 'latest',
          });
        }
        if (mapping.isPrimary && primaryCategorySlug === 'latest') {
          primaryCategorySlug = mapping.slug;
        }
        if (mapping.extraTag && !tags.includes(mapping.extraTag)) {
          tags.push(mapping.extraTag);
        }
      }
    } else {
      // Check if term is a tag
      const termInfo = termTaxonomies.get(String(termId));
      if (termInfo && termInfo.taxonomy === 'post_tag' && termInfo.name) {
        if (!tags.includes(termInfo.name)) {
          tags.push(termInfo.name);
        }
      }
    }
  }

  // Fallback category if none resolved
  if (categories.length === 0) {
    categories.push({
      slug: 'national',
      name: 'राष्ट्रीय',
      englishName: 'National',
      isPrimary: true,
    });
    primaryCategorySlug = 'national';
  }

  return {
    categories,
    primaryCategorySlug,
    tags,
    isFeatured,
    isTrending,
  };
}

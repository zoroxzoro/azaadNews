/**
 * WordPress Historical Author Attribution Mapper
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Preserves original WordPress author IDs and public display names.
 * Ensures historical articles are credited accurately without silently
 * reassigning them to the Super Admin personal profile.
 */

// Known historical editorial desk profiles
export const HISTORICAL_AUTHORS = {
  '1': {
    legacyWpId: 1,
    username: 'azadsamachar78',
    displayNameHindi: 'आज़ाद समाचार डेस्क',
    displayNameEnglish: 'Azad Samachar Desk',
    role: 'editorial_desk',
    desk: 'मुख्य ब्यूरो (Headquarters)',
    location: 'कानपुर / नई दिल्ली',
    bio: 'आज़ाद समाचार का केंद्रीय समाचार संकलन एवं संपादकीय डेस्क।',
    email: 'azadsamachar78@gmail.com',
  },
};

/**
 * Resolves author attribution for a WordPress post
 */
export function resolveAuthor(authorId, wpUsers = new Map()) {
  const authorStr = String(authorId || '1');

  if (HISTORICAL_AUTHORS[authorStr]) {
    return {
      ...HISTORICAL_AUTHORS[authorStr],
    };
  }

  // If in wp_users
  const user = wpUsers.get(authorStr);
  if (user) {
    return {
      legacyWpId: Number(authorStr),
      username: user.login || `author-${authorStr}`,
      displayNameHindi: user.displayName || user.login || 'संवाददाता',
      displayNameEnglish: user.displayName || user.login || 'Reporter',
      role: 'author',
      desk: 'संवाददाता ब्यूरो',
      location: 'उत्तर प्रदेश',
      email: user.email || null,
    };
  }

  // Fallback
  return {
    legacyWpId: Number(authorStr),
    username: `wp-author-${authorStr}`,
    displayNameHindi: 'आज़ाद समाचार संवाददाता',
    displayNameEnglish: 'Azaad Samachar Reporter',
    role: 'author',
    desk: 'समाचार डेस्क',
    location: 'कानपुर',
    email: null,
  };
}

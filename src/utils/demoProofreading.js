/**
 * Demonstration Proofreading Rule Engine for Azaad Samachar
 *
 * NOTE: This is a client-side deterministic rule checker for UI evaluation and prototyping.
 * It analyzes the real text currently entered in the editor using verified journalistic rules
 * without making external network calls or using dummy prewritten data.
 */

import { findMatchesInDoc } from './editorTextMapping.js';

// ==========================================
// 1. HINDI PROOFREADING RULES
// ==========================================
export const HINDI_RULES = [
  // A. Spelling & Matra (वर्तनी अशुद्धि)
  {
    id: 'hi-sp-semiconductor',
    pattern: /सेमीकन्डक्टर/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'सेमीकंडक्टर',
    explanationHindi: "मानक हिंदी वर्तनी में पंचमाक्षर के स्थान पर अनुस्वार (ं) का प्रयोग अनुशंसित है। 'सेमीकंडक्टर' मानक रूप है।",
    explanationEnglish: "Standard Hindi journalistic orthography recommends anusvara (ं).",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-yojana',
    pattern: /योज़ना|योजाना/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'योजना',
    explanationHindi: "'योजना' शुद्ध मानक वर्तनी है। अतिरिक्त मात्रा या नुक्ता अशुद्ध है।",
    explanationEnglish: "'योजना' is the correct standard spelling.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-aarthik',
    pattern: /आर्तिक/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'आर्थिक',
    explanationHindi: "'आर्तिक' अशुद्ध वर्तनी है, शुद्ध रूप 'आर्थिक' (रेफ़ 'र्') है।",
    explanationEnglish: "Correct spelling is 'आर्थिक'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-cabinet',
    pattern: /कैबीनेट|केबिनेट/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'कैबिनेट',
    explanationHindi: "केंद्रीय मंत्रिमंडल के संदर्भ में मानक लिप्यंतरण 'कैबिनेट' (ह्रस्व 'इ' की मात्रा) है।",
    explanationEnglish: "Standard Hindi transliteration for Cabinet is 'कैबिनेट'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-sansadiya',
    pattern: /संसदिय/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'संसदीय',
    explanationHindi: "'संसदीय' में दीर्घ 'ई' की मात्रा शुद्ध है।",
    explanationEnglish: "'संसदीय' is the standard spelling.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-mahatvapurna',
    pattern: /महत्वपुर्ण/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'महत्वपूर्ण',
    explanationHindi: "'महत्वपूर्ण' में 'पूर्ण' दीर्घ 'ऊ' की मात्रा से लिखा जाता है।",
    explanationEnglish: "Correct spelling requires long 'ऊ' in 'महत्वपूर्ण'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-soochana',
    pattern: /सुचना/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'सूचना',
    explanationHindi: "'सूचना' में दीर्घ 'ऊ' की मात्रा शुद्ध मानक रूप है।",
    explanationEnglish: "Standard spelling is 'सूचना'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-shuru',
    pattern: /शुरु(?=[\s।॥,])/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'शुरू',
    explanationHindi: "'शुरू' के अंत में दीर्घ 'रू' की मात्रा मानक है।",
    explanationEnglish: "Correct form is 'शुरू'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-aitihasik',
    pattern: /इतिहासिक/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'ऐतिहासिक',
    explanationHindi: "'इतिहास' में 'इक' प्रत्यय लगने पर प्रारंभिक स्वर की वृद्धि होकर 'ऐतिहासिक' बनता है।",
    explanationEnglish: "Derivation with suffix '-ik' requires 'ऐतिहासिक'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-audyogik',
    pattern: /औधोगिक/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'औद्योगिक',
    explanationHindi: "शुद्ध वर्तनी 'औद्योगिक' ('द्य' संयुक्त व्यंजन) है।",
    explanationEnglish: "Correct spelling is 'औद्योगिक'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-rajnitik',
    pattern: /राजनितिक/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'राजनीतिक',
    explanationHindi: "'राजनीतिक' में 'नी' दीर्घ ई-कार रूप शुद्ध मानक है।",
    explanationEnglish: "'राजनीतिक' is the standard spelling.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-ujjwal',
    pattern: /उज्वल/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'उज्ज्वल',
    explanationHindi: "'उज्ज्वल' में दोहरे आधे 'ज्' (उ + त् + ज्वल = उज्ज्वल) की संधि होती है।",
    explanationEnglish: "Correct sandhi form is 'उज्ज्वल'.",
    isSafeToAutoApply: true,
  },

  // B. Grammar & Gender Agreement (व्याकरण व लिंग सामंजस्य)
  {
    id: 'hi-gr-manjoori',
    pattern: /मंजूरी दिया/g,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'मंजूरी दी',
    explanationHindi: "'मंजूरी' स्त्रीलिंग संज्ञा है, अतः भूतकालिक सकर्मक क्रिया 'दी' होनी चाहिए ('मंजूरी दिया' अशुद्ध है)।",
    explanationEnglish: "'मंजूरी' is a feminine noun; the verb must agree as 'मंजूरी दी'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-gr-sahmati',
    pattern: /सहमति बना/g,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'सहमति बनी',
    explanationHindi: "'सहमति' स्त्रीलिंग शब्द है, क्रिया रूप 'सहमति बनी' होना चाहिए।",
    explanationEnglish: "'सहमति' is feminine, verb should be 'बनी'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-gr-ghoshna',
    pattern: /घोषणा किया/g,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'घोषणा की',
    explanationHindi: "'घोषणा' स्त्रीलिंग संज्ञा है, अतः शुद्ध रूप 'घोषणा की' है।",
    explanationEnglish: "'घोषणा' is feminine, requires 'घोषणा की'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-gr-baithak',
    pattern: /बैठक हुआ/g,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'बैठक हुई',
    explanationHindi: "'बैठक' स्त्रीलिंग संज्ञा है, अतः 'बैठक हुई' शुद्ध प्रयोग है।",
    explanationEnglish: "'बैठक' is feminine, requires 'बैठक हुई'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-gr-faisla-plural-aux',
    pattern: /फैसला लिया हैं/g,
    category: 'grammar',
    severity: 'warning',
    confidence: 'high',
    suggestedText: 'फैसला लिया है',
    explanationHindi: "एकवचन कर्ता के साथ अनुस्वार रहित 'है' का प्रयोग होना चाहिए ('हैं' बहुवचन हेतु प्रयुक्त होता है)।",
    explanationEnglish: "Singular subject requires 'है' instead of plural 'हैं'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-gr-duplicate-ne',
    pattern: /ने\s+ने/g,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'ने',
    explanationHindi: "कारक चिह्न 'ने' का अनपेक्षित दोहराव हटाएँ।",
    explanationEnglish: "Remove duplicated postposition 'ने'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-gr-duplicate-ki',
    pattern: /कि\s+कि/g,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'कि',
    explanationHindi: "समुच्चयबोधक 'कि' का दोहराव हटाएँ।",
    explanationEnglish: "Remove duplicated conjunction 'कि'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-gr-duplicate-mein',
    pattern: /में\s+में/g,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'में',
    explanationHindi: "अधिकरण कारक 'में' का दोहराव हटाएँ।",
    explanationEnglish: "Remove duplicated postposition 'में'.",
    isSafeToAutoApply: true,
  },

  // C. Punctuation (विराम चिह्न)
  {
    id: 'hi-pu-double-exclamation',
    pattern: /!!+/g,
    category: 'punctuation',
    severity: 'warning',
    confidence: 'high',
    suggestedText: '!',
    explanationHindi: "पत्रकारिता लेखन में दोहरे या तिहरे विस्मयादिबोधक चिह्नों का प्रयोग अनुचित है। एकल चिह्न प्रयोग करें।",
    explanationEnglish: "Journalistic style requires a single exclamation mark.",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-pu-space-before-comma',
    pattern: /\s+,/g,
    category: 'punctuation',
    severity: 'warning',
    confidence: 'high',
    suggestedText: ',',
    explanationHindi: "अल्पविराम (कॉमा) से पूर्व अनावश्यक खाली स्थान (स्पेस) हटाएं।",
    explanationEnglish: "Remove unwanted space before comma.",
    isSafeToAutoApply: true,
  },

  // D. Style & Clarity (शैली व स्पष्टता)
  {
    id: 'hi-st-takriban',
    pattern: /तकरीबन\s+तकरीबन/g,
    category: 'style',
    severity: 'info',
    confidence: 'medium',
    suggestedText: 'लगभग',
    explanationHindi: "औपचारिक समाचार शैली में 'तकरीबन तकरीबन' के स्थान पर 'लगभग' या 'अनुमानतः' अधिक सटीक है।",
    explanationEnglish: "Use 'लगभग' for formal journalistic tone.",
    isSafeToAutoApply: false,
  },
  {
    id: 'hi-st-bahut-jyada',
    pattern: /बहुत\s+ही\s+ज्यादा/g,
    category: 'clarity',
    severity: 'info',
    confidence: 'medium',
    suggestedText: 'अत्यधिक',
    explanationHindi: "संपादकीय प्रवाह को चुस्त बनाने के लिए 'बहुत ही ज्यादा' के स्थान पर 'अत्यधिक' या 'उल्लेखनीय' का प्रयोग करें।",
    explanationEnglish: "Use concise phrasing 'अत्यधिक'.",
    isSafeToAutoApply: false,
  },
];

// ==========================================
// 2. ENGLISH PROOFREADING RULES
// ==========================================
export const ENGLISH_RULES = [
  // A. Spelling
  {
    id: 'en-sp-goverment',
    pattern: /\bgoverment\b/gi,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'government',
    explanationHindi: "अंग्रेजी वर्तनी 'government' (अक्षर 'n' सहित) शुद्ध है।",
    explanationEnglish: "Spelling error: missing 'n' in 'government'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'en-sp-parliamant',
    pattern: /\bparliamant\b/gi,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'parliament',
    explanationHindi: "अंग्रेजी वर्तनी 'parliament' शुद्ध है।",
    explanationEnglish: "Spelling error: should be 'parliament'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'en-sp-developement',
    pattern: /\bdevelopement\b/gi,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'development',
    explanationHindi: "शुद्ध वर्तनी 'development' है।",
    explanationEnglish: "Spelling error: 'development' has no 'e' after 'p'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'en-sp-seperate',
    pattern: /\bseperate\b/gi,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'separate',
    explanationHindi: "शुद्ध वर्तनी 'separate' है।",
    explanationEnglish: "Spelling error: should be 'separate'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'en-sp-comittee',
    pattern: /\bcomittee\b|\bcommitee\b/gi,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'committee',
    explanationHindi: "'committee' में दोहरा 'm', दोहरा 't' और दोहरा 'e' होता है।",
    explanationEnglish: "Spelling error: 'committee' has double 'm', double 't', double 'e'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'en-sp-alot',
    pattern: /\balot\b/gi,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'a lot',
    explanationHindi: "'a lot' दो पृथक शब्दों में लिखा जाना चाहिए।",
    explanationEnglish: "'a lot' is written as two separate words.",
    isSafeToAutoApply: true,
  },

  // B. Grammar & Agreement
  {
    id: 'en-gr-gov-have',
    pattern: /\bthe\s+government\s+have\s+decided\b/gi,
    category: 'grammar',
    severity: 'warning',
    confidence: 'high',
    suggestedText: 'the government has decided',
    explanationHindi: "भारतीय समाचार शैली में 'government' एकवचन सामूहिक संज्ञा मानी जाती है, अतः 'has decided' मानक है।",
    explanationEnglish: "Subject-verb agreement: in standard Indian newsroom English, 'government' takes singular 'has'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'en-gr-duplicate-the',
    pattern: /\bthe\s+the\b/gi,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'the',
    explanationHindi: "अनपेक्षित दोहराव 'the the' हटाएं।",
    explanationEnglish: "Remove duplicated article 'the'.",
    isSafeToAutoApply: true,
  },
  {
    id: 'en-gr-duplicate-in',
    pattern: /\bin\s+in\b/gi,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'in',
    explanationHindi: "दोहराव 'in in' हटाएं।",
    explanationEnglish: "Remove duplicated preposition 'in'.",
    isSafeToAutoApply: true,
  },

  // C. Clarity & Style
  {
    id: 'en-st-in-order-to',
    pattern: /\bin\s+order\s+to\b/gi,
    category: 'clarity',
    severity: 'info',
    confidence: 'medium',
    suggestedText: 'to',
    explanationHindi: "संपादकीय चुस्ती के लिए 'in order to' के स्थान पर सीधे 'to' का प्रयोग अधिक प्रभावशाली है।",
    explanationEnglish: "Concise writing: replace wordy 'in order to' with 'to'.",
    isSafeToAutoApply: false,
  },
];

/**
 * Runs the deterministic demonstration rule-based analysis on the TipTap ProseMirror document.
 *
 * @param {import('@tiptap/pm/model').Node} doc - The ProseMirror doc
 * @param {string} language - Article language ('hi' or 'en')
 * @returns {Array<Suggestion>}
 */
export function runDemoProofreading(doc, language = 'hi') {
  if (!doc) return [];

  const rules = language === 'en' ? ENGLISH_RULES : HINDI_RULES;
  const suggestions = [];
  let suggestionIndex = 1;

  rules.forEach((rule) => {
    const matches = findMatchesInDoc(doc, rule.pattern);

    matches.forEach((match) => {
      // Suggestion object adhering to Section 6 schema
      suggestions.push({
        id: `sug-${rule.id}-${suggestionIndex++}`,
        ruleId: rule.id,
        type: rule.category, // 'spelling' | 'grammar' | 'punctuation' | 'clarity' | 'style'
        severity: rule.severity, // 'error' | 'warning' | 'info'
        confidence: rule.confidence, // 'high' | 'medium'
        originalText: match.matchedText,
        suggestedText: rule.suggestedText,
        explanation: language === 'en' ? rule.explanationEnglish : rule.explanationHindi,
        location: {
          from: match.from,
          to: match.to,
          length: match.to - match.from,
        },
        isSafeToAutoApply: rule.isSafeToAutoApply,
      });
    });
  });

  // Sort suggestions by document position ascending
  suggestions.sort((a, b) => a.location.from - b.location.from);

  return suggestions;
}

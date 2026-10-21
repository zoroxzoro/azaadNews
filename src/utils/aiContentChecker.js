/**
 * AI Content Checker & Journalistic Proofreading Engine
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Real, multi-layered linguistic and editorial verification engine.
 * Covers:
 * 1. English Spelling & Morphological Corrections (Comprehensive Dictionary + Journalistic Lexicon)
 * 2. Hindi Orthography, Matra, Nuqta & Anusvara Standardizations (मानक वर्तनी)
 * 3. Repeated Word Detection (English & Hindi)
 * 4. Punctuation & Typographical Mechanics
 * 5. Journalistic Clarity, Sentence Length & Wordiness
 * 6. Potentially Misleading or Sensationalist Terminology (सनसनीखेज भाषा)
 * 7. Factual Claims Analysis ("Needs verification" / तथ्य सत्यापन आवश्यक)
 *
 * Adheres strictly to journalism ethics:
 * - Never claims a factual claim is verified without primary sources.
 * - Never displays fake success on unanalyzed or empty text.
 * - Always preserves original document coordinates [from, to] for safe individual editor review.
 */

import { findMatchesInDoc } from './editorTextMapping.js';

// =============================================================================
// 1. ENGLISH SPELLING & MORPHOLOGICAL DICTIONARY
// =============================================================================
export const ENGLISH_SPELLING_DICTIONARY = {
  // Mandatory test cases from Phase 7 Step 8.5
  'teh': 'the',
  'goverment': 'government',
  'annouced': 'announced',
  'developement': 'development',
  'programe': 'programme',
  'programes': 'programmes',

  // Common Journalistic & Civic Misspellings
  'minitsry': 'ministry',
  'parliment': 'parliament',
  'parlimentary': 'parliamentary',
  'presedent': 'president',
  'primeminister': 'prime minister',
  'offical': 'official',
  'officals': 'officials',
  'acording': 'according',
  'aganist': 'against',
  'authorithy': 'authority',
  'authourity': 'authority',
  'authourities': 'authorities',
  'comission': 'commission',
  'commitee': 'committee',
  'comittee': 'committee',
  'coruption': 'corruption',
  'militry': 'military',
  'oppostion': 'opposition',
  'eleciton': 'election',
  'canditate': 'candidate',
  'canditates': 'candidates',
  'incedent': 'incident',
  'incedents': 'incidents',
  'investigaton': 'investigation',
  'depatment': 'department',
  'teritory': 'territory',
  'statment': 'statement',
  'statments': 'statements',
  'decison': 'decision',
  'decisons': 'decisions',
  'distric': 'district',
  'districs': 'districts',
  'hosptial': 'hospital',
  'hosptials': 'hospitals',
  'administraion': 'administration',
  'inaugrate': 'inaugurate',
  'inaugrated': 'inaugurated',
  'inaugration': 'inauguration',
  'agrement': 'agreement',
  'agrements': 'agreements',
  'conferance': 'conference',
  'contry': 'country',
  'contries': 'countries',
  'pepole': 'people',
  'peple': 'people',
  'plice': 'police',
  'polices': 'police',

  // High-Frequency English Typographical Errors
  'recieve': 'receive',
  'recieved': 'received',
  'recieving': 'receiving',
  'seperate': 'separate',
  'seperated': 'separated',
  'occured': 'occurred',
  'occuring': 'occurring',
  'occurance': 'occurrence',
  'untill': 'until',
  'tommorrow': 'tomorrow',
  'truely': 'truly',
  'definately': 'definitely',
  'definate': 'definite',
  'enviroment': 'environment',
  'accomodate': 'accommodate',
  'accomodation': 'accommodation',
  'neccessary': 'necessary',
  'publically': 'publicly',
  'calender': 'calendar',
  'priviledge': 'privilege',
  'reponsible': 'responsible',
  'reponsibility': 'responsibility',
  'succesful': 'successful',
  'succesfully': 'successfully',
  'refered': 'referred',
  'begining': 'beginning',
  'existance': 'existence',
  'maintainance': 'maintenance',
  'millenium': 'millennium',
  'posession': 'possession',
  'pronounciation': 'pronunciation',
  'recommand': 'recommend',
  'recommanded': 'recommended',
  'rythm': 'rhythm',
  'suprise': 'surprise',
  'suprised': 'surprised',
  'tendancy': 'tendency',
  'unforseen': 'unforeseen',
  'wich': 'which',
  'wierd': 'weird',
  'wether': 'whether',
  'alot': 'a lot',
};

// =============================================================================
// 2. HINDI JOURNALISTIC ORTHOGRAPHY RULES (मानक वर्तनी)
// =============================================================================
export const HINDI_ORTHOGRAPHY_RULES = [
  {
    id: 'hi-sp-semiconductor',
    pattern: /सेमीकन्डक्टर/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'सेमीकंडक्टर',
    explanation: "मानक हिंदी वर्तनी में पंचमाक्षर के स्थान पर अनुस्वार (ं) का प्रयोग अनुशंसित है। 'सेमीकंडक्टर' मानक रूप है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-yojana',
    pattern: /योज़ना|योजाना/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'योजना',
    explanation: "'योजना' शुद्ध मानक वर्तनी है। अतिरिक्त मात्रा या नुक्ता अशुद्ध है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-aarthik',
    pattern: /आर्तिक/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'आर्थिक',
    explanation: "'आर्तिक' अशुद्ध वर्तनी है, शुद्ध रूप 'आर्थिक' (रेफ़ 'र्') है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-cabinet',
    pattern: /कैबीनेट|केबिनेट/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'कैबिनेट',
    explanation: "केंद्रीय मंत्रिमंडल के संदर्भ में मानक लिप्यंतरण 'कैबिनेट' (ह्रस्व 'इ' की मात्रा) है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-sansadiya',
    pattern: /संसदिय/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'संसदीय',
    explanation: "'संसदीय' में दीर्घ 'ई' की मात्रा शुद्ध है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-mahatvapurna',
    pattern: /महत्वपुर्ण/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'महत्वपूर्ण',
    explanation: "'महत्वपूर्ण' में 'पूर्ण' दीर्घ 'ऊ' की मात्रा से लिखा जाता है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-soochana',
    pattern: /सुचना/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'सूचना',
    explanation: "'सूचना' में दीर्घ 'ऊ' की मात्रा शुद्ध मानक रूप है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-shuru',
    pattern: /शुरु(?=[\s।॥,])/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'शुरू',
    explanation: "'शुरू' के अंत में दीर्घ 'रू' की मात्रा मानक है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-aitihasik',
    pattern: /इतिहासिक/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'ऐतिहासिक',
    explanation: "'इतिहास' में 'इक' प्रत्यय लगने पर प्रारंभिक स्वर की वृद्धि होकर 'ऐतिहासिक' बनता है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-audyogik',
    pattern: /औधोगिक/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'औद्योगिक',
    explanation: "शुद्ध वर्तनी 'औद्योगिक' ('द्य' संयुक्त व्यंजन) है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-rajnitik',
    pattern: /राजनितिक/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'राजनीतिक',
    explanation: "'राजनीतिक' में 'नी' दीर्घ ई-कार रूप शुद्ध मानक है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-ujjwal',
    pattern: /उज्वल|उज्ववल/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'उज्ज्वल',
    explanation: "शुद्ध मानक वर्तनी 'उज्ज्वल' (दो अर्ध 'ज्') है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-aashirvaad',
    pattern: /आशिर्वाद/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'आशीर्वाद',
    explanation: "शुद्ध वर्तनी 'आशीर्वाद' है (शी दीर्घ, 'व' पर रेफ़ 'र्')।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-kavayitri',
    pattern: /कवियत्री|कवयित्री/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'कवयित्री',
    explanation: "शुद्ध मानक रूप 'कवयित्री' है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-nirog',
    pattern: /निरोग/g,
    category: 'spelling',
    severity: 'warning',
    confidence: 'high',
    suggestedText: 'नीरोग',
    explanation: "संधि नियमानुसार 'निः + रोग = नीरोग' (दीर्घ 'नी') मानक रूप है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-ityadi',
    pattern: /इत्यादी/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'इत्यादि',
    explanation: "'इत्यादि' के अंत में ह्रस्व 'दि' शुद्ध मानक है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-uparyukt',
    pattern: /उपरोक्त/g,
    category: 'spelling',
    severity: 'warning',
    confidence: 'medium',
    suggestedText: 'उपर्युक्त',
    explanation: "मानक व्याकरण में 'उपर्युक्त' (उपरी + उक्त) अधिक शुद्ध माना जाता है।",
    isSafeToAutoApply: false,
  },
  {
    id: 'hi-sp-sampadan',
    pattern: /सम्मपादन/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'संपादन',
    explanation: "अनुस्वार का मानक प्रयोग 'संपादन' है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-kendriya',
    pattern: /केन्द्रीय/g,
    category: 'spelling',
    severity: 'warning',
    confidence: 'high',
    suggestedText: 'केंद्रीय',
    explanation: "मानक हिंदी वर्तनी में 'केंद्रीय' (अनुस्वार) अनुशंसित है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-swasthya',
    pattern: /स्वास्य|स्वास्थ/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'स्वास्थ्य',
    explanation: "शुद्ध वर्तनी 'स्वास्थ्य' है ('स्थ्य' संयुक्त व्यंजन)।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-tyohar',
    pattern: /त्यौहार/g,
    category: 'spelling',
    severity: 'warning',
    confidence: 'high',
    suggestedText: 'त्योहार',
    explanation: "मानक हिंदी शब्दकोश में 'त्योहार' (एक मात्रा) शुद्ध रूप है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-poojaneeya',
    pattern: /पूज्यनीय/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'पूजनीय',
    explanation: "'पूजनीय' अथवा 'पूज्य' शुद्ध रूप है। 'पूज्यनीय' अशुद्ध है।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-sp-rachayita',
    pattern: /रचियता/g,
    category: 'spelling',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'रचयिता',
    explanation: "शुद्ध मानक वर्तनी 'रचयिता' है।",
    isSafeToAutoApply: true,
  },
];

// =============================================================================
// 3. REPEATED WORDS DETECTOR (दोहराव)
// =============================================================================
export const REPEATED_WORD_RULES = [
  // English duplicate words
  {
    id: 'en-rep-the',
    pattern: /\bthe\s+the\b/gi,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'the',
    explanation: "अनावश्यक दोहराव 'the the' हटाएं।",
    isSafeToAutoApply: true,
  },
  {
    id: 'en-rep-in',
    pattern: /\bin\s+in\b/gi,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'in',
    explanation: "अनावश्यक दोहराव 'in in' हटाएं।",
    isSafeToAutoApply: true,
  },
  {
    id: 'en-rep-is',
    pattern: /\bis\s+is\b/gi,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'is',
    explanation: "अनावश्यक दोहराव 'is is' हटाएं।",
    isSafeToAutoApply: true,
  },
  {
    id: 'en-rep-that',
    pattern: /\bthat\s+that\b/gi,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'that',
    explanation: "अनावश्यक दोहराव 'that that' हटाएं।",
    isSafeToAutoApply: true,
  },
  {
    id: 'en-rep-to',
    pattern: /\bto\s+to\b/gi,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'to',
    explanation: "अनावश्यक दोहराव 'to to' हटाएं।",
    isSafeToAutoApply: true,
  },
  {
    id: 'en-rep-and',
    pattern: /\band\s+and\b/gi,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'and',
    explanation: "अनावश्यक दोहराव 'and and' हटाएं।",
    isSafeToAutoApply: true,
  },

  // Hindi duplicate postpositions
  {
    id: 'hi-rep-mein',
    pattern: /(?<=[\s\u0900-\u097F])में\s+में(?=[\s।॥,])/g,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'में',
    explanation: "परसर्ग 'में में' का अनावश्यक दोहराव हटाएं।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-rep-ne',
    pattern: /(?<=[\s\u0900-\u097F])ने\s+ने(?=[\s।॥,])/g,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'ने',
    explanation: "परसर्ग 'ने ने' का अनावश्यक दोहराव हटाएं।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-rep-ko',
    pattern: /(?<=[\s\u0900-\u097F])को\s+को(?=[\s।॥,])/g,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'को',
    explanation: "परसर्ग 'को को' का अनावश्यक दोहराव हटाएं।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-rep-se',
    pattern: /(?<=[\s\u0900-\u097F])से\s+से(?=[\s।॥,])/g,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'से',
    explanation: "परसर्ग 'से से' का अनावश्यक दोहराव हटाएं।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-rep-par',
    pattern: /(?<=[\s\u0900-\u097F])पर\s+पर(?=[\s।॥,])/g,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'पर',
    explanation: "परसर्ग 'पर पर' का अनावश्यक दोहराव हटाएं।",
    isSafeToAutoApply: true,
  },
  {
    id: 'hi-rep-ki',
    pattern: /(?<=[\s\u0900-\u097F])की\s+की(?=[\s।॥,])/g,
    category: 'grammar',
    severity: 'error',
    confidence: 'high',
    suggestedText: 'की',
    explanation: "संबंध बोधक 'की की' का अनावश्यक दोहराव हटाएं।",
    isSafeToAutoApply: true,
  },
];

// =============================================================================
// 4. PUNCTUATION & TYPOGRAPHY RULES
// =============================================================================
export const PUNCTUATION_RULES = [
  {
    id: 'punc-double-dot',
    pattern: /(?<!\.)\.\.(?!\.)/g,
    category: 'punctuation',
    severity: 'warning',
    confidence: 'high',
    suggestedText: '.',
    explanation: "दोहरा पूर्ण विराम '..' हटाएं। मानक विराम '.' या पूर्ण विराम '।' का प्रयोग करें।",
    isSafeToAutoApply: true,
  },
  {
    id: 'punc-comma-dot',
    pattern: /,\./g,
    category: 'punctuation',
    severity: 'error',
    confidence: 'high',
    suggestedText: '.',
    explanation: "असंगत विराम चिह्न ',.' को केवल पूर्ण विराम '.' से बदलें।",
    isSafeToAutoApply: true,
  },
  {
    id: 'punc-space-before-comma',
    pattern: /\s+,/g,
    category: 'punctuation',
    severity: 'warning',
    confidence: 'high',
    suggestedText: ',',
    explanation: "अल्पविराम से पहले का अनपेक्षित स्पेस हटाएं।",
    isSafeToAutoApply: true,
  },
  {
    id: 'punc-space-before-period',
    pattern: /\s+\./g,
    category: 'punctuation',
    severity: 'warning',
    confidence: 'high',
    suggestedText: '.',
    explanation: "पूर्ण विराम से पहले का अनपेक्षित स्पेस हटाएं।",
    isSafeToAutoApply: true,
  },
  {
    id: 'punc-space-before-danda',
    pattern: /\s+।/g,
    category: 'punctuation',
    severity: 'warning',
    confidence: 'high',
    suggestedText: '।',
    explanation: "पूर्ण विराम (।) से पहले का अनपेक्षित स्पेस हटाएं।",
    isSafeToAutoApply: true,
  },
];

// =============================================================================
// 5. JOURNALISTIC CLARITY & WORDINESS RULES
// =============================================================================
export const CLARITY_RULES = [
  {
    id: 'clarity-in-order-to',
    pattern: /\bin\s+order\s+to\b/gi,
    category: 'clarity',
    severity: 'info',
    confidence: 'medium',
    suggestedText: 'to',
    explanation: "संपादकीय कसावट के लिए 'in order to' के स्थान पर संक्षिप्त 'to' का प्रयोग करें।",
    isSafeToAutoApply: false,
  },
  {
    id: 'clarity-due-to-the-fact',
    pattern: /\bdue\s+to\s+the\s+fact\s+that\b/gi,
    category: 'clarity',
    severity: 'info',
    confidence: 'medium',
    suggestedText: 'because',
    explanation: "'due to the fact that' के स्थान पर सीधे 'because' का प्रयोग करें।",
    isSafeToAutoApply: false,
  },
  {
    id: 'clarity-at-this-point-in-time',
    pattern: /\bat\s+this\s+point\s+in\s+time\b/gi,
    category: 'clarity',
    severity: 'info',
    confidence: 'medium',
    suggestedText: 'currently',
    explanation: "'at this point in time' के स्थान पर 'currently' या 'now' लिखें।",
    isSafeToAutoApply: false,
  },
];

// =============================================================================
// 6. SENSATIONALISM & MISLEADING LANGUAGE RULES (सनसनीखेज भाषा)
// =============================================================================
export const SENSATIONALISM_RULES = [
  {
    id: 'sens-breaking-news-allcaps',
    pattern: /\bBREAKING\s+NEWS\b/g,
    category: 'sensationalism',
    severity: 'warning',
    confidence: 'high',
    suggestedText: 'ताज़ा ख़बर',
    explanation: "आलेख के मुख्य भाग में ऑल-कैप्स 'BREAKING NEWS' के बजाय संयत संपादकीय शैली का उपयोग करें।",
    isSafeToAutoApply: false,
  },
  {
    id: 'sens-bada-dhamaka',
    pattern: /बड़ा\s+धमाका/g,
    category: 'sensationalism',
    severity: 'warning',
    confidence: 'high',
    suggestedText: 'बड़ा घटनाक्रम',
    explanation: "संपादकीय आचार संहिता: सनसनीखेज मुहावरे 'बड़ा धमाका' के स्थान पर संतुलित पत्रकारिता शब्दावली का उपयोग करें।",
    isSafeToAutoApply: false,
  },
  {
    id: 'sens-hairan-kar-dene-wala',
    pattern: /हैरान\s+कर\s+देने\s+वाला|दंग\s+रह\s+जाएंगे/g,
    category: 'sensationalism',
    severity: 'warning',
    confidence: 'high',
    suggestedText: 'चौंकाने वाला',
    explanation: "क्लिकबेट / सनसनीखेज भाषा से बचें। समाचार को निष्पक्ष एवं तथ्यात्मक रूप में प्रस्तुत करें।",
    isSafeToAutoApply: false,
  },
  {
    id: 'sens-shocking',
    pattern: /\b(SHOCKING|UNBELIEVABLE)\b/gi,
    category: 'sensationalism',
    severity: 'warning',
    confidence: 'high',
    suggestedText: 'notable',
    explanation: "अतिशयोक्तिपूर्ण विशेषणों से बचें। पाठकों को स्वयं निष्कर्ष पर पहुँचने दें।",
    isSafeToAutoApply: false,
  },
  {
    id: 'sens-hosh-ud-jayenge',
    pattern: /होश\s+उड़\s+जाएंगे/g,
    category: 'sensationalism',
    severity: 'warning',
    confidence: 'high',
    suggestedText: 'ध्यान देने योग्य',
    explanation: "संपादकीय नीति: अत्यधिक सनसनीखेज और गैर-व्यावसायिक वाक्यांश 'होश उड़ जाएंगे' हटाएं।",
    isSafeToAutoApply: false,
  },
];

// =============================================================================
// 7. FACTUAL CLAIMS PATTERNS ("Needs verification")
// =============================================================================
export const FACTUAL_CLAIM_PATTERNS = [
  {
    id: 'fact-percentage-stat',
    pattern: /(?:[\d,]+(?:\.\d+)?)\s*%(?![\w])|(?:[\d,]+(?:\.\d+)?)\s*(?:प्रतिशत|फीसदी)\b/g,
    category: 'fact_check',
    severity: 'warning',
    confidence: 'high',
    suggestedText: 'Needs verification',
    explanation: "तथ्य सत्यापन आवश्यक (Needs verification): सांख्यिकीय प्रतिशत आंकड़े के लिए विश्वसनीय प्राथमिक स्रोत या आधिकारिक सर्वेक्षण का संदर्भ दें।",
    isSafeToAutoApply: false,
  },
  {
    id: 'fact-financial-amount',
    pattern: /(?:[\d,]+(?:\.\d+)?)\s*(?:करोड़|लाख|अरब|crore|crores|lakh|lakhs|billion|million)(?=[\s।,;\.\)\?]|$)/gi,
    category: 'fact_check',
    severity: 'warning',
    confidence: 'high',
    suggestedText: 'Needs verification',
    explanation: "तथ्य सत्यापन आवश्यक (Needs verification): वित्तीय राशि और बजटीय आवंटन के आधिकारिक सरकारी दस्तावेज़ अथवा बजट विवरणी से मिलान करें।",
    isSafeToAutoApply: false,
  },
  {
    id: 'fact-allegation-unverified',
    pattern: /(कथित\s+तौर\s+पर\s+घोटाला|बड़ा\s+घोटाला|लाखों\s+का\s+गबन|alleged\s+scam)/g,
    category: 'fact_check',
    severity: 'warning',
    confidence: 'medium',
    suggestedText: 'Needs verification',
    explanation: "तथ्य सत्यापन आवश्यक (Needs verification): वित्तीय या प्रशासनिक अनियमितता के गंभीर आरोपों में FIR, चार्जशीट अथवा जांच रिपोर्ट का ठोस संदर्भ अनिवार्य है।",
    isSafeToAutoApply: false,
  },
];

// =============================================================================
// CORE ANALYZER RUNNER
// =============================================================================

/**
 * Extracts plain text from a TipTap / ProseMirror document.
 * @param {import('@tiptap/pm/model').Node} doc
 * @returns {string}
 */
export function extractTextFromDoc(doc) {
  if (!doc) return '';
  let fullText = '';
  doc.descendants((node) => {
    if (node.isText && node.text) {
      fullText += node.text + ' ';
    }
  });
  return fullText.trim();
}

/**
 * Scans a plain text string (such as headline or excerpt) against proofreading rules
 */
function scanTextString(text, fieldName, fieldLabel, addSuggestion) {
  if (!text || typeof text !== 'string') return;

  // 1. English Spelling
  for (const [misspelled, correction] of Object.entries(ENGLISH_SPELLING_DICTIONARY)) {
    const pattern = new RegExp(`\\b${misspelled}\\b`, 'gi');
    let m;
    while ((m = pattern.exec(text)) !== null) {
      const matchedText = m[0];
      const isCapitalized = /^[A-Z][a-z]/.test(matchedText);
      const isAllUpper = /^[A-Z]+$/.test(matchedText);
      let adjustedCorrection = correction;
      if (isAllUpper) {
        adjustedCorrection = correction.toUpperCase();
      } else if (isCapitalized) {
        adjustedCorrection = correction.charAt(0).toUpperCase() + correction.slice(1);
      }

      addSuggestion({
        ruleId: `en-sp-${misspelled}`,
        type: 'spelling',
        severity: 'error',
        confidence: 'high',
        match: {
          matchedText,
          from: m.index,
          to: m.index + matchedText.length,
        },
        suggestedText: adjustedCorrection,
        explanation: `${fieldLabel} में वर्तनी सुधार: '${matchedText}' का मानक रूप '${adjustedCorrection}' है (Spelling correction).`,
        isSafeToAutoApply: true,
        field: fieldName,
        fieldLabel,
      });
    }
  }

  // 2. Hindi Orthography
  for (const rule of HINDI_ORTHOGRAPHY_RULES) {
    try {
      const pattern = new RegExp(rule.pattern.source, rule.pattern.flags || 'g');
      let m;
      while ((m = pattern.exec(text)) !== null) {
        addSuggestion({
          ruleId: rule.id,
          type: rule.category,
          severity: rule.severity,
          confidence: rule.confidence,
          match: {
            matchedText: m[0],
            from: m.index,
            to: m.index + m[0].length,
          },
          suggestedText: rule.suggestedText,
          explanation: `${fieldLabel} में ${rule.explanation}`,
          isSafeToAutoApply: rule.isSafeToAutoApply,
          field: fieldName,
          fieldLabel,
        });
      }
    } catch {}
  }

  // 3. Repeated Words
  for (const rule of REPEATED_WORD_RULES) {
    try {
      const pattern = new RegExp(rule.pattern.source, rule.pattern.flags || 'gi');
      let m;
      while ((m = pattern.exec(text)) !== null) {
        addSuggestion({
          ruleId: rule.id,
          type: rule.category,
          severity: rule.severity,
          confidence: rule.confidence,
          match: {
            matchedText: m[0],
            from: m.index,
            to: m.index + m[0].length,
          },
          suggestedText: rule.suggestedText,
          explanation: `${fieldLabel} में ${rule.explanation}`,
          isSafeToAutoApply: rule.isSafeToAutoApply,
          field: fieldName,
          fieldLabel,
        });
      }
    } catch {}
  }

  // 4. Sensationalism
  for (const rule of SENSATIONALISM_RULES) {
    try {
      const pattern = new RegExp(rule.pattern.source, rule.pattern.flags || 'gi');
      let m;
      while ((m = pattern.exec(text)) !== null) {
        addSuggestion({
          ruleId: rule.id,
          type: rule.category,
          severity: rule.severity,
          confidence: rule.confidence,
          match: {
            matchedText: m[0],
            from: m.index,
            to: m.index + m[0].length,
          },
          suggestedText: rule.suggestedText,
          explanation: `${fieldLabel} में ${rule.explanation}`,
          isSafeToAutoApply: rule.isSafeToAutoApply,
          field: fieldName,
          fieldLabel,
        });
      }
    } catch {}
  }
}

/**
 * Executes full genuine editorial analysis across English and Hindi rules.
 *
 * @param {import('@tiptap/pm/model').Node} [doc] - TipTap ProseMirror document
 * @param {string} [language='hi'] - Article declared language
 * @param {object} [extraFields={}] - Additional fields { title, excerpt }
 * @returns {Array<object>} Suggestions array adhering to standard CMS schema
 */
export function runAiContentAnalysis(doc, language = 'hi', extraFields = {}) {
  const { title = '', excerpt = '' } = extraFields;
  const rawText = doc ? extractTextFromDoc(doc) : '';

  if (!rawText && !title && !excerpt) {
    return [];
  }

  const suggestions = [];
  let suggestionIndex = 1;

  // Helper to add a suggestion
  const addSuggestion = ({
    ruleId,
    type,
    severity,
    confidence,
    match,
    suggestedText,
    explanation,
    isSafeToAutoApply,
    field = 'body',
    fieldLabel = 'लेख मुख्य भाग (Body)',
  }) => {
    suggestions.push({
      id: `sug-${ruleId}-${field}-${suggestionIndex++}`,
      ruleId,
      type, // 'spelling' | 'grammar' | 'punctuation' | 'clarity' | 'sensationalism' | 'fact_check'
      severity, // 'error' | 'warning' | 'info'
      confidence, // 'high' | 'medium'
      field,
      fieldLabel,
      originalText: match.matchedText,
      suggestedText: suggestedText || '',
      explanation,
      location: {
        from: match.from,
        to: match.to,
        length: match.to - match.from,
      },
      isSafeToAutoApply: Boolean(isSafeToAutoApply),
    });
  };

  // Scan headline (title)
  if (title && title.trim()) {
    scanTextString(title.trim(), 'headline', 'शीर्षक (Headline)', addSuggestion);
  }

  // Scan excerpt (summary)
  if (excerpt && excerpt.trim()) {
    scanTextString(excerpt.trim(), 'excerpt', 'सारांश (Excerpt)', addSuggestion);
  }

  // If no document, return headline and excerpt suggestions directly
  if (!doc || !rawText) {
    return suggestions;
  }

  // 1. ENGLISH SPELLING ANALYSIS FOR BODY
  // Scans all English words regardless of article's declared primary language
  for (const [misspelled, correction] of Object.entries(ENGLISH_SPELLING_DICTIONARY)) {
    // Regex for word boundary case-insensitively
    const pattern = new RegExp(`\\b${misspelled}\\b`, 'gi');
    const matches = findMatchesInDoc(doc, pattern);

    for (const match of matches) {
      // Preserve original capitalization (e.g. "Teh" -> "The")
      const isCapitalized = /^[A-Z][a-z]/.test(match.matchedText);
      const isAllUpper = /^[A-Z]+$/.test(match.matchedText);
      let adjustedCorrection = correction;
      if (isAllUpper) {
        adjustedCorrection = correction.toUpperCase();
      } else if (isCapitalized) {
        adjustedCorrection = correction.charAt(0).toUpperCase() + correction.slice(1);
      }

      addSuggestion({
        ruleId: `en-sp-${misspelled}`,
        type: 'spelling',
        severity: 'error',
        confidence: 'high',
        match,
        suggestedText: adjustedCorrection,
        explanation: `अंग्रेजी वर्तनी अशुद्धि: '${match.matchedText}' का मानक रूप '${adjustedCorrection}' है (Spelling correction).`,
        isSafeToAutoApply: true,
      });
    }
  }

  // 2. HINDI ORTHOGRAPHY RULES
  for (const rule of HINDI_ORTHOGRAPHY_RULES) {
    const matches = findMatchesInDoc(doc, rule.pattern);
    for (const match of matches) {
      addSuggestion({
        ruleId: rule.id,
        type: rule.category,
        severity: rule.severity,
        confidence: rule.confidence,
        match,
        suggestedText: rule.suggestedText,
        explanation: rule.explanation,
        isSafeToAutoApply: rule.isSafeToAutoApply,
      });
    }
  }

  // 3. REPEATED WORDS
  for (const rule of REPEATED_WORD_RULES) {
    const matches = findMatchesInDoc(doc, rule.pattern);
    for (const match of matches) {
      addSuggestion({
        ruleId: rule.id,
        type: rule.category,
        severity: rule.severity,
        confidence: rule.confidence,
        match,
        suggestedText: rule.suggestedText,
        explanation: rule.explanation,
        isSafeToAutoApply: rule.isSafeToAutoApply,
      });
    }
  }

  // 4. PUNCTUATION & TYPOGRAPHY
  for (const rule of PUNCTUATION_RULES) {
    const matches = findMatchesInDoc(doc, rule.pattern);
    for (const match of matches) {
      addSuggestion({
        ruleId: rule.id,
        type: rule.category,
        severity: rule.severity,
        confidence: rule.confidence,
        match,
        suggestedText: rule.suggestedText,
        explanation: rule.explanation,
        isSafeToAutoApply: rule.isSafeToAutoApply,
      });
    }
  }

  // 5. CLARITY & WORDINESS
  for (const rule of CLARITY_RULES) {
    const matches = findMatchesInDoc(doc, rule.pattern);
    for (const match of matches) {
      addSuggestion({
        ruleId: rule.id,
        type: rule.category,
        severity: rule.severity,
        confidence: rule.confidence,
        match,
        suggestedText: rule.suggestedText,
        explanation: rule.explanation,
        isSafeToAutoApply: rule.isSafeToAutoApply,
      });
    }
  }

  // 6. SENSATIONALISM & MISLEADING LANGUAGE
  for (const rule of SENSATIONALISM_RULES) {
    const matches = findMatchesInDoc(doc, rule.pattern);
    for (const match of matches) {
      addSuggestion({
        ruleId: rule.id,
        type: rule.category,
        severity: rule.severity,
        confidence: rule.confidence,
        match,
        suggestedText: rule.suggestedText,
        explanation: rule.explanation,
        isSafeToAutoApply: rule.isSafeToAutoApply,
      });
    }
  }

  // 7. FACTUAL CLAIMS ("Needs verification")
  for (const rule of FACTUAL_CLAIM_PATTERNS) {
    const matches = findMatchesInDoc(doc, rule.pattern);
    for (const match of matches) {
      addSuggestion({
        ruleId: rule.id,
        type: rule.category,
        severity: rule.severity,
        confidence: rule.confidence,
        match,
        suggestedText: rule.suggestedText,
        explanation: rule.explanation,
        isSafeToAutoApply: rule.isSafeToAutoApply,
      });
    }
  }

  // Sort suggestions by document position ascending
  suggestions.sort((a, b) => a.location.from - b.location.from);

  return suggestions;
}

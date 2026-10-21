/**
 * AI Content Checker Test Suite
 * Validates Phase 7 Step 8.5 Linguistic & Factual Verification Engine
 */

import { runAiContentAnalysis } from '../src/utils/aiContentChecker.js';

// Mock ProseMirror Doc Structure helper for node-based testing
function createMockDocFromText(text) {
  let currentPos = 1;
  const nodes = [];

  // Split into paragraphs by newline
  const paragraphs = text.split('\n');
  paragraphs.forEach((pText) => {
    const textNode = {
      isText: true,
      text: pText,
    };
    nodes.push({
      node: textNode,
      pos: currentPos,
    });
    // TipTap doc position increments by text length + 2 for block tags
    currentPos += pText.length + 2;
  });

  return {
    descendants: (callback) => {
      nodes.forEach(({ node, pos }) => {
        callback(node, pos);
      });
    },
  };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

console.log('=== TEST SUITE: AI CONTENT CHECKER FUNCTIONAL VERIFICATION ===\n');

// -----------------------------------------------------------------------------
// TEST 1: MANDATORY SPEC SENTENCE
// "Teh goverment annouced a new developement programe in Kanpur."
// -----------------------------------------------------------------------------
console.log('TEST 1: Mandatory Misspelled English Sentence');
const mandatoryText = 'Teh goverment annouced a new developement programe in Kanpur.';
const mandatoryDoc = createMockDocFromText(mandatoryText);
const mandatorySuggestions = runAiContentAnalysis(mandatoryDoc, 'hi'); // Tested in 'hi' to verify cross-language robustness!

console.log(`Detected ${mandatorySuggestions.length} issues in mandatory sentence:`);
mandatorySuggestions.forEach((s) => console.log(`   [${s.type}] "${s.originalText}" -> "${s.suggestedText}" (${s.explanation})`));

assert(mandatorySuggestions.some((s) => s.originalText === 'Teh' && s.suggestedText === 'The'), 'Identified "Teh" -> "The"');
assert(mandatorySuggestions.some((s) => s.originalText === 'goverment' && s.suggestedText.toLowerCase() === 'government'), 'Identified "goverment" -> "government"');
assert(mandatorySuggestions.some((s) => s.originalText === 'annouced' && s.suggestedText.toLowerCase() === 'announced'), 'Identified "annouced" -> "announced"');
assert(mandatorySuggestions.some((s) => s.originalText === 'developement' && s.suggestedText.toLowerCase() === 'development'), 'Identified "developement" -> "development"');
assert(mandatorySuggestions.some((s) => s.originalText === 'programe' && (s.suggestedText === 'programme' || s.suggestedText === 'program')), 'Identified "programe" -> "programme"');
assert(mandatorySuggestions.length >= 5, 'Caught all 5 deliberate misspellings in the mandatory sentence');

// -----------------------------------------------------------------------------
// TEST 2: HINDI ORTHOGRAPHY & PUNCTUATION
// -----------------------------------------------------------------------------
console.log('\nTEST 2: Hindi Orthography & Punctuation Rules');
const hindiText = 'सरकार ने सेमीकन्डक्टर की नई योज़ना और आर्तिक नीति संसदिय पटल पर पेश की..';
const hindiDoc = createMockDocFromText(hindiText);
const hindiSuggestions = runAiContentAnalysis(hindiDoc, 'hi');

console.log(`Detected ${hindiSuggestions.length} issues in Hindi test:`);
hindiSuggestions.forEach((s) => console.log(`   [${s.type}] "${s.originalText}" -> "${s.suggestedText}"`));

assert(hindiSuggestions.some((s) => s.originalText === 'सेमीकन्डक्टर' && s.suggestedText === 'सेमीकंडक्टर'), 'Corrected "सेमीकन्डक्टर" -> "सेमीकंडक्टर"');
assert(hindiSuggestions.some((s) => s.originalText === 'योज़ना' && s.suggestedText === 'योजना'), 'Corrected "योज़ना" -> "योजना"');
assert(hindiSuggestions.some((s) => s.originalText === 'आर्तिक' && s.suggestedText === 'आर्थिक'), 'Corrected "आर्तिक" -> "आर्थिक"');
assert(hindiSuggestions.some((s) => s.originalText === 'संसदिय' && s.suggestedText === 'संसदीय'), 'Corrected "संसदिय" -> "संसदीय"');
assert(hindiSuggestions.some((s) => s.originalText === '..' && s.suggestedText === '.'), 'Corrected double period ".." -> "."');

// -----------------------------------------------------------------------------
// TEST 3: REPEATED WORDS DETECTOR
// -----------------------------------------------------------------------------
console.log('\nTEST 3: Repeated Words in English & Hindi');
const repeatText = 'The the Prime Minister was in in Delhi और संसद में में चर्चा हुई।';
const repeatDoc = createMockDocFromText(repeatText);
const repeatSuggestions = runAiContentAnalysis(repeatDoc, 'hi');

console.log(`Detected ${repeatSuggestions.length} issues in repeated words test:`);
repeatSuggestions.forEach((s) => console.log(`   [${s.type}] "${s.originalText}" -> "${s.suggestedText}"`));

assert(repeatSuggestions.some((s) => s.originalText.toLowerCase() === 'the the' && s.suggestedText === 'the'), 'Detected duplicate "The the"');
assert(repeatSuggestions.some((s) => s.originalText.toLowerCase() === 'in in' && s.suggestedText === 'in'), 'Detected duplicate "in in"');
assert(repeatSuggestions.some((s) => s.originalText.includes('में में')), 'Detected duplicate "में में"');

// -----------------------------------------------------------------------------
// TEST 4: SENSATIONALISM DETECTION
// -----------------------------------------------------------------------------
console.log('\nTEST 4: Sensationalism & Misleading Language Flagging');
const sensText = 'बड़ा धमाका! BREAKING NEWS: इस खुलासे से आपके होश उड़ जाएंगे!';
const sensDoc = createMockDocFromText(sensText);
const sensSuggestions = runAiContentAnalysis(sensDoc, 'hi');

console.log(`Detected ${sensSuggestions.length} issues in sensationalism test:`);
sensSuggestions.forEach((s) => console.log(`   [${s.type}] "${s.originalText}" (${s.explanation})`));

assert(sensSuggestions.some((s) => s.type === 'sensationalism' && s.originalText.includes('बड़ा धमाका')), 'Flagged clickbait "बड़ा धमाका"');
assert(sensSuggestions.some((s) => s.type === 'sensationalism' && s.originalText.includes('BREAKING NEWS')), 'Flagged all-caps "BREAKING NEWS"');
assert(sensSuggestions.some((s) => s.type === 'sensationalism' && s.originalText.includes('होश उड़ जाएंगे')), 'Flagged sensationalist "होश उड़ जाएंगे"');

// -----------------------------------------------------------------------------
// TEST 5: FACTUAL CLAIMS ("Needs verification")
// -----------------------------------------------------------------------------
console.log('\nTEST 5: Factual Claims Identification ("Needs verification")');
const factText = 'परियोजना के तहत 50,000 करोड़ रुपये का आवंटन किया गया और 45% की वृद्धि दर्ज की गई।';
const factDoc = createMockDocFromText(factText);
const factSuggestions = runAiContentAnalysis(factDoc, 'hi');

console.log(`Detected ${factSuggestions.length} issues in factual claims test:`);
factSuggestions.forEach((s) => console.log(`   [${s.type}] "${s.originalText}" -> "${s.suggestedText}" (${s.explanation})`));

assert(factSuggestions.some((s) => s.type === 'fact_check' && s.originalText.includes('50,000 करोड़')), 'Flagged large financial amount "50,000 करोड़" for verification');
assert(factSuggestions.some((s) => s.type === 'fact_check' && s.originalText.includes('45%')), 'Flagged statistical percentage "45%" for verification');
assert(factSuggestions.every((s) => s.type !== 'fact_check' || !s.isSafeToAutoApply), 'Fact checks never marked as safe to auto-apply');

// -----------------------------------------------------------------------------
// TEST 6: CLEAN ARTICLE SHOULD NOT INVENT ERRORS
// -----------------------------------------------------------------------------
console.log('\nTEST 6: Clean Article Verification (No False Positives)');
const cleanText = 'उत्तर प्रदेश के कानपुर में गंगा तट पर विकास कार्यों की समीक्षा की गई। जिला प्रशासन ने सभी संबंधित विभागों को समय पर कार्य पूर्ण करने के निर्देश दिए हैं।';
const cleanDoc = createMockDocFromText(cleanText);
const cleanSuggestions = runAiContentAnalysis(cleanDoc, 'hi');

console.log(`Clean article suggestions count: ${cleanSuggestions.length}`);
assert(cleanSuggestions.length === 0, 'Clean, well-written journalistic text receives zero false positive errors');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n=== TEST SUMMARY ===');
console.log(`Total Passed: ${passed}`);
console.log(`Total Failed: ${failed}`);

if (failed > 0) {
  console.error(`\nTest suite FAILED with ${failed} failure(s).`);
  process.exit(1);
} else {
  console.log('\nAll tests PASSED successfully!');
  process.exit(0);
}

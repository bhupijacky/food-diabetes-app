const { extractJsonFromText, parseParagraphs, validateResult } = require('./logic');

console.log("🚀 Starting NutriScan AI Paragraph Logic Validation...");

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name}`);
    failed++;
  }
}

// TEST 1: JSON EXTRACTION
const jsonText = "Conversation... {\"name\": \"Apple\", \"verdict\": \"Safe\", \"advice\": \"Fine\"} ...end";
const result = extractJsonFromText(jsonText);
assert("JSON extraction from text", result && result.name === "Apple");

// TEST 2: PARAGRAPH PARSING
const text = "This is the first thought.\n\nThis is the second thought.\n• Point that should be a paragraph.";
const paragraphs = parseParagraphs(text);
assert("Paragraph splitting", paragraphs.length === 3 && paragraphs[1] === "This is the second thought.");
assert("Bullet symbol cleaning", paragraphs[2] === "Point that should be a paragraph.");

// TEST 3: VALIDATION
assert("Data validation (Valid)", validateResult({name: "X", verdict: "Safe", advice: "Y"}) === true);

console.log(`\n📊 RESULTS: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);

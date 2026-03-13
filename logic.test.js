import { extractJsonFromText, parseBulletPoints, validateResult } from './logic';

describe('NutriScan AI Core Logic', () => {
  
  test('extractJsonFromText: parses JSON from conversational noise', () => {
    const text = "The AI says: {\"name\": \"Salad\", \"verdict\": \"Safe\", \"advice\": \"Eat more\"} and then stops.";
    const result = extractJsonFromText(text);
    expect(result.name).toBe("Salad");
    expect(result.verdict).toBe("Safe");
  });

  test('parseBulletPoints: cleans up AI formatting symbols', () => {
    const text = "• High fiber\n* Low sugar\n• Healthy fats";
    const result = parseBulletPoints(text);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe("High fiber");
    expect(result[1]).toBe("Low sugar");
    expect(result[2]).toBe("Healthy fats");
  });

  test('validateResult: ensures all critical data is present', () => {
    const valid = { name: "A", verdict: "Safe", advice: "Good" };
    const invalid = { name: "B" };
    expect(validateResult(valid)).toBe(true);
    expect(validateResult(invalid)).toBe(false);
  });

});

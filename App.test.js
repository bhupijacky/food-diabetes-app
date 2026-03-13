import { extractJsonFromText, parseBulletPoints } from './App';

// Mock AsyncStorage at the very top to prevent it from failing inside App.js imports
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock other native modules that App.js might touch
jest.mock('expo-image-picker', () => ({}));
jest.mock('@google/generative-ai', () => ({}));
jest.mock('@react-native-picker/picker', () => ({}));
jest.mock('lucide-react-native', () => ({}));

describe('NutriScan AI Logic Units', () => {
  
  test('extractJsonFromText: finds JSON in conversational text', () => {
    const rawText = "Sure, here is the result: {\"name\": \"Apple\", \"verdict\": \"Safe\"} Hope this helps!";
    const result = extractJsonFromText(rawText);
    expect(result).not.toBeNull();
    expect(result.name).toBe("Apple");
    expect(result.verdict).toBe("Safe");
  });

  test('extractJsonFromText: returns null for invalid text', () => {
    const rawText = "No JSON here!";
    const result = extractJsonFromText(rawText);
    expect(result).toBeNull();
  });

  test('parseBulletPoints: correctly identifies and cleans bullet points', () => {
    const rawText = "• Point one\n* Point two\n•   Point three with spaces";
    const result = parseBulletPoints(rawText);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe("Point one");
    expect(result[1]).toBe("Point two");
    expect(result[2]).toBe("Point three with spaces");
  });

});
